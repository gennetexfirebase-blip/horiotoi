export type PostStatus = "draft" | "published" | "rejected";
export type CmsCategory = { id: string; name: string; slug: string };
export type CmsPostRow = {
  id: string; legacy_id: number | null; title: string; slug: string; excerpt: string;
  content: Record<string, unknown>; content_html: string; cover_image: string;
  category_id: string | null; category_name: string; author_id: string;
  author_name: string; author_avatar: string; author_email: string; status: PostStatus; views: number;
  published_at: string | null; source_url: string | null; archive_url: string | null;
  archive_timestamp: string | null; tags: string[]; created_at: string; updated_at: string;
};

