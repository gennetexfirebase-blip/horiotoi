import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const ADMIN_EMAIL = "6822103@gmail.com";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export function primaryEmail(user: ClerkUser | null) {
  if (!user) return "";
  return (user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress || "").toLowerCase();
}

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const email = primaryEmail(user);
  if (!email) throw new Error("EMAIL_REQUIRED");
  return { userId, user, email };
}

function suggestedUsername(user: ClerkUser, email: string, userId: string) {
  const source = user.username || user.fullName || email.split("@")[0] || "user";
  const clean = source.normalize("NFKC").replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "user";
  return `${clean}_${userId.slice(-5)}`.slice(0, 40);
}

export async function ensureProfile() {
  const viewer = await requireUser();
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ...viewer, profile: { clerk_user_id: viewer.userId, email: viewer.email, username: suggestedUsername(viewer.user, viewer.email, viewer.userId), avatar_url: viewer.user.imageUrl || "" } };
  const { data } = await supabase.from("profiles").select("*").eq("clerk_user_id", viewer.userId).maybeSingle();
  if (data) return { ...viewer, profile: data };
  const profile = {
    clerk_user_id: viewer.userId,
    email: viewer.email,
    username: suggestedUsername(viewer.user, viewer.email, viewer.userId),
    avatar_url: viewer.user.imageUrl || "",
  };
  const { data: created, error } = await supabase.from("profiles").insert(profile).select().single();
  if (error) throw error;
  return { ...viewer, profile: created };
}


