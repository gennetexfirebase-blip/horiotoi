"use client";

import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import type { ArticleSummary } from "@/lib/types";

const PAGE_SIZE = 18;
type Props = { articles: ArticleSummary[]; categories: { name: string; count: number }[]; initialCategory?: string; initialQuery?: string };

export function ArchiveBrowser({ articles, categories, initialCategory = "", initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery); const [category, setCategory] = useState(initialCategory); const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("mn"));
  const filtered = useMemo(() => articles.filter((article) => (!category || article.category === category) && (!deferredQuery || [article.title, article.excerpt, article.author].join(" ").toLocaleLowerCase("mn").includes(deferredQuery))), [articles, category, deferredQuery]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => number === 1 || number === pageCount || Math.abs(number - safePage) <= 2);
  function resetPagination() { setPage(1); }
  function goToPage(nextPage: number) { setPage(Math.max(1, Math.min(nextPage, pageCount))); document.querySelector(".archive-browser")?.scrollIntoView({ behavior: "smooth", block: "start" }); }

  return <div className="archive-browser"><div className="archive-toolbar"><label className="search-field"><Search size={19} aria-hidden="true" /><span className="sr-only">Архиваас хайх</span><input value={query} onChange={(event) => { setQuery(event.target.value); resetPagination(); }} placeholder="Гарчиг, агуулга, нийтлэгчээр хайх..." />{query ? <button type="button" onClick={() => { setQuery(""); resetPagination(); }} aria-label="Хайлтыг арилгах"><X size={17} /></button> : null}</label><label className="select-field"><SlidersHorizontal size={18} aria-hidden="true" /><span className="sr-only">Ангилал сонгох</span><select value={category} onChange={(event) => { setCategory(event.target.value); resetPagination(); }}><option value="">Бүх ангилал</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.count}</option>)}</select></label></div>
    <div className="results-line"><span><strong>{filtered.length.toLocaleString("mn-MN")}</strong> нийтлэл олдлоо</span>{category ? <button type="button" onClick={() => { setCategory(""); resetPagination(); }}>{category} <X size={13} /></button> : null}</div>
    {filtered.length ? <><div className="archive-grid">{pageItems.map((article) => <ArticleCard key={article.id} article={article} />)}</div>{pageCount > 1 ? <nav className="archive-pagination" aria-label="Архивын хуудас"><button type="button" disabled={safePage === 1} onClick={() => goToPage(safePage - 1)}><ChevronLeft size={15} /> Өмнөх</button><div>{pageNumbers.map((number, index) => <span key={number}>{index > 0 && number - pageNumbers[index - 1] > 1 ? <i>…</i> : null}<button type="button" className={number === safePage ? "active" : ""} aria-current={number === safePage ? "page" : undefined} onClick={() => goToPage(number)}>{number}</button></span>)}</div><button type="button" disabled={safePage === pageCount} onClick={() => goToPage(safePage + 1)}>Дараах <ChevronRight size={15} /></button></nav> : null}</> : <div className="empty-state"><span>404</span><h2>Ийм мөр олдсонгүй</h2><p>Хайлтын үгээ товчлох эсвэл өөр ангилал сонгоод үзээрэй.</p></div>}
  </div>;
}
