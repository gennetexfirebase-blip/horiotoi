import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { HeroCarousel } from "@/components/hero-carousel";
import { getArticles, getCategories } from "@/lib/archive";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const articles = await getArticles(); const categories = getCategories(articles);
  const carousel = articles.slice(0, 4);
  const incidents = articles.filter((article) => article.category.toLocaleLowerCase("mn").includes("болсон явдал")).toSorted((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()).slice(0, 6);
  const latest = incidents.length ? incidents : articles.slice(4, 10); const highlights = articles.slice(10, 14);
  return <><section className="hero shell"><div className="hero-copy"><div className="kicker"><span /> Сүүлд нийтлэгдсэн</div><h1>Харанхуйд<br />үлдсэн <em>түүхүүд.</em></h1><p>Монголын анхны аймшгийн сайт. Алдагдсан мэт санагдсан мянга мянган нийтлэл архивын гүнээс эргэн ирлээ.</p><form className="hero-search" action="/archive"><Search size={20} aria-hidden="true" /><label className="sr-only" htmlFor="hero-query">Нийтлэл хайх</label><input id="hero-query" name="q" placeholder="Аймшгийн түүхээс хайх..." /><button type="submit" aria-label="Хайх"><ArrowRight size={19} /></button></form><div className="hero-stats"><div><strong>{formatNumber(articles.length)}</strong><span>архивлагдсан нийтлэл</span></div><div><strong>{categories.length}</strong><span>үндсэн ангилал</span></div><div><strong>{formatNumber(articles.filter((article) => article.category.toLocaleLowerCase("mn").includes("болсон явдал")).length)}</strong><span>нийт болсон явдал</span></div></div></div><HeroCarousel articles={carousel} /></section><section id="bolson-yavdal" className="section shell"><div className="section-heading"><div><span className="section-number">01</span><h2>Болсон явдал</h2></div><Link href="/archive?category=Болсон%20явдал">Бүгдийг үзэх <ArrowRight size={16} /></Link></div><div className="latest-grid">{latest.map((article) => <ArticleCard key={article.id} article={article} />)}</div></section>{highlights.length ? <section className="section shell compact-section"><div className="section-heading"><div><span className="section-number">02</span><h2>Архивын сонголт</h2></div></div><div className="highlight-list">{highlights.map((article,index)=><Link href={`/article/${article.id}`} key={article.id}><span className="highlight-index">{String(index+1).padStart(2,"0")}</span><span className="highlight-title">{article.title}<small>{article.category} · {formatDate(article.publishedAt)}</small></span><ArrowRight size={20}/></Link>)}</div></section>:null}</>;
}
