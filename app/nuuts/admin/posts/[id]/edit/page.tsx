import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { getAdminPost, getCmsCategories } from "@/lib/cms";
type Props = { params: Promise<{ id: string }> };
export default async function EditPostPage({ params }: Props) { const { id } = await params; const [post, categories] = await Promise.all([getAdminPost(id), getCmsCategories()]); if (!post) notFound(); return <><header className="admin-page-head"><div><small>EDIT</small><h1>Нийтлэл засах</h1></div></header><PostEditor post={post} initialCategories={categories} /></>; }
