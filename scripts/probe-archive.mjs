import * as cheerio from "cheerio";

const target = process.argv[2] || "http://www.horiotoi.org/";
const url = `https://web.archive.org/web/20130805191823id_/${target}`;

const response = await fetch(url, {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36",
  },
  signal: AbortSignal.timeout(30_000),
});

console.log(response.status, response.url);
const html = await response.text();
console.log(html.length, html.slice(0, 300));
console.log("TITLE", cheerio.load(html)("title").text());

const $ = cheerio.load(html);
for (const selector of [
  ".base",
  ".baseer",
  ".heading",
  ".maincont",
  ".mainside .base",
  ".mainside article",
]) {
  console.log(selector, $(selector).length);
}

$(".heading").slice(0, 5).each((_, element) => {
  console.log("HEADING", $(element).text().replace(/\s+/g, " ").trim());
  console.log("PARENT", $(element).parent().attr("class"));
});
