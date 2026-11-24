
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  CircleAlert,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getOrCreateBusiness,
  money,
  type TasteBusiness,
} from "@/lib/business-client";

type Sale = {
  id: string;
  total_amount: number | string;
  status: string;
  sold_at: string;
  currency?: string;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  unit_price: number | string;
  cost_price: number | string;
  stock_quantity: number | string;
  is_active: boolean;
};

type Insight = {
  title: string;
  summary: string;
  tone: "green" | "amber" | "blue";
  href: string;
};

type RevenueDay = {
  date: string;
  label: string;
  revenue: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? null : 0;
  }

  return ((current - previous) / previous) * 100;
}

export default function LiveDashboardOverview() {
  const [business, setBusiness] = useState<TasteBusiness | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { business: workspace, supabase } =
        await getOrCreateBusiness();

      setBusiness(workspace);

      const now = new Date();
      const today = startOfDay(now);
      const currentStart = new Date(today.getTime() - 29 * DAY_MS);
      const previousStart = new Date(today.getTime() - 59 * DAY_MS);

      const [salesResult, productsResult, customersResult, expensesResult] =
        await Promise.all([
          supabase
            .from("sales")
            .select("id,total_amount,status,sold_at,currency")
            .eq("business_id", workspace.id)
            .gte("sold_at", previousStart.toISOString())
            .order("sold_at", { ascending: true }),

          supabase
            .from("products")
            .select(
              "id,name,category,unit_price,cost_price,stock_quantity,is_active"
            )
            .eq("business_id", workspace.id)
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("business_id", workspace.id),

          supabase
            .from("expenses")
            .select("amount")
            .eq("business_id", workspace.id)
            .gte("spent_at", previousStart.toISOString().slice(0, 10)),
        ]);

      const failure =
        salesResult.error ||
        productsResult.error ||
        customersResult.error ||
        expensesResult.error;

      if (failure) {
        throw new Error(failure.message);
      }

      setSales((salesResult.data ?? []) as Sale[]);
      setProducts((productsResult.data ?? []) as Product[]);
      setCustomerCount(customersResult.count ?? 0);

      setExpenseTotal(
        (expensesResult.data ?? []).reduce(
          (sum, row) => sum + Number(row.amount || 0),
          0
        )
      );

      setUpdatedAt(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const completedSales = useMemo(
    () => sales.filter((sale) => sale.status === "completed"),
    [sales]
  );

  const { revenue, previousRevenue, completed, previousCompleted } =
    useMemo(() => {
      const now = new Date();
      const today = startOfDay(now);
      const currentStart = new Date(today.getTime() - 29 * DAY_MS);
      const previousStart = new Date(today.getTime() - 59 * DAY_MS);

      const current = completedSales.filter((sale) => {
        const timestamp = new Date(sale.sold_at).getTime();
        return (
          timestamp >= currentStart.getTime() &&
          timestamp < today.getTime() + DAY_MS
        );
      });

      const previous = completedSales.filter((sale) => {
        const timestamp = new Date(sale.sold_at).getTime();
        return (
          timestamp >= previousStart.getTime() &&
          timestamp < currentStart.getTime()
        );
      });

      return {
        revenue: current.reduce(
          (sum, sale) => sum + Number(sale.total_amount || 0),
          0
        ),
        previousRevenue: previous.reduce(
          (sum, sale) => sum + Number(sale.total_amount || 0),
          0
        ),
        completed: current.length,
        previousCompleted: previous.length,
      };
    }, [completedSales]);

  const averageOrder = completed ? revenue / completed : 0;
  const revenueChange = percentageChange(revenue, previousRevenue);
  const salesChange = percentageChange(completed, previousCompleted);

  const revenueDays = useMemo<RevenueDay[]>(() => {
    const today = startOfDay(new Date());
    const totals = new Map<string, number>();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * DAY_MS);
      totals.set(dayKey(date), 0);
    }

    for (const sale of completedSales) {
      const date = new Date(sale.sold_at);
      const key = dayKey(date);

      if (totals.has(key)) {
        totals.set(
          key,
          (totals.get(key) ?? 0) + Number(sale.total_amount || 0)
        );
      }
    }

    return Array.from(totals, ([date, amount]) => {
      const parsed = new Date(`${date}T12:00:00`);
      return {
        date,
        label: parsed.toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
        }),
        revenue: amount,
      };
    });
  }, [completedSales]);

  const lowStock = products.filter(
    (product) => Number(product.stock_quantity) <= 5
  );

  // These are priced products, not best sellers: sales line-item data
  // is needed before we can reliably rank products by units sold.
  const menuSnapshot = [...products]
    .sort(
      (a, b) => Number(b.unit_price) - Number(a.unit_price)
    )
    .slice(0, 4);

  const insights: Insight[] = [];

  if (completed === 0) {
    insights.push({
      title: "Record your first sale",
      summary:
        "Record completed transactions to start building your revenue history.",
      tone: "blue",
      href: "/dashboard/sales",
    });
  }

  if (lowStock.length > 0) {
    insights.push({
      title: `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} need a stock review`,
      summary: `${lowStock
        .slice(0, 3)
        .map((product) => product.name)
        .join(", ")}${
        lowStock.length > 3 ? " and more" : ""
      } have five or fewer units recorded.`,
      tone: "amber",
      href: "/dashboard/inventory",
    });
  }

  if (revenueChange !== null && revenueChange < 0) {
    insights.push({
      title: "Revenue is below the previous period",
      summary: `Recorded revenue is down ${Math.abs(
        revenueChange
      ).toFixed(1)}% compared with the previous 30 days. Review daily sales for context.`,
      tone: "amber",
      href: "/dashboard/sales",
    });
  } else if (revenueChange !== null && revenueChange > 0) {
    insights.push({
      title: "Revenue is higher than the previous period",
      summary: `Recorded revenue increased ${revenueChange.toFixed(
        1
      )}% compared with the previous 30 days.`,
      tone: "green",
      href: "/dashboard/sales",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Your workspace is ready",
      summary:
        "Keep sales, product, and customer records up to date to improve your business overview.",
      tone: "green",
      href: "/dashboard/menu",
    });
  }

  const formatChange = (change: number | null) => {
    if (change === null) return "No previous-period baseline";
    if (change === 0) return "No change vs. previous 30 days";

    return `${change > 0 ? "+" : ""}${change.toFixed(
      1
    )}% vs. previous 30 days`;
  };

  return (
    <div className="live-page">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">BUSINESS OVERVIEW</div>
          <h1>
            {business?.name
              ? `Welcome to ${business.name}`
              : "Your business at a glance"}
          </h1>
          <p>
            Your recorded business activity, with a daily revenue trend and
            operational alerts.
          </p>
        </div>

        <button
          className="button button-outline button-sm"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle size={15} className="spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="live-alert live-alert-error">
          <CircleAlert size={18} />
          <div>
            <strong>Could not load your live data</strong>
            <p>{error}</p>
            <p>
              Check the Supabase connection, table names, permissions, and
              business-level access policies.
            </p>
          </div>
        </div>
      )}

      <div className="live-status-line">
        <span className="live-status-dot" />
        {loading
          ? "Loading live workspace data…"
          : `Connected to Supabase${
              updatedAt
                ? ` · Updated ${updatedAt.toLocaleTimeString()}`
                : ""
            }`}
      </div>

      <div className="kpi-grid live-kpi-grid">
        <article className="kpi-card">
          <div className="kpi-top">
            <span>Revenue · last 30 days</span>
            <span className="kpi-icon lime">
              <BarChart3 size={17} />
            </span>
          </div>
          <strong className="kpi-value">
            {loading ? "—" : money(revenue, business?.currency)}
          </strong>
          <div className="kpi-foot">
            <span>
              {loading ? "Loading comparison…" : formatChange(revenueChange)}
            </span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span>Completed sales</span>
            <span className="kpi-icon orange">
              <ClipboardList size={17} />
            </span>
          </div>
          <strong className="kpi-value">
            {loading ? "—" : completed.toLocaleString()}
          </strong>
          <div className="kpi-foot">
            <span>
              {loading ? "Loading comparison…" : formatChange(salesChange)}
            </span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span>Average sale</span>
            <span className="kpi-icon blue">
              <Activity size={17} />
            </span>
          </div>
          <strong className="kpi-value">
            {loading ? "—" : money(averageOrder, business?.currency)}
          </strong>
          <div className="kpi-foot">
            <span>Revenue ÷ completed sales</span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span>Customers</span>
            <span className="kpi-icon purple">
              <Users size={17} />
            </span>
          </div>
          <strong className="kpi-value">
            {loading ? "—" : customerCount.toLocaleString()}
          </strong>
          <div className="kpi-foot">
            <span>Saved customer records</span>
          </div>
        </article>
      </div>

      <section
        className="panel live-panel"
        style={{ marginBottom: 20, minWidth: 0 }}
      >
        <div className="panel-heading">
          <div>
            <h2>Revenue trend</h2>
            <p>Daily completed-sale revenue for the last 30 days.</p>
          </div>
          <TrendingUp size={19} />
        </div>

        {loading ? (
          <p className="live-muted">Loading revenue history…</p>
        ) : (
          <>
            <div style={{ width: "100%", height: 280, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueDays}
                  margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="tasteRevenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#84cc16"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="95%"
                        stopColor="#84cc16"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border, #e5e7eb)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis
                    width={72}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value: number) =>
                      value >= 1000000
                        ? `₦${(value / 1000000).toFixed(1)}m`
                        : value >= 1000
                          ? `₦${(value / 1000).toFixed(0)}k`
                          : `₦${value}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      money(Number(value), business?.currency),
                      "Revenue",
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date ?? ""
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#65a30d"
                    strokeWidth={2.5}
                    fill="url(#tasteRevenueFill)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {completed === 0 && (
              <div className="live-empty">
                <BarChart3 size={22} />
                <strong>No completed sales in this period</strong>
                <p>
                  Once you record completed sales, your daily revenue trend
                  will appear here.
                </p>
                <Link
                  className="button button-primary button-sm"
                  href="/dashboard/sales"
                >
                  Record a sale
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      <div className="live-two-col">
        <section className="panel live-panel">
          <div className="panel-heading">
            <div>
              <h2>Business signals</h2>
              <p>Operational checks based on your saved records.</p>
            </div>
            <BrainCircuit size={19} />
          </div>

          {insights.map((item, index) => (
            <div
              className="live-insight-row"
              key={`${item.title}-${index}`}
            >
              <span className={`live-signal-icon ${item.tone}`}>
                {item.tone === "amber" ? (
                  <CircleAlert size={17} />
                ) : (
                  <BrainCircuit size={17} />
                )}
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <Link href={item.href}>
                  Review <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}

          <p className="live-disclaimer">
            These are rule-based signals, not AI-generated predictions.
          </p>
        </section>

        <section className="panel live-panel">
          <div className="panel-heading">
            <div>
              <h2>Menu snapshot</h2>
              <p>Active products, prices, and recorded stock.</p>
            </div>
            <Boxes size={19} />
          </div>

          {loading ? (
            <p className="live-muted">Loading products…</p>
          ) : menuSnapshot.length ? (
            menuSnapshot.map((product) => (
              <div className="live-product-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.category || "Uncategorized"}</span>
                </div>
                <div className="live-product-value">
                  <strong>
                    {money(
                      Number(product.unit_price),
                      business?.currency
                    )}
                  </strong>
                  <span
                    className={
                      Number(product.stock_quantity) <= 5
                        ? "stock-low"
                        : ""
                    }
                  >
                    {Number(product.stock_quantity)} in stock
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="live-empty">
              <Boxes size={22} />
              <strong>No products yet</strong>
              <p>Add menu products to start tracking prices and stock.</p>
              <Link
                className="button button-primary button-sm"
                href="/dashboard/menu"
              >
                Add products
              </Link>
            </div>
          )}

          <Link
            className="text-link live-panel-link"
            href="/dashboard/inventory"
          >
            Manage inventory <ArrowRight size={14} />
          </Link>
        </section>
      </div>

      <div className="live-shortcuts">
        <Link href="/dashboard/sales">
          <BarChart3 size={17} />
          <span>
            <strong>Record a sale</strong>
            <small>Save a transaction</small>
          </span>
          <ArrowRight size={15} />
        </Link>

        <Link href="/dashboard/customers">
          <Users size={17} />
          <span>
            <strong>Add a customer</strong>
            <small>Build customer records</small>
          </span>
          <ArrowRight size={15} />
        </Link>

        <Link href="/dashboard/insights">
          <BrainCircuit size={17} />
          <span>
            <strong>Review insights</strong>
            <small>Review business signals</small>
          </span>
          <ArrowRight size={15} />
        </Link>
      </div>

      <p className="live-footnote">
        Expenses recorded in the last 60 days:{" "}
        <strong>{money(expenseTotal, business?.currency)}</strong>. This
        expense figure covers the queried period; it is not a profit
        calculation.
      </p>
    </div>
  );
}
