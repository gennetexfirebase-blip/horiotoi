import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms-html";
import { postInputSchema } from "@/lib/post-schema";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const { data, error } = await supabase.from("posts").select("*").is("legacy_id", null).order("updated_at", { ascending: false });
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = postInputSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const publishedAt = input.status === "published" ? (input.publishedAt || new Date().toISOString()) : input.publishedAt;
    const { data, error } = await supabase.from("posts").insert({
      title: input.title, slug: input.slug, excerpt: input.excerpt, content: input.content,
      content_html: sanitizeCmsHtml(input.contentHtml), cover_image: input.coverImage, category_id: input.categoryId,
      category_name: input.categoryName, status: input.status, published_at: publishedAt,
      author_id: admin.userId, author_name: admin.user.fullName || admin.user.username || "Admin",
      author_email: admin.email, author_avatar: admin.user.imageUrl || "",
    }).select("*").single();
    if (error) throw error;
    if (input.status === "published") {
      revalidatePath("/");
      revalidatePath("/archive");
    }
    return Response.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Нийтлэл хадгалж чадсангүй";
    return Response.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}




