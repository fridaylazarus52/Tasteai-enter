
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies that the current request belongs to an authenticated
 * user who has the super_admin role in Supabase.
 *
 * Never uses user_metadata for authorization.
 */
export async function requireSuperAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  if (roleError) {
    throw new Error(
      `Unable to verify administrator permissions: ${roleError.message}`
    );
  }

  if (!roleRecord) {
    redirect("/dashboard");
  }

  return user;
}
