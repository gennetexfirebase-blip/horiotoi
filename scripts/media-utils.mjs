import * as cheerio from "cheerio";

const ORIGIN = "http://www.horiotoi.org";

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

function archiveAssetUrl(value, timestamp) {
  if (!value || value.startsWith("data:") || value.includes("web.archive.org/web/")) return value;
  return `https://web.archive.org/web/${timestamp}id_/${originalUrl(value)}`;
}

function youtubeId(value = "") {
  const decoded = value.replace(/&amp;/g, "&");
  return decoded.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:[^#]*&)?v=)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i)?.[1] || "";
}

function videoFrame(src, label = "Архивын видео") {
  const id = youtubeId(src);
  const safeSrc = id
    ? `https://www.youtube-nocookie.com/embed/${id}`
    : src.replace(/^http:/i, "https:").replace(/^\/\//, "https://");
  return `<div data-archive-video="true"><iframe src="${safeSrc}" title="${label}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
}

function trustedFrame(value = "") {
  try {
    const url = new URL(value.replace(/^\/\//, "https://"));
    return /(^|\.)youtube(?:-nocookie)?\.com$|(^|\.)youtu\.be$|^player\.vimeo\.com$|(^|\.)dailymotion\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function sanitizeMediaFragment(fragmentHtml, timestamp) {
  const $ = cheerio.load(`<div id="archive-fragment">${fragmentHtml || ""}</div>`, null, false);
  const root = $("#archive-fragment");

  root.find("script").each((_, element) => {
    const script = $(element);
    const source = script.html() || "";
    const urls = [...source.matchAll(/_uVideoPlayer\([\s\S]*?['\"]url['\"]\s*:\s*['\"]([^'\"]+)['\"]/gi)].map((match) => match[1]);
    if (urls.length) script.replaceWith(urls.map((url) => videoFrame(url)).join(""));
    else script.remove();
  });

  root.find("object").each((_, element) => {
    const object = $(element);
    const source = object.find("param[name='movie']").attr("value") || object.find("embed").attr("src") || "";
    if (youtubeId(source) || trustedFrame(source)) object.replaceWith(videoFrame(source));
    else object.remove();
  });

  root.find("embed").each((_, element) => {
    const embed = $(element);
    const source = embed.attr("src") || "";
    if (youtubeId(source) || trustedFrame(source)) embed.replaceWith(videoFrame(source));
    else embed.remove();
  });

  root.find("style,form,input,button,noscript").remove();
  root.find("*").each((_, element) => {
    const node = $(element);
    for (const name of Object.keys(element.attribs || {})) {
      if (name.toLowerCase().startsWith("on")) node.removeAttr(name);
      if (["style", "class", "id", "align", "width", "height", "frameborder", "scrolling"].includes(name)) node.removeAttr(name);
    }

    if (node.is("img")) {
      const src = node.attr("src");
      if (!src || src.includes("spacer.gif")) node.remove();
      else {
        node.attr("src", src.includes("web.archive.org/web/") ? src : `https://web.archive.org/web/${timestamp}im_/${originalUrl(src)}`);
        node.attr("loading", "lazy");
        node.attr("decoding", "async");
      }
    }

    if (node.is("a")) {
      const href = node.attr("href") || "";
      if (/^javascript:/i.test(href) || href === "#") node.replaceWith(node.contents());
      else if (/horiotoi\.org\/news\//i.test(href)) {
        const id = href.match(/-(\d+)(?:\/?(?:[?#].*)?)$/)?.[1] || "";
        node.attr("href", id ? `/article/${id}` : "/archive");
      } else if (href) {
        node.attr("href", href);
        node.attr("rel", "noreferrer");
        node.attr("target", "_blank");
      }
    }

    if (node.is("iframe")) {
      const src = node.attr("src") || "";
      if (youtubeId(src)) node.replaceWith(videoFrame(src));
      else if (trustedFrame(src)) {
        node.attr("src", src.replace(/^http:/i, "https:").replace(/^\/\//, "https://"));
        node.attr("loading", "lazy");
        node.attr("title", node.attr("title") || "Архивын видео");
        node.attr("allowfullscreen", "");
        node.wrap('<div data-archive-video="true"></div>');
      } else node.remove();
    }

    if (node.is("video")) {
      node.attr("controls", "");
      node.attr("preload", "metadata");
      node.removeAttr("autoplay");
      const src = node.attr("src");
      if (src) node.attr("src", archiveAssetUrl(src, timestamp));
      node.wrap('<div data-archive-video="true"></div>');
    }

    if (node.is("source") && node.closest("video").length) {
      const src = node.attr("src");
      if (src) node.attr("src", archiveAssetUrl(src, timestamp));
    }
  });

  return root.html() || "";
}

export function needsMediaRefresh(article) {
  if (/Хориотой сайт нийт|ХОРИОТОЙ АЙМШГИЙН ЧАТ|Сайтын нийт гишүүд/i.test(article.contentText || "")) return true;
  const hasMedia = /<(?:iframe|video)\b|data-archive-video/i.test(article.contentHtml || "");
  const likelyMedia = /видео|video|youtube|бичлэг/i.test(
    [article.category, article.title, article.excerpt, article.contentText].filter(Boolean).join(" "),
  );
  return likelyMedia && !hasMedia;
}
