import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import { ArchiveImage } from "@/components/archive-image";
import { formatDate, formatNumber } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types";

type ArticleCardProps = {
  article: ArticleSummary;
  featured?: boolean;
};

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <article className={"article-card " + (featured ? "article-card-featured" : "")}>
      <Link className="card-image" href={"/article/" + article.id}>
        <ArchiveImage src={article.image} alt={article.title} sizes={featured ? "(max-width: 900px) 100vw, 58vw" : undefined} />
      </Link>
      <div className="card-body">
        <div className="eyebrow-row">
          <Link href={"/archive?category=" + encodeURIComponent(article.category)} className="category-label">
            {article.category}
          </Link>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </div>
        <h3><Link href={"/article/" + article.id}>{article.title}</Link></h3>
        {article.excerpt ? <p>{article.excerpt}</p> : null}
        <div className="card-meta">
          <span><Eye size={14} /> {formatNumber(article.views)}</span>
          <span><MessageCircle size={14} /> {formatNumber(article.commentCount)}</span>
          <span className="author">{article.author}</span>
        </div>
      </div>
    </article>
  );
}
