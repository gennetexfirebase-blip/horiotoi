import Link from "next/link";
import { PostList } from "@/components/admin/post-list";
import { getAdminPostCounts, getAdminPosts } from "@/lib/cms";

type Props = { searchParams: Promise<{ view?: string }> };

export default async function AdminPostsPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = params.view === "archive" ? "archive" : "current";
  const [posts, counts] = await Promise.all([getAdminPosts(view), getAdminPostCounts()]);
  return <>
    <header className="admin-page-head"><div><small>CONTENT</small><h1>Нийтлэлүүд</h1></div><Link className="admin-primary" href="/nuuts/admin/posts/new">+ Шинэ нийтлэл</Link></header>
    <nav className="admin-post-tabs" aria-label="Нийтлэлийн төрөл">
      <Link className={view === "current" ? "active" : ""} href="/nuuts/admin/posts">Шинэ CMS постууд <b>{counts.current}</b></Link>
      <Link className={view === "archive" ? "active" : ""} href="/nuuts/admin/posts?view=archive">Хуучин архив <b>{counts.archive}</b></Link>
    </nav>
    <PostList key={view} initialPosts={posts} />
  </>;
}
