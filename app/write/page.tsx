import { redirect } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { getCmsCategories } from "@/lib/cms";
import { ensureProfile } from "@/lib/user-auth";
export default async function WritePage() {
  const viewer = await ensureProfile();
  if (!viewer.profile.username) redirect("/profile?next=/write");
  return <section className="creator-page shell"><header className="creator-head"><span>YOUR STORY</span><h1>Өөрийн түүхээ бичих</h1><p><strong>@{viewer.profile.username}</strong> нэрээр нийтлэгдэнэ. “Шууд нийтлэх” сонговол admin approval шаардалгүй сайтад шууд гарна.</p></header><PostEditor initialCategories={await getCmsCategories()} mode="user" /></section>;
}
