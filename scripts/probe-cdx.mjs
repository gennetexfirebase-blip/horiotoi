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

console.log(query.href);
const response = await fetch(query, {
  headers: { "user-agent": "Mozilla/5.0 horiotoi-owner-restoration/1.0" },
  signal: AbortSignal.timeout(300_000),
});
console.log(response.status, response.url);
const body = await response.text();
console.log(body.length, body.slice(0, 500));
const rows = JSON.parse(body).slice(1);
const articleRows = rows.filter(([, original]) => /\/news\/(?:[^/]+\/)?\d{4}-\d{2}-\d{2}-\d+\/?$/i.test(original));
const ids = new Set(articleRows.map(([, original]) => original.match(/-(\d+)\/?$/)?.[1]).filter(Boolean));
console.log("rows", rows.length, "article rows", articleRows.length, "unique ids", ids.size);
