import { randomUUID } from "node:crypto";
import { optimizePostImage } from "@/lib/image-processing";
import { requireUser } from "@/lib/user-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]); const maxSize = 10 * 1024 * 1024;
export async function POST(request: Request) {
  try {
    const viewer = await requireUser(); const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || !allowed.has(file.type) || file.size > maxSize) throw new Error("jpg, png, webp, gif — 10MB-аас бага файл оруулна уу");
    const supabase = getSupabaseAdmin(); if (!supabase) throw new Error("Supabase тохиргоо дутуу");
    const optimized = await optimizePostImage(file);
    const path = `${viewer.userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${optimized.extension}`;
    const { error } = await supabase.storage.from("post-images").upload(path, optimized.buffer, { contentType: optimized.contentType, upsert: false }); if (error) throw error;
    return Response.json({ url: supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl, path });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Upload амжилтгүй" }, { status: 400 }); }
}


