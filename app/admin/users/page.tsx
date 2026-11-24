"use client";

import "./users.css";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Mail,
  CalendarDays,
  Building2,
  Plus,
  Trash2,
  Ban,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type PlatformRole =
  | "super_admin"
  | "restaurant_owner"
  | "restaurant_staff"
  | "customer";

type UserRole = {
  id: string;
  role: PlatformRole;
  business_id: string | null;
  business_name: string | null;
};

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  roles: UserRole[];
};

type BusinessOption = {
  id: string;
  name: string;
};

const roleLabels: Record<PlatformRole, string> = {
  super_admin: "Super Admin",
  restaurant_owner: "Restaurant Owner",
  restaurant_staff: "Restaurant Staff",
  customer: "Customer",
};

function isSuspended(user: AdminUser) {
  return Boolean(
    user.banned_until &&
      new Date(user.banned_until).getTime() > Date.now()
  );
}

function formatDate(value: string | null) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(date);
}

async function readApiError(response: Response) {
  const result = await response.json().catch(() => null);

  return (
    result?.error ||
    result?.message ||
    "Something went wrong. Please try again."
  );
}

type UserRowProps = {
  user: AdminUser;
  businesses: BusinessOption[];
  onAction: (
    url: string,
    method: "POST" | "DELETE" | "PATCH",
    body: Record<string, string>
  ) => Promise<boolean>;
};

