import { createClient } from "@/lib/supabase/client";

export type TasteBusiness = {
  id: string;
  owner_id: string;
  name: string;
  business_type: string;
  currency: string;
  timezone: string;
  created_at?: string;
};

/** Returns the signed-in user's first workspace, creating a starter one if needed. */
export async function getOrCreateBusiness(): Promise<{ business: TasteBusiness; supabase: ReturnType<typeof createClient> }> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Your session has expired. Please sign in again.");

  const { data: existing, error: lookupError } = await supabase
    .from("businesses")
    .select("id, owner_id, name, business_type, currency, timezone, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(`Could not load your workspace: ${lookupError.message}`);
  if (existing) return { business: existing as TasteBusiness, supabase };

  const ownerName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const { data: created, error: createError } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      name: ownerName ? `${ownerName}'s Workspace` : "My Restaurant",
      business_type: "restaurant",
      currency: "NGN",
      timezone: "Africa/Lagos",
    })
    .select("id, owner_id, name, business_type, currency, timezone, created_at")
    .single();

  if (createError || !created) {
    // A second tab may have created the workspace at the same time. Re-read before failing.
    const { data: raced } = await supabase.from("businesses")
      .select("id, owner_id, name, business_type, currency, timezone, created_at")
      .eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (raced) return { business: raced as TasteBusiness, supabase };
    throw new Error(`Could not create your workspace: ${createError?.message ?? "Unknown database error"}`);
  }
  return { business: created as TasteBusiness, supabase };
}

export function money(value: number | string | null | undefined, currency = "NGN") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency, maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(date);
}
