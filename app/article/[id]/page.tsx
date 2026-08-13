import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, MessageCircle, UserRound } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { CommentForm } from "@/components/comment-form";
import { ShareControls } from "@/components/share-controls";
import { ViewTracker } from "@/components/view-tracker";
import { getArticle, getArticles } from "@/lib/archive";
import { formatDate, formatNumber } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; const article = await getArticle(id);
  if (!article) return { title: "Нийтлэл олдсонгүй" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://horiotoi.org");
  const url = new URL(`/article/${article.id}`, siteUrl).toString();
  const description = (article.excerpt || article.contentText).replace(/\s+/g, " ").trim().slice(0, 300);
  const image = article.image ? new URL(article.image, siteUrl).toString() : new URL("/horiotoi-logo.png", siteUrl).toString();
  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "mn_MN", siteName: "Хориотой", title: article.title, description, url, publishedTime: article.publishedAt, authors: [article.author], images: [{ url: image, alt: article.title }] },
    twitter: { card: "summary_large_image", title: article.title, description, images: [image] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, allArticles] = await Promise.all([getArticle(id), getArticles()]);
  if (!article) notFound();
  const related = allArticles.filter((item) => item.id !== article.id && item.category === article.category).slice(0, 3);
  return <div className="article-page shell">
    <ViewTracker postId={article.databaseId} />
    <Link className="back-link" href="/archive"><ArrowLeft size={16} /> Архив руу буцах</Link>
    <article className="article-layout">
      <header className="article-header"><Link className="category-label" href={`/archive?category=${encodeURIComponent(article.category)}`}>{article.category}</Link><h1>{article.title}</h1><p>{article.excerpt}</p><div className="article-byline"><span><UserRound size={16} /> {article.author}</span><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time><span><Eye size={16} /> {formatNumber(article.views)}</span><span><MessageCircle size={16} /> {formatNumber(article.commentCount)}</span></div><ShareControls title={article.title} /></header>
      <div className="article-columns"><div className="article-main"><div className="article-content" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />{article.tags.length ? <div className="tag-list"><span>Шошго</span>{article.tags.map((tag) => <Link key={tag} href={`/archive?q=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div> : null}</div></div>
    </article>
    <section className="comments-section"><div className="comments-heading"><span>{String(article.comments.length).padStart(2, "0")}</span><div><small>2026 оны хэлэлцүүлэг</small><h2>Сэтгэгдлүүд</h2></div></div>{article.comments.length ? <div className="comments-list">{article.comments.map((comment, index) => <article className="comment" key={comment.id || `${comment.number}-${comment.author}-${index}`}><div className="comment-avatar" aria-hidden="true">{comment.author.slice(0, 1).toUpperCase()}</div><div><header><strong>{comment.author}</strong><time>{comment.date}</time><span>#{comment.number || index + 1}</span></header><div dangerouslySetInnerHTML={{ __html: comment.bodyHtml || `<p>${comment.bodyText}</p>` }} /></div></article>)}</div> : null}<CommentForm postId={article.databaseId} legacyPostId={article.source === "archive" ? Number(article.id) : undefined} /></section>
    {related.length ? <section className="related-section"><div className="section-heading"><div><span className="section-number">ДАРААХ</span><h2>Ижил ангиллаас</h2></div></div><div className="archive-grid related-grid">{related.map((item) => <ArticleCard key={item.id} article={item} />)}</div></section> : null}
  </div>;
}
