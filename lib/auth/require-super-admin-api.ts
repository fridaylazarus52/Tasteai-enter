import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type SuperAdminApiResult =
  | {
      user: User;
      response: null;
    }
  | {
      user: null;
      response: NextResponse;
    };

export async function requireSuperAdminApi(): Promise<SuperAdminApiResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .is("business_id", null)
    .limit(1)
    .maybeSingle();

  if (roleError) {
    console.error("Super Admin verification failed:", roleError);

    return {
      user: null,
      response: NextResponse.json(
        { error: "Unable to verify administrator permissions." },
        { status: 500 }
      ),
    };
  }

  if (!roleRecord) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}