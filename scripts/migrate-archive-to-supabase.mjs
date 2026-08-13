import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY дутуу");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const root = path.join(process.cwd(), "data", "articles");
const files = (await readdir(root)).filter((file) => /^\d+\.json$/.test(file));
const slugify = (value) => value.toLocaleLowerCase("mn").normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 130);
const chunks = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
const publicationDate = (value = "") => {
  const normalized = (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "2013-01-01").replace(/^\d{4}/, "2026");
  return `${normalized === "2026-02-29" ? "2026-02-28" : normalized}T00:00:00+08:00`;
};

const articles = [];
for (const file of files) articles.push(JSON.parse(await readFile(path.join(root, file), "utf8")));
const categoryNames = [...new Set(articles.map((article) => article.category || "Бусад"))];
const { error: categoryError } = await supabase.from("categories").upsert(categoryNames.map((name) => ({ name, slug: slugify(name) || "busad" })), { onConflict: "slug" });
if (categoryError) throw categoryError;
const { data: categoryRows, error: categoryReadError } = await supabase.from("categories").select("id,name");
if (categoryReadError) throw categoryReadError;
const categoryIds = new Map(categoryRows.map((row) => [row.name, row.id]));

if (!process.argv.includes("--comments-only")) for (const [index, batch] of chunks(articles, 10).entries()) {
  const rows = batch.map((article) => ({
    legacy_id: Number(article.id), title: article.title || `Архив ${article.id}`,
    slug: `${slugify(article.title || "archive")}-${article.id}`, excerpt: article.excerpt || "",
    content: { type: "doc", content: [] }, content_html: article.contentHtml || "", cover_image: article.image || "",
    category_id: categoryIds.get(article.category || "Бусад") || null, category_name: article.category || "Бусад",
    author_id: `archive:${slugify(article.author || "CasperXtina") || "casperxtina"}`, author_name: article.author || "CasperXtina", author_email: "", status: "published", views: Number(article.views || 0),
    published_at: publicationDate(article.publishedAt),
    source_url: article.sourceUrl || null, archive_url: article.archiveUrl || null,
    archive_timestamp: article.archiveTimestamp || null, tags: article.tags || [],
  }));
  const { error } = await supabase.from("posts").upsert(rows, { onConflict: "legacy_id" });
  if (error) throw error;
  console.log(`posts ${Math.min((index + 1) * 10, articles.length)}/${articles.length}`);
}

const { data: postRows, error: postReadError } = await supabase.from("posts").select("id,legacy_id").not("legacy_id", "is", null);
if (postReadError) throw postReadError;
const postIds = new Map(postRows.map((row) => [String(row.legacy_id), row.id]));
const comments = articles.flatMap((article) => (article.comments || []).map((comment, index) => ({
  post_id: postIds.get(String(article.id)) || null, legacy_post_id: Number(article.id),
  legacy_key: `${article.id}:${comment.number || index + 1}:${comment.author || "guest"}`,
  author_name: comment.author || "Зочин", author_avatar: comment.avatar || "",
  body: comment.bodyText || "", body_html: comment.bodyHtml || "", legacy_number: comment.number || index + 1,
  status: "published", created_at: (() => { const parsed = Date.parse((comment.date || "").replace(" ", "T") + "+08:00"); return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString(); })(),
})).filter((comment) => comment.body));
for (const [index, batch] of chunks(comments, 100).entries()) {
  const { error } = await supabase.from("comments").upsert(batch, { onConflict: "legacy_key" });
  if (error) throw error;
  console.log(`comments ${Math.min((index + 1) * 100, comments.length)}/${comments.length}`);
}
console.log(`Migration complete: ${articles.length} posts, ${comments.length} comments`);





