import { PostEditor } from "@/components/admin/post-editor";
import { getCmsCategories } from "@/lib/cms";
export default async function NewPostPage() { return <><header className="admin-page-head"><div><small>CREATE</small><h1>Шинэ нийтлэл</h1></div></header><PostEditor initialCategories={await getCmsCategories()} /></>; }
