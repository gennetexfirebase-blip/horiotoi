import { readFile } from "node:fs/promises";

const id = process.argv[2] || "4532";
const article = JSON.parse(await readFile(new URL(`../data/articles/${id}.json`, import.meta.url), "utf8"));
const response = await fetch(article.archiveUrl, {
  headers: { "user-agent": "Mozilla/5.0 Chrome/127 Safari/537.36" },
  signal: AbortSignal.timeout(45_000),
});
const html = await response.text();
const patterns = [
  /<object[\s\S]*?<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /_uVideoPlayer\([\s\S]*?\);/gi,
  /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/gi,
];
const matches = [...new Set(patterns.flatMap((pattern) => html.match(pattern) || []))];
console.log(`status=${response.status} html=${html.length} media=${matches.length}`);
for (const match of matches) console.log(match.replace(/\s+/g, " ").slice(0, 1000));

import * as cheerio from "cheerio";
const $ = cheerio.load(html);
$("iframe[src*=youtube]").each((index, element) => {
  const node = $(element);
  const parents = node.parents().slice(0, 6).toArray().map((parent) => `${parent.tagName}.${$(parent).attr("class") || ""}`).join(" > ");
  console.log(`youtube[${index}] src=${node.attr("src")} maincont=${node.closest(".maincont").length} baseer=${node.closest(".baseer").length} basefull=${node.closest(".basefull").length} parents=${parents}`);
});
