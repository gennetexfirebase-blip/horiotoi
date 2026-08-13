"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CmsPostRow } from "@/lib/cms-types";

export function PostList({ initialPosts }: { initialPosts: CmsPostRow[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [deleting, setDeleting] = useState<CmsPostRow | null>(null);
  const categories = [...new Set(posts.map((post) => post.category_name))].sort();
  const filtered = useMemo(() => posts.filter((post) =>
    (!query || [post.title, post.author_name, post.author_email].join(" ").toLocaleLowerCase("mn").includes(query.toLocaleLowerCase("mn"))) &&
    (!status || post.status === status) && (!category || post.category_name === category)
  ), [posts, query, status, category]);

  async function confirmDelete() {
    if (!deleting) return;
    const response = await fetch(`/api/admin/posts/${deleting.id}`, { method: "DELETE" });
    if (response.ok) { setPosts((current) => current.filter((post) => post.id !== deleting.id)); setDeleting(null); router.refresh(); }
  }

  return (
    <>
      <div className="admin-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Нийтлэл хайх..." />
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Бүх төлөв</option><option value="published">Published</option><option value="draft">Draft</option></select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Бүх ангилал</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Зураг</th><th>Title</th><th>Category</th><th>Author</th><th>Status</th><th>Published</th><th>Views</th><th /></tr></thead>
        <tbody>{filtered.map((post) => <tr key={post.id}>
          <td>{post.cover_image ? <Image src={post.cover_image} alt="" width={64} height={42} unoptimized /> : <span className="thumb-empty" />}</td>
          <td><strong>{post.title}</strong><small>/{post.slug}</small></td><td>{post.category_name}</td><td><strong>{post.author_name}</strong><small>{post.author_email || "Архив"}</small></td>
          <td><span className={`status-pill ${post.status}`}>{post.status}</span></td><td>{post.published_at?.slice(0, 10) || "—"}</td><td>{Number(post.views).toLocaleString()}</td>
          <td><span className="row-actions"><Link href={`/nuuts/admin/posts/${post.id}/edit`}>Edit</Link><button type="button" onClick={() => setDeleting(post)}>Delete</button></span></td>
        </tr>)}</tbody></table></div>
      {!filtered.length ? <div className="admin-empty">Нийтлэл олдсонгүй.</div> : null}
      {deleting ? <div className="modal-backdrop" role="presentation"><div className="confirm-modal" role="dialog" aria-modal="true"><h2>Нийтлэл устгах</h2><p>“{deleting.title}” нийтлэлийг устгахдаа итгэлтэй байна уу?</p><div><button type="button" onClick={() => setDeleting(null)}>Болих</button><button className="danger" type="button" onClick={confirmDelete}>Устгах</button></div></div></div> : null}
    </>
  );
}


