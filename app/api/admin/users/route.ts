import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/auth/require-super-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { response } = await requireSuperAdminApi();

  if (response) return response;

  try {
    const supabase = createAdminClient();

    const pageParam = Number(request.nextUrl.searchParams.get("page") ?? 1);
    const perPageParam = Number(
      request.nextUrl.searchParams.get("perPage") ?? 20
    );

    const page = Number.isInteger(pageParam)
      ? Math.max(1, pageParam)
      : 1;

    const perPage = Number.isInteger(perPageParam)
      ? Math.min(50, Math.max(1, perPageParam))
      : 20;

    const {
      data: usersData,
      error: usersError,
    } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (usersError) {
      throw usersError;
    }

    const authUsers = usersData.users;
    const userIds = authUsers.map((user) => user.id);

    if (userIds.length === 0) {
      return NextResponse.json({
        users: [],
        businesses: [],
        page,
        perPage,
        hasMore: false,
      });
    }

    const [
      profilesResult,
      rolesResult,
      businessesResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds),

      supabase
        .from("user_roles")
        .select("id, user_id, role, business_id")
        .in("user_id", userIds),

      supabase
        .from("businesses")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (rolesResult.error) throw rolesResult.error;
    if (businessesResult.error) throw businessesResult.error;

    const profileMap = new Map(
      (profilesResult.data ?? []).map((profile) => [
        profile.id,
        profile.full_name,
      ])
    );

    const businessMap = new Map(
      (businessesResult.data ?? []).map((business) => [
        business.id,
        business.name,
      ])
    );

    const rolesByUser = new Map<
      string,
      Array<{
        id: string;
        role: string;
        business_id: string | null;
        business_name: string | null;
      }>
    >();

    for (const role of rolesResult.data ?? []) {
      const existing = rolesByUser.get(role.user_id) ?? [];

      existing.push({
        id: role.id,
        role: role.role,
        business_id: role.business_id,
        business_name: role.business_id
          ? businessMap.get(role.business_id) ?? "Unknown business"
          : null,
      });

      rolesByUser.set(role.user_id, existing);
    }

    const users = authUsers.map((user) => {
      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : "";

      return {
        id: user.id,
        email: user.email ?? "",
        full_name:
          profileMap.get(user.id)?.trim() ||
          metadataName.trim() ||
          "Unnamed user",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        banned_until: user.banned_until ?? null,
        roles: rolesByUser.get(user.id) ?? [],
      };
    });

    return NextResponse.json({
      users,
      businesses: businessesResult.data ?? [],
      page,
      perPage,
      hasMore: authUsers.length === perPage,
    });
  } catch (error) {
    console.error("Admin user listing failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load platform users.",
      },
      { status: 500 }
    );
  }
}