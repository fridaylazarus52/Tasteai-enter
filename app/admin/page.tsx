
import Link from "next/link";
import {
  Users,
  Store,
  Utensils,
  ShoppingBag,
  ChartNoAxesCombined,
  ArrowUpRight,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";

const modules = [
  {
    title: "User Management",
    description:
      "Manage registered users, account access and platform roles.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Restaurant Management",
    description:
      "Review restaurant listings, approvals and publication status.",
    href: "/admin/restaurants",
    icon: Store,
  },
  {
    title: "Food Management",
    description:
      "Oversee food listings and marketplace menu availability.",
    href: "/admin/foods",
    icon: Utensils,
  },
  {
    title: "Order Management",
    description:
      "Monitor marketplace orders and their processing status.",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Platform Analytics",
    description:
      "Review platform-wide activity and business performance.",
    href: "/admin/analytics",
    icon: ChartNoAxesCombined,
  },
];

export default function AdminPage() {
  return (
    <div className="admin-overview">
      <section className="admin-welcome">
        <div className="admin-welcome-copy">
          <span className="admin-eyebrow">
            <ShieldCheck size={15} />
            PLATFORM CONTROL CENTER
          </span>

          <h1>Welcome to TasteAI Administration</h1>

          <p>
            Manage the TasteAI platform, oversee restaurant activity
            and monitor the marketplace from one central workspace.
          </p>
        </div>

        <div className="admin-welcome-art">
          <ShieldCheck size={76} strokeWidth={1.2} />
          <span>Platform protected</span>
        </div>
      </section>

      <section className="admin-section-heading">
        <div>
          <h2>Platform management</h2>
          <p>
            Select an area to manage your TasteAI platform.
          </p>
        </div>
      </section>

      <section className="admin-module-grid">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              href={module.href}
              className="admin-module-card"
              key={module.href}
            >
              <div className="admin-module-icon">
                <Icon size={22} />
              </div>

              <div className="admin-module-title">
                <h3>{module.title}</h3>
                <ArrowUpRight size={18} />
              </div>

              <p>{module.description}</p>

              <span className="admin-module-status">
                <LockKeyhole size={13} />
                Management setup pending
              </span>
            </Link>
          );
        })}
      </section>

      <section className="admin-security-note">
        <div className="admin-security-icon">
          <ShieldCheck size={22} />
        </div>

        <div>
          <h3>Administrator security</h3>
          <p>
            Your administrator access is verified on the server
            using your Supabase role. Existing restaurant-owner
            permissions remain separate.
          </p>
        </div>
      </section>
    </div>
  );
}
