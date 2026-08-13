import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/archive";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  return [
    { url: "https://horiotoi.org", changeFrequency: "weekly", priority: 1 },
    { url: "https://horiotoi.org/archive", changeFrequency: "monthly", priority: 0.9 },
    ...articles.map((article) => ({
      url: "https://horiotoi.org/article/" + article.id,
      lastModified: article.publishedAt ? new Date(article.publishedAt) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
