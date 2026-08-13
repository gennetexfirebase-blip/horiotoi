import "server-only";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { CmsCategory, CmsPostRow } from "@/lib/cms-types";
import type { Article, ArticleSummary, Comment } from "@/lib/types";

const SUMMARY_COLUMNS = "id,legacy_id,title,slug,excerpt,cover_image,category_id,category_name,author_id,author_name,author_avatar,author_email,status,views,published_at,source_url,archive_url,archive_timestamp,tags,created_at,updated_at";
const PAGE_SIZE = 1000;

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
  const { data, error } = await supabase.from("posts").select("*").eq(column, identifier).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
  if (error || !data) return null; const row = data as CmsPostRow;
  const { data: commentRows } = await supabase.from("comments").select("*").eq("post_id", row.id).eq("status", "published").order("created_at", { ascending: true });
  const comments: Comment[] = (commentRows || []).map((comment, index) => ({ id: comment.id, author: comment.author_name, avatar: comment.author_avatar || "", date: comment.created_at, number: comment.legacy_number || index + 1, bodyHtml: comment.body_html || "", bodyText: comment.body }));
  return { ...rowToSummary(row), commentCount: comments.length, contentHtml: row.content_html, contentText: row.excerpt, tags: row.tags || [], comments };
});

export async function getDatabaseComments(legacyId: string): Promise<Comment[]> {
  const supabase = getSupabaseAdmin(); if (!supabase || !/^\d+$/.test(legacyId)) return [];
  const { data, error } = await supabase.from("comments").select("*").eq("legacy_post_id", Number(legacyId)).eq("status", "published").order("created_at", { ascending: true });
  if (error) return []; return (data || []).map((comment, index) => ({ id: comment.id, author: comment.author_name, avatar: comment.author_avatar || "", date: comment.created_at, number: comment.legacy_number || index + 1, bodyHtml: comment.body_html || "", bodyText: comment.body }));
}

export async function getAdminPosts(): Promise<CmsPostRow[]> {
  const supabase = getSupabaseAdmin(); if (!supabase) return []; const rows: CmsPostRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) { const { data, error } = await supabase.from("posts").select(SUMMARY_COLUMNS).is("legacy_id", null).order("updated_at", { ascending: false }).range(from, from + PAGE_SIZE - 1); if (error) return []; const batch = (data || []) as unknown as CmsPostRow[]; rows.push(...batch); if (batch.length < PAGE_SIZE) break; }
  return rows;
}
export async function getAdminPost(id: string): Promise<CmsPostRow | null> { const supabase = getSupabaseAdmin(); if (!supabase) return null; const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle(); return error ? null : (data as CmsPostRow | null); }
export async function getCmsCategories(): Promise<CmsCategory[]> { const supabase = getSupabaseAdmin(); if (!supabase) return []; const { data, error } = await supabase.from("categories").select("id,name,slug").order("name"); return error ? [] : ((data || []) as CmsCategory[]); }
