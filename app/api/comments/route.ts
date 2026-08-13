import { z } from "zod";
import { escapeHtml } from "@/lib/post-schema";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const schema = z.object({
  postId: z.string().uuid().optional(), legacyPostId: z.coerce.number().int().positive().optional(),
  author: z.string().trim().min(2).max(80), body: z.string().trim().min(2).max(3000), website: z.string().max(0).optional(),
}).refine((value) => value.postId || value.legacyPostId, "Нийтлэл тодорхойгүй");

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const { data, error } = await supabase.from("comments").insert({
      post_id: input.postId || null, legacy_post_id: input.legacyPostId || null,
      author_name: input.author, body: input.body,
      body_html: `<p>${escapeHtml(input.body).replace(/\n/g, "<br>")}</p>`, status: "published",
    }).select("*").single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Сэтгэгдэл хадгалсангүй" }, { status: 400 });
  }
}