function UserManagementRow({
  user,
  businesses,
  onAction,
}: UserRowProps) {
  const [selectedRole, setSelectedRole] =
    useState<PlatformRole>("customer");

  const [selectedBusiness, setSelectedBusiness] =
    useState("");

  const [busy, setBusy] = useState(false);
  const suspended = isSuspended(user);

  const needsBusiness =
    selectedRole === "restaurant_owner" ||
    selectedRole === "restaurant_staff";

  async function handleAddRole(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (needsBusiness && !selectedBusiness) return;

    setBusy(true);

    const success = await onAction(
      `/api/admin/users/${user.id}/roles`,
      "POST",
      {
        role: selectedRole,
        businessId: needsBusiness ? selectedBusiness : "",
      }
    );

    if (success) {
      setSelectedRole("customer");
      setSelectedBusiness("");
    }

    setBusy(false);
  }

  async function handleRemoveRole(role: UserRole) {
    const confirmed = window.confirm(
      `Remove the ${roleLabels[role.role]} role from ${user.email}?`
    );

    if (!confirmed) return;

    setBusy(true);

    await onAction(
      `/api/admin/users/${user.id}/roles`,
      "DELETE",
      { roleId: role.id }
    );

    setBusy(false);
  }

  async function handleAccountStatus() {
    const action = suspended ? "activate" : "suspend";

    const confirmed = window.confirm(
      suspended
        ? `Reactivate ${user.email}'s account?`
        : `Suspend ${user.email}'s account? They will no longer be able to sign in while the ban is active.`
    );

    if (!confirmed) return;

    setBusy(true);

    await onAction(
      `/api/admin/users/${user.id}`,
      "PATCH",
      { action }
    );

    setBusy(false);
  }

  return (
    <article className="user-management-card">
      <div className="user-card-main">
        <div className="user-avatar">
          {user.full_name.slice(0, 1).toUpperCase()}
        </div>

        <div className="user-identity">
          <div className="user-name-line">
            <h3>{user.full_name}</h3>

            <span
              className={`user-status ${
                suspended ? "suspended" : "active"
              }`}
            >
              {suspended ? "Suspended" : "Active"}
            </span>
          </div>

          <p className="user-email">
            <Mail size={14} />
            {user.email || "No email address"}
          </p>

          <p className="user-id">
            User ID: {user.id}
          </p>
        </div>
      </div>

      <div className="user-card-details">
        <div>
          <span className="user-detail-label">
            <CalendarDays size={13} />
            Joined
          </span>
          <strong>{formatDate(user.created_at)}</strong>
        </div>

        <div>
          <span className="user-detail-label">
            <UserCheck size={13} />
            Last sign in
          </span>
          <strong>{formatDate(user.last_sign_in_at)}</strong>
        </div>

        <div>
          <span className="user-detail-label">
            <Mail size={13} />
            Email verification
          </span>
          <strong>
            {user.email_confirmed_at
              ? "Verified"
              : "Not verified"}
          </strong>
        </div>
      </div>

      <div className="user-roles-section">
        <div className="user-subheading">
          <strong>Assigned roles</strong>
          <span>{user.roles.length} role(s)</span>
        </div>

        {user.roles.length > 0 ? (
          <div className="user-role-list">
            {user.roles.map((role) => (
              <span className="user-role-chip" key={role.id}>
                <ShieldCheck size={13} />

                <span>
                  {roleLabels[role.role]}
                  {role.business_name
                    ? ` · ${role.business_name}`
                    : ""}
                </span>

                <button
                  type="button"
                  title={`Remove ${roleLabels[role.role]} role`}
                  aria-label={`Remove ${roleLabels[role.role]} role`}
                  disabled={busy}
                  onClick={() => handleRemoveRole(role)}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="user-no-roles">
            No platform role assigned.
          </p>
        )}

        <form
          className="user-role-form"
          onSubmit={handleAddRole}
        >
          <select
            value={selectedRole}
            onChange={(event) => {
              setSelectedRole(event.target.value as PlatformRole);
              setSelectedBusiness("");
            }}
            disabled={busy}
            aria-label={`Choose role for ${user.email}`}
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>

          {needsBusiness && (
            <select
              value={selectedBusiness}
              onChange={(event) =>
                setSelectedBusiness(event.target.value)
              }
              disabled={busy}
              required
              aria-label="Choose restaurant business"
            >
              <option value="">Select business</option>

              {businesses.map((business) => (
                <option value={business.id} key={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="user-add-role-button"
            disabled={
              busy ||
              (needsBusiness && !selectedBusiness)
            }
          >
            {busy ? (
              <LoaderCircle className="users-spin" size={15} />
            ) : (
              <Plus size={15} />
            )}
            Add role
          </button>
        </form>
      </div>

      <div className="user-card-actions">
        <span className="user-action-caption">
          Account access
        </span>

        <button
          type="button"
          className={
            suspended
              ? "user-account-button activate"
              : "user-account-button suspend"
          }
          disabled={busy}
          onClick={handleAccountStatus}
        >
          {busy ? (
            <LoaderCircle className="users-spin" size={15} />
          ) : suspended ? (
            <CheckCircle2 size={15} />
          ) : (
            <Ban size={15} />
          )}

          {suspended ? "Reactivate account" : "Suspend account"}
        </button>
      </div>
    </article>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          `/api/admin/users?page=${page}&perPage=20`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const result = await response.json();

        setUsers(result.users ?? []);
        setBusinesses(result.businesses ?? []);
        setHasMore(Boolean(result.hasMore));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load platform users."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function performAction(
    url: string,
    method: "POST" | "DELETE" | "PATCH",
    body: Record<string, string>
  ) {
    setNotice("");
    setError("");

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const result = await response.json();

      setNotice(result.message || "Action completed successfully.");

      await loadUsers(true);

      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The requested action could not be completed."
      );

      return false;
    }
  }

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.full_name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        user.id.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        user.roles.some((role) => role.role === roleFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "suspended" && isSuspended(user)) ||
        (statusFilter === "active" && !isSuspended(user));

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const suspendedCount = users.filter(isSuspended).length;

  const adminCount = users.filter((user) =>
    user.roles.some((role) => role.role === "super_admin")
  ).length;

  const ownerCount = users.filter((user) =>
    user.roles.some((role) => role.role === "restaurant_owner")
  ).length;

  return (
    <div className="admin-users-page">
      <section className="users-page-heading">
        <div>
          <span className="users-eyebrow">
            <Users size={15} />
            PLATFORM MANAGEMENT
          </span>

          <h1>User Management</h1>

          <p>
            View registered TasteAI accounts, manage platform roles
            and control account access.
          </p>
        </div>

        <button
          type="button"
          className="users-refresh-button"
          onClick={() => loadUsers(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? (
            <LoaderCircle className="users-spin" size={16} />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </section>

      <section className="users-stat-grid">
        <div className="users-stat-card">
          <span className="users-stat-icon green">
            <Users size={20} />
          </span>
          <div>
            <span>Users on this page</span>
            <strong>{users.length}</strong>
          </div>
        </div>

        <div className="users-stat-card">
          <span className="users-stat-icon blue">
            <ShieldCheck size={20} />
          </span>
          <div>
            <span>Super Admins on this page</span>
            <strong>{adminCount}</strong>
          </div>
        </div>

        <div className="users-stat-card">
          <span className="users-stat-icon purple">
            <Building2 size={20} />
          </span>
          <div>
            <span>Restaurant Owners on this page</span>
            <strong>{ownerCount}</strong>
          </div>
        </div>

        <div className="users-stat-card">
          <span className="users-stat-icon orange">
            <UserX size={20} />
          </span>
          <div>
            <span>Suspended on this page</span>
            <strong>{suspendedCount}</strong>
          </div>
        </div>
      </section>

      {notice && (
        <div className="users-message success" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}

      {error && (
        <div className="users-message error" role="alert">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <section className="users-toolbar">
        <div className="users-search">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this page by name, email or user ID..."
            aria-label="Search users on this page"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="restaurant_owner">Restaurant Owner</option>
          <option value="restaurant_staff">Restaurant Staff</option>
          <option value="customer">Customer</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by account status"
        >
          <option value="all">All account statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </section>

      <section className="users-results-heading">
        <div>
          <h2>Registered accounts</h2>
          <p>
            Showing {filteredUsers.length} matching account(s)
            on page {page}. Search and filters apply to the
            currently loaded page.
          </p>
        </div>

        <span className="users-page-indicator">
          Page {page}
        </span>
      </section>

      {loading ? (
        <div className="users-loading">
          <LoaderCircle className="users-spin" size={27} />
          <span>Loading registered users...</span>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="users-list">
          {filteredUsers.map((user) => (
            <UserManagementRow
              key={user.id}
              user={user}
              businesses={businesses}
              onAction={performAction}
            />
          ))}
        </div>
      ) : (
        <div className="users-empty">
          <Users size={34} />
          <h3>No matching users found</h3>
          <p>
            Try changing your search term or selecting a different filter.
          </p>
        </div>
      )}

      <footer className="users-pagination">
        <span>
          Page {page} · {users.length} account(s) loaded
        </span>

        <div>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasMore || loading}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      <div className="users-security-note">
        <ShieldCheck size={19} />
        <p>
          User account operations are performed through protected
          server routes. Your Supabase secret key is never sent
          to the browser. Existing restaurant-owner and customer
          permissions remain separate.
        </p>
      </div>
    </div>
  );
}