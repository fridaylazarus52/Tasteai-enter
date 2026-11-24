
"use client";
//import "../app/dashboard/dashboard.css";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  BrainCircuit,
  ChefHat,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Command,
  FileBarChart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PackageSearch,
  Search,
  Settings,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NavigationItem = {
  label: string;
  href: string;
  keywords: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const navigation: NavigationItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    keywords: "home dashboard summary",
    icon: LayoutDashboard,
  },
  {
    label: "AI Insights",
    href: "/dashboard/insights",
    keywords: "artificial intelligence recommendations analysis",
    icon: BrainCircuit,
    badge: "AI",
  },
  {
    label: "Sales & Revenue",
    href: "/dashboard/sales",
    keywords: "income transactions money performance",
    icon: BarChart3,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    keywords: "purchases transactions orders",
    icon: ClipboardList,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    keywords: "clients guests buyers",
    icon: MessageSquareText,
  },
  {
    label: "Menu Intelligence",
    href: "/dashboard/menu",
    keywords: "food meals products menu pricing",
    icon: PackageSearch,
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    keywords: "stock ingredients supplies",
    icon: Boxes,
  },
  {
    label: "Forecasting",
    href: "/dashboard/forecasting",
    keywords: "prediction trends future demand",
    icon: Activity,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    keywords: "export csv business reporting",
    icon: FileBarChart,
  },
  {
    label: "Ask AI",
    href: "/dashboard/ask",
    keywords: "ask questions business assistant",
    icon: MessageSquareText,
    badge: "AI",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    keywords: "preferences account configuration",
    icon: Settings,
  },
];

