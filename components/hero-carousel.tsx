"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, MessageCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ArchiveImage } from "@/components/archive-image";
import { formatDate, formatNumber } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types";

export function HeroCarousel({ articles }: { articles: ArticleSummary[] }) {
  const [active, setActive] = useState(0);
  const count = articles.length;
  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [count]);
  if (!count) return null;
  const article = articles[active];
  const move = (direction: number) => setActive((value) => (value + direction + count) % count);
  return <section className="story-carousel" aria-roledescription="carousel" aria-label="Сүүлд нэмэгдсэн нийтлэлүүд">
    <Link className="story-carousel-image" href={`/article/${article.id}`}><ArchiveImage key={article.id} src={article.image} alt={article.title} priority sizes="(max-width: 900px) 100vw, 50vw" /></Link>
    <div className="story-carousel-color" /><div className="story-carousel-shade" />
    <div className="story-carousel-content"><span className="category-label">{article.category}</span><h2><Link href={`/article/${article.id}`}>{article.title}</Link></h2><div className="story-carousel-meta"><span><UserRound size={14} /> {article.author}</span><time>{formatDate(article.publishedAt)}</time><span><Eye size={15} /> {formatNumber(article.views)}</span><span><MessageCircle size={15} /> {formatNumber(article.commentCount)}</span></div></div>
    <div className="story-carousel-controls"><div className="story-carousel-dots">{articles.map((item,index)=><button key={item.id} className={index===active?"active":""} type="button" onClick={()=>setActive(index)} aria-label={`${index+1}-р нийтлэл`} aria-current={index===active?"true":undefined} />)}</div><div><button type="button" onClick={()=>move(-1)} aria-label="Өмнөх"><ArrowLeft /></button><button className="next" type="button" onClick={()=>move(1)} aria-label="Дараах"><ArrowRight /></button></div></div>
  </section>;
}
