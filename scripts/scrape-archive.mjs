import * as cheerio from "cheerio";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { needsMediaRefresh, sanitizeMediaFragment } from "./media-utils.mjs";

const SNAPSHOT = "20130805191823";
const ARCHIVE = `https://web.archive.org/web/${SNAPSHOT}id_/`;
const IMAGE_ARCHIVE = `https://web.archive.org/web/${SNAPSHOT}im_/`;
const ORIGIN = "http://www.horiotoi.org";
void ARCHIVE;
void IMAGE_ARCHIVE;
const PAGE_COUNT = Number(process.env.HORIOTOI_PAGES || 224);
const CONCURRENCY = Number(process.env.HORIOTOI_CONCURRENCY || 10);
const ARTICLE_LIMIT = Number(process.env.HORIOTOI_LIMIT || 0);
const LIST_ONLY = process.argv.includes("--list-only");
const DATA_DIR = path.join(process.cwd(), "data");
const ARTICLE_DIR = path.join(DATA_DIR, "articles");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanText = (value = "") => value.replace(/\s+/g, " ").trim();

function originalUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value, `${ORIGIN}/`);
    if (parsed.hostname === "horiotoi.org") parsed.hostname = "www.horiotoi.org";
    if (parsed.hostname !== "www.horiotoi.org") return parsed.href;
    parsed.protocol = "http:";
    parsed.port = "";
    return parsed.href;
  } catch {
    return value;
  }
}

function archivePageUrl(value, timestamp = SNAPSHOT) {
  return `https://web.archive.org/web/${timestamp}id_/${originalUrl(value)}`;
}

function archiveImageUrl(value, timestamp = SNAPSHOT) {
  if (!value || value.startsWith("data:")) return value;
  if (value.includes("web.archive.org/web/")) return value;
  return `https://web.archive.org/web/${timestamp}im_/${originalUrl(value)}`;
}

