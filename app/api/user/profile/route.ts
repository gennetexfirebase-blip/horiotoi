import { z } from "zod";
import { ensureProfile } from "@/lib/user-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const schema = z.object({ username: z.string().trim().min(3).max(40).regex(/^[\p{L}\p{N}_-]+$/u) });

export async function GET() {
  try { return Response.json((await ensureProfile()).profile); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
}

export async function PUT(request: Request) {
  try {
    const viewer = await ensureProfile();
    const { username } = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Supabase тохиргоо дутуу");
    const { data: duplicate } = await supabase.from("profiles").select("clerk_user_id")
      .ilike("username", username).neq("clerk_user_id", viewer.userId).maybeSingle();
    if (duplicate) throw new Error("Энэ username аль хэдийн ашиглагдсан байна.");
    const { data, error } = await supabase.from("profiles").update({ username }).eq("clerk_user_id", viewer.userId).select().single();
    if (error) throw error;
    await supabase.from("posts").update({ author_name: username }).eq("author_id", viewer.userId);
    return Response.json(data);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Username хадгалсангүй" }, { status: 400 }); }
}


