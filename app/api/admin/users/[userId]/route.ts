import { NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/auth/require-super-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const { user, response } = await requireSuperAdminApi();

  if (response) return response;

  try {
    const { userId } = await params;

    if (!UUID_PATTERN.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const action = body.action;

    if (action !== "suspend" && action !== "activate") {
      return NextResponse.json(
        { error: "Unsupported account action." },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot suspend or deactivate your own administrator account here." },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { data: targetUser, error: targetError } =
      await supabase.auth.admin.getUserById(userId);

    if (targetError || !targetUser.user) {
      return NextResponse.json(
        { error: "The selected user could not be found." },
        { status: 404 }
      );
    }

    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .is("business_id", null)
      .limit(1)
      .maybeSingle();

    if (roleError) throw roleError;

    if (adminRole) {
      return NextResponse.json(
        {
          error:
            "Super Admin accounts cannot be suspended through ordinary user management. Review their administrator role separately.",
        },
        { status: 403 }
      );
    }

    const { error: updateError } =
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration:
          action === "suspend" ? "876000h" : "none",
      });

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message:
        action === "suspend"
          ? "User account suspended successfully."
          : "User account reactivated successfully.",
    });
  } catch (error) {
    console.error("Admin account action failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update this account.",
      },
      { status: 500 }
    );
  }
}