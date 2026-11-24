import { NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/auth/require-super-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type PlatformRole =
  | "super_admin"
  | "restaurant_owner"
  | "restaurant_staff"
  | "customer";

const ALLOWED_ROLES: PlatformRole[] = [
  "super_admin",
  "restaurant_owner",
  "restaurant_staff",
  "customer",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  const { response } = await requireSuperAdminApi();

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

    const role = body.role as PlatformRole;
   const businessId =
  typeof body.businessId === "string" && body.businessId.trim()
    ? body.businessId.trim()
    : null;

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid platform role." },
        { status: 400 }
      );
    }

    const isBusinessRole =
      role === "restaurant_owner" ||
      role === "restaurant_staff";

    if (isBusinessRole && !businessId) {
      return NextResponse.json(
        {
          error:
            "Select a business when assigning a Restaurant Owner or Restaurant Staff role.",
        },
        { status: 400 }
      );
    }

    if (!isBusinessRole && businessId) {
      return NextResponse.json(
        {
          error:
            "Super Admin and Customer roles must not have a business assignment.",
        },
        { status: 400 }
      );
    }

    if (businessId && !UUID_PATTERN.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID." },
        { status: 400 }
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

    if (businessId) {
      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("id", businessId)
          .maybeSingle();

      if (businessError) throw businessError;

      if (!business) {
        return NextResponse.json(
          { error: "The selected business does not exist." },
          { status: 404 }
        );
      }
    }

    let existingQuery = supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role);

    existingQuery = businessId
      ? existingQuery.eq("business_id", businessId)
      : existingQuery.is("business_id", null);

    const { data: existingRole, error: lookupError } =
      await existingQuery.limit(1).maybeSingle();

    if (lookupError) throw lookupError;

    if (existingRole) {
      return NextResponse.json(
        { error: "This user already has that role assignment." },
        { status: 409 }
      );
    }

    const { data: createdRole, error: insertError } =
      await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role,
          business_id: businessId,
        })
        .select("id, user_id, role, business_id")
        .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      role: createdRole,
      message: "User role assigned successfully.",
    });
  } catch (error) {
    console.error("Admin role assignment failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to assign this role.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  const { user, response } = await requireSuperAdminApi();

  if (response) return response;

  try {
    const { userId } = await params;
    const body = await request.json();
    const roleId = body.roleId;

    if (!UUID_PATTERN.test(userId) || !UUID_PATTERN.test(roleId)) {
      return NextResponse.json(
        { error: "Invalid user or role ID." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: roleRecord, error: roleError } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .eq("id", roleId)
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) throw roleError;

    if (!roleRecord) {
      return NextResponse.json(
        { error: "The selected role assignment was not found." },
        { status: 404 }
      );
    }

    if (roleRecord.role === "super_admin") {
      if (roleRecord.user_id === user.id) {
        return NextResponse.json(
          {
            error:
              "You cannot remove your own Super Admin role through this page.",
          },
          { status: 403 }
        );
      }

      const { count, error: countError } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin")
        .is("business_id", null);

      if (countError) throw countError;

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          {
            error:
              "You cannot remove the last Super Admin role. Assign another Super Admin first.",
          },
          { status: 403 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: "Role assignment removed successfully.",
    });
  } catch (error) {
    console.error("Admin role removal failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to remove this role.",
      },
      { status: 500 }
    );
  }
}