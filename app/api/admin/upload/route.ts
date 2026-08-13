import { randomUUID } from "node:crypto";
import { optimizePostImage } from "@/lib/image-processing";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Файл сонгоно уу" }, { status: 400 });
    if (!allowed.has(file.type)) return Response.json({ error: "jpg, png, webp, gif файл оруулна уу" }, { status: 415 });
    if (file.size > maxSize) return Response.json({ error: "Файл 10MB-аас бага байна" }, { status: 413 });
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Supabase тохиргоо дутуу" }, { status: 503 });
    const optimized = await optimizePostImage(file);
    const path = `${admin.userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${optimized.extension}`;
    const { error } = await supabase.storage.from("post-images").upload(path, optimized.buffer, { contentType: optimized.contentType, upsert: false });
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from("post-images").getPublicUrl(path);
    return Response.json({ url: publicUrl.publicUrl, path });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload амжилтгүй" }, { status: 400 });
  }
}