export default function DashboardShell({
  children,
  email,
  fullName,
}: {
  children: ReactNode;
  email: string;
  fullName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayName =
    fullName?.trim() || email.split("@")[0] || "Account";

  const activeItem = navigation.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" &&
        pathname.startsWith(`${item.href}/`))
  );

  const pageTitle =
    activeItem?.label ??
    (pathname.startsWith("/dashboard/") ? "Workspace" : "Overview");

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return navigation;

    return navigation.filter((item) =>
      `${item.label} ${item.keywords}`
        .toLowerCase()
        .includes(query)
    );
  }, [searchQuery]);

  const closeOverlays = useCallback(() => {
    setSearchOpen(false);
    setNotificationsOpen(false);
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setNotificationsOpen(false);
  }, []);

  const goTo = useCallback(
    (href: string) => {
      closeOverlays();
      setMobileOpen(false);
      setSearchQuery("");
      router.push(href);
    },
    [closeOverlays, router]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openSearch();
        return;
      }

      if (event.key === "Escape") {
        closeOverlays();
        setMobileOpen(false);
      }

      if (typing) return;
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOverlays, openSearch]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setMobileOpen(false);
    closeOverlays();
    setSearchQuery("");
  }, [pathname, closeOverlays]);

  async function signOut() {
    if (signingOut) return;

    setSigningOut(true);
    setSignOutError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setSignOutError(
        error instanceof Error
          ? error.message
          : "Could not sign out. Please try again."
      );
      setSigningOut(false);
    }
  }

  function handleSearchKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (searchResults.length > 0) {
        goTo(searchResults[0].href);
      }
    }
  }

  const sidebar = (
    <aside
      className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      aria-label="Main navigation"
    >
      <Link
        className="brand sidebar-brand"
        href="/dashboard"
        onClick={() => setMobileOpen(false)}
      >
        <span className="brand-mark">
          <ChefHat size={19} />
        </span>
        <span>
          TasteAI<span className="brand-light"> Enterprise</span>
        </span>
      </Link>

      <Link
        className="sidebar-link"
        href="/"
        onClick={() => setMobileOpen(false)}
      >
        <Home size={18} />
        <span>Back to Home</span>
      </Link>

      <button
        className="workspace-switch"
        type="button"
        onClick={() => goTo("/dashboard/settings")}
        aria-label="Open workspace settings"
      >
        <span className="workspace-avatar">T</span>
        <span className="workspace-text">
          <strong>My workspace</strong>
          <span>Business workspace</span>
        </span>
        <ChevronDown size={15} />
      </button>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {navigation
          .filter((item) => item.href !== "/dashboard/settings")
          .map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-ai-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
      </nav>

      <div className="sidebar-label sidebar-label-bottom">
        PREFERENCES
      </div>

      <Link
        className={`sidebar-link ${
          pathname.startsWith("/dashboard/settings") ? "active" : ""
        }`}
        href="/dashboard/settings"
        onClick={() => setMobileOpen(false)}
      >
        <Settings size={18} />
        <span>Settings</span>
      </Link>

      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">
            <CircleHelp size={17} />
          </div>
          <strong>Need a hand?</strong>
          <p>Find your way around TasteAI.</p>
          <a href="mailto:support@tasteai.example">
            Contact support <span>↗</span>
          </a>
        </div>

        <div className="user-row">
          <div className="user-avatar" aria-hidden="true">
            {displayName.slice(0, 1).toUpperCase()}
          </div>

          <div className="user-info">
            <strong>{displayName}</strong>
            <span>{email}</span>
          </div>

          <button
            className="icon-button logout-button"
            type="button"
            onClick={signOut}
            disabled={signingOut}
            title="Sign out"
            aria-label={signingOut ? "Signing out" : "Sign out"}
          >
            <LogOut size={17} />
          </button>
        </div>

        {signOutError && (
          <p className="dashboard-shell-error" role="alert">
            {signOutError}
          </p>
        )}
      </div>
    </aside>
  );

  return (
    <div className="dashboard-layout">
      {mobileOpen && (
        <button
          className="mobile-scrim"
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {sidebar}

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="mobile-menu-button icon-button"
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/dashboard">Workspace</Link>
            <span className="breadcrumb-slash">/</span>
            <strong>{pageTitle}</strong>
          </div>

          <div className="topbar-actions">
            <button
              className={`search-trigger ${
                searchOpen ? "search-trigger-open" : ""
              }`}
              type="button"
              onClick={searchOpen ? closeOverlays : openSearch}
              aria-expanded={searchOpen}
              aria-label="Search dashboard"
            >
              <Search size={16} />
              <span>Search</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>

            <button
              className="icon-button notification-button"
              type="button"
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setSearchOpen(false);
              }}
              aria-label="Open dashboard shortcuts"
              aria-expanded={notificationsOpen}
              title="Dashboard shortcuts"
            >
              <Bell size={18} />
              <i aria-hidden="true" />
            </button>

            <div className="topbar-avatar" title={displayName}>
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          </div>

          {notificationsOpen && (
            <section
              className="dashboard-notifications-panel"
              aria-label="Dashboard shortcuts"
            >
              <div className="dashboard-overlay-heading">
                <div>
                  <strong>Workspace shortcuts</strong>
                  <p>Jump to a section of your business.</p>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close shortcuts"
                >
                  <X size={16} />
                </button>
              </div>

              <button
                className="dashboard-shortcut"
                type="button"
                onClick={() => goTo("/dashboard/insights")}
              >
                <span className="dashboard-shortcut-icon">
                  <BrainCircuit size={17} />
                </span>
                <span>
                  <strong>Review AI insights</strong>
                  <small>
                    Explore business signals and recommendations
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>

              <button
                className="dashboard-shortcut"
                type="button"
                onClick={() => goTo("/dashboard/orders")}
              >
                <span className="dashboard-shortcut-icon">
                  <ClipboardList size={17} />
                </span>
                <span>
                  <strong>View orders</strong>
                  <small>Open your order workspace</small>
                </span>
                <ChevronRight size={16} />
              </button>

              <p className="dashboard-overlay-note">
                These are navigation shortcuts, not live business
                notifications.
              </p>
            </section>
          )}
        </header>

        {searchOpen && (
          <section
            className="dashboard-search-panel"
            aria-label="Dashboard search"
          >
            <div className="dashboard-search-input-wrap">
              <Search size={18} />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search sales, orders, insights..."
                aria-label="Search dashboard modules"
                autoComplete="off"
              />
              <button
                className="dashboard-escape-button"
                type="button"
                onClick={closeOverlays}
              >
                ESC
              </button>
            </div>

            <p className="dashboard-search-caption">
              {searchQuery.trim()
                ? `${searchResults.length} matching section${
                    searchResults.length === 1 ? "" : "s"
                  }`
                : "QUICK NAVIGATION"}
            </p>

            <div className="dashboard-search-results">
              {searchResults.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    className="dashboard-search-result"
                    key={item.href}
                    type="button"
                    onClick={() => goTo(item.href)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="nav-ai-badge">{item.badge}</span>
                    )}
                    <ChevronRight size={15} />
                  </button>
                );
              })}

              {searchResults.length === 0 && (
                <div className="dashboard-search-empty">
                  <Search size={21} />
                  <strong>No matching sections</strong>
                  <span>
                    Try “sales”, “orders”, “menu” or “AI”.
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        <main className="dashboard-content">{children}</main>

        <footer className="dashboard-footer">
          <span>© 2026 TasteAI Enterprise</span>
          <span>
            <i className="footer-status-dot" />
            Your workspace
          </span>
        </footer>
      </div>
    </div>
  );
}
