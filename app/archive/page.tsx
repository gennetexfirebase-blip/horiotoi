import type { Metadata } from "next";
import { ArchiveBrowser } from "@/components/archive-browser";
import { getArticles, getCategories } from "@/lib/archive";

export const metadata: Metadata = {
  title: "Бүрэн архив",
  description: "Хориотой сайтын бүх нийтлэлийг хайх, ангиллаар шүүх бүрэн архив.",
};

type ArchivePageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const [articles, params] = await Promise.all([getArticles(), searchParams]);
  const categories = getCategories(articles);

  return (
    <section className="archive-page shell">
      <header className="page-intro">
        <div className="kicker"><span /> Дижитал өв</div>
        <h1>Бүрэн <em>архив</em></h1>
        <p>2008–2013 онд нийтлэгдсэн түүх, зураг, видео, тайлагдашгүй нууцуудыг нэг бүрчлэн эргэн үзнэ үү.</p>
      </header>
      <ArchiveBrowser
        key={`${params.category || "all"}:${params.q || ""}`}
        articles={articles}
        categories={categories}
        initialCategory={params.category || ""}
        initialQuery={params.q || ""}
      />
    </section>
  );
}