async function fetchHtml(url, attempts = Number(process.env.HORIOTOI_ATTEMPTS || 5)) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function articleIdFromUrl(url) {
  const match = url.match(/-(\d+)(?:\/?(?:[?#].*)?)$/);
  return match?.[1] || "";
}

function listingPageUrl(page) {
  const target = page === 1 ? `${ORIGIN}/` : `${ORIGIN}/news/${page}`;
  return archivePageUrl(target);
}

function parseListing(html, page) {
  const $ = cheerio.load(html);
  const articles = [];
  $(".baseer, .basetext").each((_, element) => {
    const card = $(element);
    const titleLink = card.find(".heading h1 a, .heading h2 a").first();
    const sourceUrl = originalUrl(titleLink.attr("href"));
    const id = articleIdFromUrl(sourceUrl);
    if (!id || !sourceUrl.includes("/news/")) return;
    const title = cleanText(titleLink.text());
    const category =
      cleanText(card.find(".section a[href*='/news/'][href*='1-0-']").first().text()) ||
      cleanText(card.find(".heading p").first().text()) ||
      "Бусад";
    const meta = cleanText(card.find(".moreinfo,.morelink").text());
    const excerptRoot = card.find(".maincont").first().clone();
    const image = excerptRoot
      .find("img")
      .toArray()
      .map((img) => $(img).attr("src"))
      .find((src) => src && !src.includes("spacer.gif"));
    excerptRoot.find("img,.clr").remove();
    const excerpt = cleanText(excerptRoot.text());
    const dateMatch = sourceUrl.match(/\/(\d{4})-(\d{2})-(\d{2})-\d+\/?$/);
    articles.push({
      id,
      title,
      sourceUrl,
      archiveUrl: archivePageUrl(sourceUrl),
      category,
      excerpt,
      image: image ? archiveImageUrl(image) : "",
      publishedAt: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : "",
      views: Number(meta.match(/Уншсан(?::|\s*\()\s*(\d+)/)?.[1] || 0),
      commentCount: Number(meta.match(/Сэтгэгдэл(?::|:\s*\()\s*(\d+)/)?.[1] || 0),
      author:
        cleanText(card.find(".bs_author a").text()) ||
        cleanText(card.find(".section a[href^='javascript']").last().text()) ||
        "Хориотой",
      archivePage: page,
    });
  });
  return articles;
}

function parseComment($, table, timestamp) {
  const comment = $(table);
  const info = cleanText(comment.find(".infywka").text());
  const body = comment.find("td").last().clone();
  body.find(".mesige").remove();
  return {
    author: cleanText(comment.find(".mesige a").first().text()) || "Зочин",
    date: cleanText(info.replace(/Сэтгэгдэл\s*№\s*\d+/i, "").replace("Бичсэн өдөр:", "")),
    number: Number(info.match(/№\s*(\d+)/)?.[1] || 0),
    avatar: archiveImageUrl(comment.find(".avatariwe img").attr("src") || "", timestamp),
    bodyHtml: sanitizeMediaFragment(body.html(), timestamp),
    bodyText: cleanText(body.text()),
  };
}

function parseLegacyComment($, element, timestamp, index) {
  const comment = $(element);
  const mainCell = comment.find("> table > tbody > tr > td").eq(1);
  const heading = mainCell.find("> div").first().clone();
  const author = cleanText(heading.find("a").first().text()) || "Зочин";
  heading.find("a,.ofids").remove();
  const bodyCell = mainCell.find("> table td").first().clone();
  return {
    author,
    date: cleanText(heading.text()),
    number: index + 1,
    avatar: archiveImageUrl(comment.find("> table > tbody > tr > td").first().find("img").first().attr("src") || "", timestamp),
    bodyHtml: sanitizeMediaFragment(bodyCell.html(), timestamp),
    bodyText: cleanText(bodyCell.text()),
  };
}

function parseClassicComment($, element, timestamp, index) {
  const comment = $(element);
  const message = comment.find(".v_b_c_mes").first().clone();
  const header = cleanText(message.find("p").first().text());
  const author = cleanText(message.find("p a").first().text()) || "Зочин";
  message.find("p").first().remove();
  return {
    author,
    date: cleanText(header.replace(author, "").replace(/#\d+/, "").replace(/[()]/g, "")),
    number: Number(header.match(/#(\d+)/)?.[1] || index + 1),
    avatar: archiveImageUrl(comment.find(".v_b_ava img").first().attr("src") || "", timestamp),
    bodyHtml: sanitizeMediaFragment(message.html(), timestamp),
    bodyText: cleanText(message.text()),
  };
}

function parseStoryComment($, element, timestamp, index) {
  const comment = $(element);
  const body = comment.find(".comtext").first().clone();
  body.find(".clr").remove();
  return {
    author: cleanText(comment.find(".comauthr").text()) || "Зочин",
    date: cleanText(comment.find(".inf2").text()),
    number: Number(cleanText(comment.find(".comid").text()) || index + 1),
    avatar: "",
    bodyHtml: sanitizeMediaFragment(body.html(), timestamp),
    bodyText: cleanText(body.text()),
  };
}

function selectGenericContent($) {
  const blocked = "#allEntries,.comments,.comment,.sidebar,.left-sidebar,.right-sidebar,#right,header,footer,nav,.block,.catsTable,.news_bottom";
  const candidates = $("div,td")
    .toArray()
    .filter((element) => !$(element).is(blocked) && !$(element).parents(blocked).length)
    .map((element) => {
      const node = $(element);
      const clone = node.clone();
      clone.find("script,style,form,noscript").remove();
      const textLength = cleanText(clone.text()).length;
      const mediaCount = clone.find("img,iframe,video").length;
      const linkCount = clone.find("a").length;
      const formCount = clone.find("input,button,select,textarea").length;
      const directContent = clone.contents().filter((_, child) => child.type === "text" && cleanText($(child).text())).length;
      const score = textLength + mediaCount * 180 + directContent * 80 - linkCount * 18 - formCount * 300;
      return { node, score, textLength, mediaCount };
    })
    .filter((item) => item.textLength >= 60 || item.mediaCount > 0)
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.node || null;
}

function parseArticle(html, summary) {
  const $ = cheerio.load(html);
  const full = !$(".baseer, .basetext").length && $(".basefull .maincont").length > 0;
  const legacy = !$(".baseer, .basetext,.basefull").length && $(".center-block-content").length > 0;
  const classic = !$(".baseer, .basetext,.center-block-content").length && $(".eText").length > 0;
  const story = !$(".baseer, .basetext,.center-block-content,.eText").length && $(".story .stext").length > 0;
  const message = !$(".baseer, .basetext,.center-block-content,.eText,.story .stext").length && $(".eMessage").length > 0;
  const genericContent = selectGenericContent($, summary.title);
  const generic = !$(".baseer,.basetext,.basefull").length && !legacy && !classic && !story && !message && Boolean(genericContent);
  const article = full
    ? $(".basefull").first()
    : generic
    ? genericContent
    : message
    ? $(".eMessage").first().parent()
    : story
    ? $(".story").first()
    : classic
    ? $("#left").first()
    : legacy
      ? $(".center-block-content").first()
      : $(".baseer, .basetext").first();
  const content = full
    ? article.find(".maincont").first().clone()
    : generic
    ? article.clone()
    : message
    ? article.find(".eMessage").first().clone()
    : story
    ? article.find(".stext").first().clone()
    : classic
      ? article.find(".eText").first().clone()
      : legacy
        ? article.clone()
        : article.find(".maincont").first().clone();
  if (legacy) content.find("#coin-slider, center, hr, .news_bottom, script, style").remove();
  content.find("style,noscript").remove();
  const tags = content
    .find(".tagstore .eTag")
    .toArray()
    .map((tag) => cleanText($(tag).text()))
    .filter(Boolean);
  content.find(".tagstore,.storenumber,.clr").remove();
  const meta = cleanText(article.find(".moreinfo,.morelink").first().text());
  const contentText = cleanText(content.text());
  const sourceImage = content
    .find("img")
    .toArray()
    .map((image) => $(image).attr("src"))
    .find((src) => src && !src.includes("spacer.gif"));
  const categoryLink = full
    ? article.find(".section a[href*='1-0-']").first()
    : story
      ? article.find(".scat a").first()
      : legacy || classic || message || generic
        ? null
        : $("td a[href*='1-0-']").first();
  const comments = $(".comrightcont").length
    ? $(".comrightcont")
        .toArray()
        .map((element, index) => parseStoryComment($, element, summary.archiveTimestamp, index))
        .filter((comment) => comment.bodyText || comment.bodyHtml)
    : $(".v_b_c").length
    ? $(".v_b_c")
        .toArray()
        .map((element, index) => parseClassicComment($, element, summary.archiveTimestamp, index))
        .filter((comment) => comment.bodyText)
    : $(".lokol").length
    ? $(".lokol")
        .toArray()
        .map((element, index) => parseLegacyComment($, element, summary.archiveTimestamp, index))
        .filter((comment) => comment.bodyText)
    : $(".obolochka")
        .toArray()
        .map((table) => parseComment($, table, summary.archiveTimestamp))
        .filter((comment) => comment.bodyText || comment.author !== "Зочин");
  const legacyNumbers = legacy
    ? article
        .find(".news_statistics li")
        .toArray()
        .map((item) => Number(cleanText($(item).text()).match(/\d+/)?.[0] || 0))
        .filter(Boolean)
    : [];
  return {
    ...summary,
    title:
      cleanText(article.find(".heading h1,.heading h2,.dtitle").first().text()) ||
      (full ? cleanText(article.find(".heading > a").first().text()) : "") ||
      (legacy || classic || generic ? cleanText($("title").text().split("|")[0].split(" - Монголын")[0].replace(/^www\.?horiotoi\.org\s*-\s*/i, "")) : "") ||
      (message ? cleanText($("title").text().split(" - ").at(-1)) : "") ||
      summary.title,
    category:
      (categoryLink ? cleanText(categoryLink.text()) : "") ||
      (summary.category !== "Бусад" ? summary.category : "") ||
      (legacy || classic || story || message || generic || full ? "Хуучин архив" : "Бусад"),
    categoryUrl: categoryLink ? originalUrl(categoryLink.attr("href") || "") : "",
    contentHtml: sanitizeMediaFragment(content.html(), summary.archiveTimestamp),
    contentText,
    excerpt: summary.excerpt || `${contentText.slice(0, 260)}${contentText.length > 260 ? "…" : ""}`,
    image: summary.image || (sourceImage ? archiveImageUrl(sourceImage, summary.archiveTimestamp) : ""),
    tags,
    views: Number(meta.match(/Уншсан(?::|\s*\()\s*(\d+)/)?.[1] || (legacyNumbers.length > 1 ? legacyNumbers.at(-2) : 0) || summary.views),
    commentCount: Number(meta.match(/Сэтгэгдэл(?::|:\s*\()\s*(\d+)/)?.[1] || comments.length || summary.commentCount),
    author:
      cleanText(article.find(".bs_author a").first().text()) ||
      cleanText(article.find(".section a[href^='javascript']").last().text()) ||
      cleanText(article.find(".news_author a").first().text()) ||
      cleanText(article.find(".sinfbg a[href^='javascript']").first().text()) ||
      summary.author,
    comments,
  };
}

async function collectIndex() {
  console.log(`Listing pages: 1-${PAGE_COUNT}, concurrency ${CONCURRENCY}`);
  const pages = Array.from({ length: PAGE_COUNT }, (_, index) => index + 1);
  const pageResults = await mapConcurrent(pages, CONCURRENCY, async (page, index) => {
    try {
      const html = await fetchHtml(listingPageUrl(page));
      const result = parseListing(html, page);
      console.log(`[list ${index + 1}/${pages.length}] page ${page}: ${result.length}`);
      return result;
    } catch (error) {
      console.error(`[list ${page}] failed:`, error.message);
      return [];
    }
  });
  const unique = new Map();
  for (const article of pageResults.flat()) unique.set(article.id, article);
  return [...unique.values()].sort((a, b) => Number(b.id) - Number(a.id));
}

async function collectCdxIndex() {
  const query = new URL("https://web.archive.org/cdx/search/cdx");
  query.searchParams.set("url", "www.horiotoi.org/news/*");
  query.searchParams.set("output", "json");
  query.searchParams.set("fl", "timestamp,original,statuscode,mimetype");
  query.searchParams.append("filter", "statuscode:200");
  query.searchParams.append("filter", "mimetype:text/html");
  query.searchParams.set("collapse", "urlkey");
  query.searchParams.set("from", "2008");
  query.searchParams.set("to", "2013");
  query.searchParams.set("limit", "100000");
  const payload = JSON.parse(await fetchHtml(query.href));
  const unique = new Map();
  for (const [timestamp, rawUrl] of payload.slice(1)) {
    const sourceUrl = originalUrl(rawUrl);
    if (!/\/news\/(?:[^/]+\/)?\d{4}-\d{2}-\d{2}-\d+\/?$/i.test(sourceUrl)) continue;
    const id = articleIdFromUrl(sourceUrl);
    if (!id) continue;
    const dateMatch = sourceUrl.match(/\/(\d{4})-(\d{2})-(\d{2})-\d+\/?$/);
    const candidate = {
      id,
      title: "",
      sourceUrl,
      archiveUrl: archivePageUrl(sourceUrl, timestamp),
      archiveTimestamp: timestamp,
      category: "Бусад",
      categoryUrl: "",
      excerpt: "",
      image: "",
      publishedAt: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : "",
      views: 0,
      commentCount: 0,
      author: "Хориотой",
    };
    const current = unique.get(id);
    if (!current || timestamp > current.archiveTimestamp) unique.set(id, candidate);
  }
  return [...unique.values()].sort((a, b) => Number(b.id) - Number(a.id));
}

function toSummary(article) {
  const summary = { ...article };
  delete summary.contentHtml;
  delete summary.contentText;
  delete summary.comments;
  delete summary.tags;
  return summary;
}

async function main() {
  await mkdir(ARTICLE_DIR, { recursive: true });
  let summaries = process.argv.includes("--local-index") ? JSON.parse(await readFile(path.join(DATA_DIR, "index.json"), "utf8")) : process.argv.includes("--listings") ? await collectIndex() : await collectCdxIndex();
  try {
    const prior = JSON.parse(await readFile(path.join(DATA_DIR, "index.json"), "utf8"));
    const priorById = new Map(prior.map((article) => [article.id, article]));
    summaries = summaries.map((article) => ({ ...article, ...(priorById.get(article.id) || {}) }));
  } catch {
    // The first run has no prior metadata to merge.
  }
  await writeFile(path.join(DATA_DIR, "index.json"), `${JSON.stringify(summaries, null, 2)}\n`);
  console.log(`Unique articles: ${summaries.length}`);
  if (LIST_ONLY) return;

  let selected = ARTICLE_LIMIT ? summaries.slice(0, ARTICLE_LIMIT) : summaries;
  if (process.argv.includes("--failures-only")) {
    const priorFailures = JSON.parse(await readFile(path.join(DATA_DIR, "failures.json"), "utf8"));
    const failedIds = new Set(priorFailures.map((failure) => String(failure.id)));
    selected = summaries.filter((summary) => failedIds.has(String(summary.id)));
    console.log(`Retrying failures only: ${selected.length}`);
  }
  const failures = [];
  const articleResults = await mapConcurrent(selected, CONCURRENCY, async (summary, index) => {
    const target = path.join(ARTICLE_DIR, `${summary.id}.json`);
    if (process.argv.includes("--resume")) {
      try {
        const existing = JSON.parse(await readFile(target, "utf8"));
        const looksCorrupt = /sendFrm\d+|document\.(?:body|location)|function\s*\w*\s*\(/.test(existing.contentText || "");
        if (existing.contentHtml && !looksCorrupt && !needsMediaRefresh(existing)) {
          console.log(`[article ${index + 1}/${selected.length}] ${summary.id} cached`);
          return existing;
        }
      } catch {
        // Fetch missing or invalid files.
      }
    }
    try {
      const html = await fetchHtml(summary.archiveUrl);
      const article = parseArticle(html, summary);
      if (!article.contentText && !article.contentHtml) throw new Error("empty article body");
      await writeFile(target, `${JSON.stringify(article, null, 2)}\n`);
      console.log(`[article ${index + 1}/${selected.length}] ${summary.id} ${article.contentText.length} chars`);
      return article;
    } catch (error) {
      failures.push({ id: summary.id, url: summary.archiveUrl, error: error.message });
      console.error(`[article ${summary.id}] failed:`, error.message);
      return null;
    }
  });
  const successful = articleResults.filter(Boolean).map(toSummary);
  if (!process.argv.includes("--failures-only")) await writeFile(path.join(DATA_DIR, "index.json"), `${JSON.stringify(successful, null, 2)}\n`);
  await writeFile(path.join(DATA_DIR, "failures.json"), `${JSON.stringify(failures, null, 2)}\n`);
  console.log(`Finished. Articles: ${successful.length}, failures: ${failures.length}`);
}

await main();




