
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Store,
  Utensils,
  ShoppingBag,
  ChartNoAxesCombined,
  Settings,
  ArrowLeft,
} from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import "./admin.css";

const navigation = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Restaurants",
    href: "/admin/restaurants",
    icon: Store,
  },
  {
    label: "Food listings",
    href: "/admin/foods",
    icon: Utensils,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireSuperAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-icon">
            <ShieldCheck size={23} />
          </span>

          <span>
            <strong>TasteAI</strong>
            <small>Platform Admin</small>
          </span>
        </Link>

        <div className="admin-sidebar-label">
          PLATFORM MANAGEMENT
        </div>

        <nav className="admin-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${
                  item.href === "/admin" ? "active" : ""
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link href="/dashboard" className="admin-back-link">
            <ArrowLeft size={17} />
            Back to business dashboard
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              TASTEAI ENTERPRISE
            </span>
            <h2>Platform Administration</h2>
          </div>

          <div className="admin-account">
            <span className="admin-account-icon">
              <ShieldCheck size={19} />
            </span>

            <span>
              <strong>Super Admin</strong>
              <small>{user.email}</small>
            </span>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
