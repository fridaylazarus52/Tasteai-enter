import Link from "next/link";
import {
  Activity, ArrowRight, BarChart3, BrainCircuit, Boxes, CheckCircle2, ClipboardList,
  FileBarChart, Lightbulb, PackageSearch, Settings, Sparkles, Users
} from "lucide-react";

const modules: Record<string, { title: string; eyebrow: string; description: string; icon: typeof BrainCircuit; highlights: string[]; next: string }> = {
  insights: { title: "AI Insights", eyebrow: "AI BUSINESS ANALYST", description: "A workspace for turning business signals into practical questions, explanations, and recommendations.", icon: BrainCircuit, highlights: ["Sales patterns and unusual changes", "Menu and inventory opportunities", "Recommendations for team review"], next: "Connect live sales, product, and customer records before enabling generated insights." },
  sales: { title: "Sales & Revenue", eyebrow: "FINANCIAL PERFORMANCE", description: "Review sales trends, revenue totals, average order value, and transaction performance.", icon: BarChart3, highlights: ["Revenue over time", "Average order value", "Sales by product and channel"], next: "The sales schema is ready. Connect transaction entry and real aggregation queries to replace demo values." },
  orders: { title: "Orders", eyebrow: "ORDER OPERATIONS", description: "A central place to review order activity and follow each transaction through its status.", icon: ClipboardList, highlights: ["Order status and timestamps", "Customer and item details", "Sales-to-order visibility"], next: "Order management workflows are not wired in this starter. The sales and sale_items tables provide the first transaction foundation." },
  customers: { title: "Customers", eyebrow: "CUSTOMER INTELLIGENCE", description: "Build a clearer view of customer records and, later, retention and segment patterns.", icon: Users, highlights: ["Customer profiles", "Repeat purchase analysis", "Customer segments"], next: "Customer records can be stored in the customers table. Add create/edit forms and consent-aware communication workflows before operational use." },
  menu: { title: "Menu Intelligence", eyebrow: "PRODUCT PERFORMANCE", description: "Understand which menu items move, which contribute margin, and which may need attention.", icon: PackageSearch, highlights: ["Item price and cost tracking", "Sales mix and contribution margin", "Menu performance comparisons"], next: "The products table is available for menu items. Real performance requires linking sale_items to products and adding transaction data." },
  inventory: { title: "Inventory", eyebrow: "STOCK & OPERATIONS", description: "Track product stock and identify items that may need a restock review.", icon: Boxes, highlights: ["Current stock quantity", "Low-stock review workflow", "Product cost visibility"], next: "The products table includes stock_quantity and cost_price. Inventory movements, supplier records, and automatic stock deductions are not implemented yet." },
  forecasting: { title: "Forecasting", eyebrow: "PLAN AHEAD", description: "Create a structured view of future demand once enough historical business data is available.", icon: Activity, highlights: ["Revenue trend review", "Demand planning", "Scenario comparison"], next: "Forecasts are not generated yet. We need sufficient historical sales data and a server-side forecasting implementation before showing predictions." },
  reports: { title: "Reports", eyebrow: "BUSINESS REPORTING", description: "Prepare business summaries that bring key sales, customer, and operational signals together.", icon: FileBarChart, highlights: ["Sales performance summaries", "Expense review", "Export-ready reporting"], next: "This screen is a starting point. Connect live database queries and verify report calculations before exporting business reports." },
  settings: { title: "Settings", eyebrow: "WORKSPACE PREFERENCES", description: "Set up the business workspace and prepare the account for future team collaboration.", icon: Settings, highlights: ["Business profile and currency", "Account and security settings", "Future team access controls"], next: "Business profile creation and team invitations still need their forms and policies implemented." }
};

export default async function ModulePage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const module = modules[section];
  if (!module) return <div className="empty-state"><h1>Page not found</h1><p>This TasteAI workspace section does not exist.</p><Link href="/dashboard" className="button button-primary">Back to overview</Link></div>;
  const Icon = module.icon;
  return <div className="module-page">
    <div className="page-heading-row"><div><div className="eyebrow">{module.eyebrow}</div><h1>{module.title}</h1><p>{module.description}</p></div><span className="module-heading-icon"><Icon size={24} /></span></div>
    <div className="module-notice"><span><Lightbulb size={17} /></span><div><strong>Foundation screen</strong><p>This section is part of the project scaffold. It is not yet a live operational module.</p></div><span className="demo-banner-label">SETUP IN PROGRESS</span></div>
    <section className="panel module-feature-panel"><div className="module-feature-heading"><div className="feature-icon"><Icon size={21} /></div><div><h2>What this module is designed to support</h2><p>Planned capabilities for the TasteAI workspace.</p></div></div><div className="module-highlight-list">{module.highlights.map(item => <div key={item}><CheckCircle2 size={17} /><span>{item}</span></div>)}</div></section>
    <section className="panel module-next-panel"><div className="module-next-icon"><Sparkles size={20} /></div><div><div className="eyebrow">NEXT IMPLEMENTATION STEP</div><h2>Connect the real workflow</h2><p>{module.next}</p><Link className="text-link" href="/dashboard">Return to overview <ArrowRight size={14} /></Link></div></section>
    <div className="module-footer-note"><ShieldCheckIcon /> <span>Business-owned records are protected by the Row Level Security policies in `supabase/schema.sql`. Continue to test access with separate user accounts before production.</span></div>
  </div>;
}

function ShieldCheckIcon() {
  return <span className="module-footer-shield"><CheckCircle2 size={16} /></span>;
}
