import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const id = z.string().uuid().parse((await request.json()).postId);
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ ok: false }, { status: 503 });
    const { data } = await supabase.from("posts").select("views").eq("id", id).maybeSingle();
    if (!data) return Response.json({ ok: false }, { status: 404 });
    const { error } = await supabase.from("posts").update({ views: Number(data.views || 0) + 1 }).eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
