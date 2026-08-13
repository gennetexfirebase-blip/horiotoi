import Link from "next/link";
import { PostList } from "@/components/admin/post-list";
import { getAdminPosts } from "@/lib/cms";

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();
  return <><header className="admin-page-head"><div><small>CONTENT</small><h1>Нийтлэлүүд</h1></div><Link className="admin-primary" href="/nuuts/admin/posts/new">+ Шинэ нийтлэл</Link></header><PostList initialPosts={posts} /></>;
}
