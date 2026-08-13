import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ADMIN_EMAIL, requireUser } from "@/lib/user-auth";

export async function requireAdmin() {
  const viewer = await requireUser();
  if (viewer.email !== ADMIN_EMAIL) throw new Error("FORBIDDEN");
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("admins").upsert({
      clerk_user_id: viewer.userId,
      email: viewer.email,
      role: "superadmin",
      display_name: viewer.user.fullName || viewer.user.username || "Admin",
      avatar_url: viewer.user.imageUrl || "",
    }, { onConflict: "clerk_user_id" });
    if (error) throw error;
  }
  return { ...viewer, role: "superadmin" as const };
}
