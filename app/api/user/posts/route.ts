import { postInputSchema } from "@/lib/post-schema";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms-html";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ensureProfile } from "@/lib/user-auth";

export async function GET() {
  try {
    const viewer = await ensureProfile(); const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Supabase тохиргоо дутуу");
    const { data, error } = await supabase.from("posts").select("*").eq("author_id", viewer.userId).order("updated_at", { ascending: false });
    if (error) throw error; return Response.json(data);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    const viewer = await ensureProfile(); const input = postInputSchema.parse(await request.json());
    const supabase = getSupabaseAdmin(); if (!supabase) throw new Error("Supabase тохиргоо дутуу");
    const { data: storyCategory, error: categoryError } = await supabase
      .from("categories").select("id,name").eq("slug", "bolson-yavdal").single();
    if (categoryError) throw categoryError;
    const status = input.status === "draft" ? "draft" : "published";
    const { data, error } = await supabase.from("posts").insert({
      title: input.title, slug: input.slug, excerpt: input.excerpt, content: input.content, content_html: sanitizeCmsHtml(input.contentHtml),
      cover_image: input.coverImage, category_id: storyCategory.id, category_name: storyCategory.name,
      status, published_at: status === "published" ? new Date().toISOString() : null,
      author_id: viewer.userId, author_name: viewer.profile.username, author_email: viewer.email, author_avatar: viewer.profile.avatar_url || "",
    }).select("*").single();
    if (error) throw error; return Response.json(data, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Нийтлэл хадгалсангүй" }, { status: 400 }); }
}



