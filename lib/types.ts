export type Comment = {
  id?: string;
  author: string;
  date: string;
  number: number;
  avatar: string;
  bodyHtml: string;
  bodyText: string;
};

export type ArticleSummary = {
  id: string;
  databaseId?: string;
  legacyId?: number;
  source?: "archive" | "cms";
  title: string;
  sourceUrl: string;
  archiveUrl: string;
  archiveTimestamp?: string;
  category: string;
  categoryUrl?: string;
  excerpt: string;
  image: string;
  publishedAt: string;
  views: number;
  commentCount: number;
  author: string;
};

export type Article = ArticleSummary & {
  contentHtml: string;
  contentText: string;
  tags: string[];
  comments: Comment[];
};
