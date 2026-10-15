"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity, BarChart3, Bell, Boxes, BrainCircuit, ChefHat, ChevronDown, CircleHelp,
  ClipboardList, Command, FileBarChart, LayoutDashboard, LogOut, Menu, MessageSquareText,
  PackageSearch, Search, Settings, ShoppingBag, Sparkles, Users, X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Insights", href: "/dashboard/insights", icon: BrainCircuit, badge: "AI" },
  { label: "Sales & Revenue", href: "/dashboard/sales", icon: BarChart3 },
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Menu Intelligence", href: "/dashboard/menu", icon: PackageSearch },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Forecasting", href: "/dashboard/forecasting", icon: Activity },
  { label: "Reports", href: "/dashboard/reports", icon: FileBarChart }
];

export default function DashboardShell({ children, email, fullName }: { children: React.ReactNode; email: string; fullName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const displayName = fullName || email.split("@")[0] || "Account";

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const sidebar = <aside className="sidebar">
    <Link className="brand sidebar-brand" href="/dashboard"><span className="brand-mark"><ChefHat size={19} /></span><span>TasteAI<span className="brand-light"> Enterprise</span></span></Link>
    <div className="workspace-switch"><div className="workspace-avatar">T</div><div className="workspace-text"><strong>My workspace</strong><span>Starter workspace</span></div><ChevronDown size={15} /></div>
    <div className="sidebar-label">WORKSPACE</div>
    <nav className="sidebar-nav">{navigation.map(item => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)); const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`sidebar-link ${active ? "active" : ""}`}><Icon size={18} /><span>{item.label}</span>{item.badge && <span className="nav-ai-badge">{item.badge}</span>}</Link>; })}</nav>
    <div className="sidebar-label sidebar-label-bottom">PREFERENCES</div>
    <Link className={`sidebar-link ${pathname === "/dashboard/settings" ? "active" : ""}`} href="/dashboard/settings" onClick={() => setMobileOpen(false)}><Settings size={18} /><span>Settings</span></Link>
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><strong>Need a hand?</strong><p>Find your way around TasteAI.</p><a href="mailto:support@tasteai.example">Contact support <span>↗</span></a></div><div className="user-row"><div className="user-avatar">{displayName.slice(0,1).toUpperCase()}</div><div className="user-info"><strong>{displayName}</strong><span>{email}</span></div><button className="icon-button logout-button" onClick={signOut} disabled={signingOut} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div></div>
  </aside>;

  return <div className="dashboard-layout">{mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}{sidebar}<div className="dashboard-main"><header className="dashboard-topbar"><button className="mobile-menu-button icon-button" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{navigation.find(item => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))?.label ?? (pathname.endsWith("settings") ? "Settings" : "Overview")}</strong></div><div className="topbar-actions"><button className={`search-trigger ${searchOpen ? "search-trigger-open" : ""}`} onClick={() => setSearchOpen(v => !v)}><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button><button className="icon-button notification-button" aria-label="Notifications" title="Notifications"><Bell size={18} /><i /></button><div className="topbar-avatar">{displayName.slice(0,1).toUpperCase()}</div></div></header>{searchOpen && <div className="search-panel"><Search size={17} /><input autoFocus placeholder="Search dashboard modules..." onKeyDown={e => { if (e.key === "Escape") setSearchOpen(false); }} /><span>ESC to close</span></div>}<div className="dashboard-content">{children}</div><footer className="dashboard-footer"><span>© {new Date().getFullYear()} TasteAI Enterprise</span><span><span className="footer-status-dot" /> Workspace ready · Demo metrics until data is connected</span></footer></div></div>;
}
