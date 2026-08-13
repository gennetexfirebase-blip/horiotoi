import * as cheerio from "cheerio";

const allowedTags = new Set(["p", "br", "h2", "h3", "strong", "b", "em", "i", "blockquote", "ul", "ol", "li", "a", "img", "figure", "figcaption", "hr"]);
function safeUrl(value: string) { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""; } catch { return ""; } }

export function sanitizeCmsHtml(fragment: string) {
  const $ = cheerio.load(`<div id="cms-root">${fragment || ""}</div>`, null, false);
  const root = $("#cms-root");
  root.find("script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,svg").remove();
  root.find("*").each((_, element) => {
    const node = $(element); const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) { node.replaceWith(node.contents()); return; }
    const originalHref = node.attr("href") || ""; const originalSrc = node.attr("src") || ""; const originalAlt = node.attr("alt") || "";
    for (const name of Object.keys(element.attribs || {})) node.removeAttr(name);
    if (tag === "a") { const href = safeUrl(originalHref); if (href) node.attr({ href, rel: "noreferrer noopener", target: "_blank" }); }
    if (tag === "img") { const src = safeUrl(originalSrc); if (!src) node.remove(); else node.attr({ src, alt: originalAlt || "Нийтлэлийн зураг", loading: "lazy", decoding: "async" }); }
  });
  return root.html() || "";
}
