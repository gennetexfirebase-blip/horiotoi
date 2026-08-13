import Link from "next/link";
import { ensureProfile } from "@/lib/user-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
export default async function MyPostsPage() {
  const viewer = await ensureProfile(); const supabase = getSupabaseAdmin();
  const { data } = supabase ? await supabase.from("posts").select("id,title,slug,status,published_at,views").eq("author_id", viewer.userId).order("updated_at", { ascending: false }) : { data: [] };
  return <section className="creator-page shell"><header className="creator-head"><span>MY STORIES</span><h1>Миний нийтлэлүүд</h1><p>@{viewer.profile.username}</p><Link className="creator-action" href="/write">+ Шинэ түүх бичих</Link></header><div className="my-post-list">{data?.length ? data.map((post) => <article key={post.id}><div><span>{post.status === "published" ? "Нийтлэгдсэн" : "Ноорог"}</span><h2>{post.title}</h2><small>{post.published_at?.slice(0,10) || "Огноогүй"} · {post.views} үзэлт</small></div>{post.status === "published" ? <Link href={`/article/${post.slug}`}>Үзэх</Link> : null}</article>) : <p className="admin-empty">Та одоогоор нийтлэл оруулаагүй байна.</p>}</div></section>;
}
