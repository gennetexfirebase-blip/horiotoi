import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCmsArticle, getDatabaseComments, getPublishedCmsPosts } from "@/lib/cms";
import type { Article, ArticleSummary } from "@/lib/types";

const dataRoot = path.join(process.cwd(), "data");

function legacyDate(value: string) {
  if (!value) return "2026-01-01";
  return value.replace(/^\d{4}/, "2026");
}

function normalizeLegacySummary(article: ArticleSummary): ArticleSummary {
  return { ...article, source: "archive", author: article.author || "CasperXtina", publishedAt: legacyDate(article.publishedAt) };
}

const readArchiveIndex = cache(async (): Promise<ArticleSummary[]> => {
  const content = await readFile(path.join(dataRoot, "index.json"), "utf8");
  return (JSON.parse(content) as ArticleSummary[]).map(normalizeLegacySummary);
});

export const getArticles = cache(async (): Promise<ArticleSummary[]> => {
  const [archive, cms] = await Promise.all([readArchiveIndex(), getPublishedCmsPosts()]);
  const migrated = new Set(cms.map((item) => item.legacyId).filter(Boolean));
  return [...cms, ...archive.filter((item) => !migrated.has(Number(item.id)))];
});

export const getArticle = cache(async (id: string): Promise<Article | null> => {
  if (!/^\d+$/.test(id)) return getCmsArticle(id);
  try {
    const content = await readFile(path.join(dataRoot, "articles", id + ".json"), "utf8");
    const article = JSON.parse(content) as Article;
    const databaseComments = await getDatabaseComments(id);
    const known = new Set(article.comments.map((comment) => `${comment.author}|${comment.date}|${comment.bodyText}`));
    const newComments = databaseComments.filter((comment) => !known.has(`${comment.author}|${comment.date}|${comment.bodyText}`));
    return {
      ...article,
      source: "archive",
      author: article.author || "CasperXtina",
      publishedAt: legacyDate(article.publishedAt),
      comments: [...article.comments, ...newComments],
      commentCount: article.comments.length + newComments.length,
    };
  } catch {
    return getCmsArticle(id);
  }
});

export function getCategories(articles: ArticleSummary[]) {
  const counts = new Map<string, number>();
  for (const article of articles) counts.set(article.category, (counts.get(article.category) || 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

