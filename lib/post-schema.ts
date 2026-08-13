import { z } from "zod";

export const slugify = (value: string) => value
  .toLocaleLowerCase("mn")
  .normalize("NFKD")
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 160);

export const postInputSchema = z.object({
  title: z.string().trim().min(2).max(240),
  slug: z.string().trim().min(2).max(180).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u),
  excerpt: z.string().trim().max(1000).default(""),
  content: z.record(z.string(), z.unknown()),
  contentHtml: z.string().max(2_000_000),
  coverImage: z.string().trim().max(2000).default(""),
  categoryId: z.string().uuid().nullable(),
  categoryName: z.string().trim().min(1).max(100),
  status: z.enum(["draft", "published", "rejected"]),
  publishedAt: z.string().datetime().nullable(),
});

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] || character);
}

