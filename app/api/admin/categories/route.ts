import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/post-schema";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const name = z.string().trim().min(2).max(100).parse((await request.json()).name);
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const { data, error } = await supabase.from("categories").insert({ name, slug: slugify(name) }).select("*").single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ангилал нэмсэнгүй" }, { status: 400 });
  }
}
