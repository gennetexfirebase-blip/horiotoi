import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms-html";
import { postInputSchema } from "@/lib/post-schema";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? Response.json(data) : Response.json({ error: "Олдсонгүй" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = postInputSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const { data, error } = await supabase.from("posts").update({
      title: input.title, slug: input.slug, excerpt: input.excerpt, content: input.content,
      content_html: sanitizeCmsHtml(input.contentHtml), cover_image: input.coverImage, category_id: input.categoryId,
      category_name: input.categoryName, status: input.status,
      published_at: input.status === "published" ? (input.publishedAt || new Date().toISOString()) : input.publishedAt,
    }).eq("id", id).select("*").single();
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/archive");
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Хадгалж чадсангүй" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/archive");
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Устгаж чадсангүй" }, { status: 400 });
  }
}

