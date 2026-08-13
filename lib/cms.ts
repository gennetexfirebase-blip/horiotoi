import "server-only";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { CmsCategory, CmsPostRow } from "@/lib/cms-types";
import type { Article, ArticleSummary, Comment } from "@/lib/types";

const SUMMARY_COLUMNS = "id,legacy_id,title,slug,excerpt,cover_image,category_id,category_name,author_id,author_name,author_avatar,author_email,status,views,published_at,source_url,archive_url,archive_timestamp,tags,created_at,updated_at";
const PAGE_SIZE = 1000;

function withoutDuplicateCover(contentHtml: string, coverImage: string) {
  if (!contentHtml || !coverImage) return contentHtml;
  const images = [...contentHtml.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi)];
  const duplicate = images.find((image) => image[2] === coverImage);
  if (!duplicate || duplicate.index === undefined) return contentHtml;
  const cleaned = contentHtml.slice(0, duplicate.index) + contentHtml.slice(duplicate.index + duplicate[0].length);
  return cleaned.replace(/<p>\s*<\/p>/i, "").trim();
}

function rowToSummary(row: CmsPostRow): ArticleSummary {
  return { id: row.legacy_id ? String(row.legacy_id) : row.slug, databaseId: row.id, legacyId: row.legacy_id || undefined, source: "cms", title: row.title,
    sourceUrl: row.source_url || "", archiveUrl: row.archive_url || "", archiveTimestamp: row.archive_timestamp || undefined,
    category: row.category_name, excerpt: row.excerpt, image: row.cover_image, publishedAt: row.published_at || row.created_at,
    views: Number(row.views || 0), commentCount: 0, author: row.author_name || "CasperXtina" };
}

async function fetchPublishedRows() {
  const supabase = getSupabaseAdmin(); if (!supabase) return [] as CmsPostRow[];
  const rows: CmsPostRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from("posts").select(SUMMARY_COLUMNS).eq("status", "published")
      .is("legacy_id", null).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (error) return []; const batch = (data || []) as unknown as CmsPostRow[]; rows.push(...batch); if (batch.length < PAGE_SIZE) break;
  }
  return rows;
}

async function fetchCommentCounts() {
  const supabase = getSupabaseAdmin(); const counts = new Map<string, number>(); if (!supabase) return counts;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from("comments").select("post_id").eq("status", "published").not("post_id", "is", null).range(from, from + PAGE_SIZE - 1);
    if (error) break; const batch = data || []; for (const item of batch) counts.set(item.post_id, (counts.get(item.post_id) || 0) + 1); if (batch.length < PAGE_SIZE) break;
  }
  return counts;
}

export const getPublishedCmsPosts = cache(async (): Promise<ArticleSummary[]> => {
  const [rows, counts] = await Promise.all([fetchPublishedRows(), fetchCommentCounts()]);
  return rows.map((row) => ({ ...rowToSummary(row), commentCount: counts.get(row.id) || 0 }));
});

export const getCmsArticle = cache(async (identifier: string): Promise<Article | null> => {
  const supabase = getSupabaseAdmin(); if (!supabase) return null;
  const column = /^\d+$/.test(identifier) ? "legacy_id" : /^[0-9a-f-]{36}$/i.test(identifier) ? "id" : "slug";
  let row: CmsPostRow | null = null;
  for (let attempt = 0; attempt < 2 && !row; attempt += 1) {
    const { data, error } = await supabase.from("posts").select("*").eq(column, identifier).eq("status", "published").maybeSingle();
    if (!error && data && (!data.published_at || new Date(data.published_at).getTime() <= Date.now())) row = data as CmsPostRow;
  }
  if (!row) return null;
  const { data: commentRows } = await supabase.from("comments").select("*").eq("post_id", row.id).eq("status", "published").order("created_at", { ascending: true });
  const comments: Comment[] = (commentRows || []).map((comment, index) => ({ id: comment.id, author: comment.author_name, avatar: comment.author_avatar || "", date: comment.created_at, number: comment.legacy_number || index + 1, bodyHtml: comment.body_html || "", bodyText: comment.body }));
  return { ...rowToSummary(row), commentCount: comments.length, contentHtml: withoutDuplicateCover(row.content_html, row.cover_image), contentText: row.excerpt, tags: row.tags || [], comments };
});

export async function getDatabaseComments(legacyId: string): Promise<Comment[]> {
  const supabase = getSupabaseAdmin(); if (!supabase || !/^\d+$/.test(legacyId)) return [];
  const { data, error } = await supabase.from("comments").select("*").eq("legacy_post_id", Number(legacyId)).eq("status", "published").order("created_at", { ascending: true });
  if (error) return []; return (data || []).map((comment, index) => ({ id: comment.id, author: comment.author_name, avatar: comment.author_avatar || "", date: comment.created_at, number: comment.legacy_number || index + 1, bodyHtml: comment.body_html || "", bodyText: comment.body }));
}

export async function getAdminPosts(view: "current" | "archive" = "current"): Promise<CmsPostRow[]> {
  const supabase = getSupabaseAdmin(); if (!supabase) return []; const rows: CmsPostRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from("posts").select(SUMMARY_COLUMNS);
    query = view === "archive" ? query.not("legacy_id", "is", null) : query.is("legacy_id", null);
    const { data, error } = await query.order(view === "archive" ? "legacy_id" : "updated_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (error) return []; const batch = (data || []) as unknown as CmsPostRow[]; rows.push(...batch); if (batch.length < PAGE_SIZE) break;
  }
  return rows;
}
export async function getAdminPostCounts() {
  const supabase = getSupabaseAdmin(); if (!supabase) return { current: 0, archive: 0 };
  const [current, archive] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).is("legacy_id", null),
    supabase.from("posts").select("id", { count: "exact", head: true }).not("legacy_id", "is", null),
  ]);
  return { current: current.count || 0, archive: archive.count || 0 };
}
export async function getAdminPost(id: string): Promise<CmsPostRow | null> { const supabase = getSupabaseAdmin(); if (!supabase) return null; const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle(); return error ? null : (data as CmsPostRow | null); }
export async function getCmsCategories(): Promise<CmsCategory[]> { const supabase = getSupabaseAdmin(); if (!supabase) return []; const { data, error } = await supabase.from("categories").select("id,name,slug").order("name"); return error ? [] : ((data || []) as CmsCategory[]); }
