import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try { await requireAdmin(); } catch { redirect("/my-posts"); }
  return <div className="admin-app"><aside className="admin-sidebar"><Link className="admin-logo" href="/nuuts/admin">ХОРИОТОЙ <small>CMS</small></Link><nav><Link href="/nuuts/admin/posts">Нийтлэлүүд</Link><Link href="/nuuts/admin/posts/new">Шинэ нийтлэл</Link><Link href="/" target="_blank">Сайт харах</Link><Link href="/profile">Admin profile</Link></nav><UserButton /></aside><section className="admin-main">{children}</section></div>;
}


