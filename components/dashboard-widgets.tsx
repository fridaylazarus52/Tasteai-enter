
"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coffee,
  Lightbulb,
  MessageSquareText,
  MoreHorizontal,
  Package,
  Sparkles,
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

const revenueData = [
  { day: "Mon", revenue: 280000 },
  { day: "Tue", revenue: 340000 },
  { day: "Wed", revenue: 315000 },
  { day: "Thu", revenue: 410000 },
  { day: "Fri", revenue: 385000 },
  { day: "Sat", revenue: 490000 },
  { day: "Sun", revenue: 455000 },
];

const topItems = [
  {
    name: "Jollof Rice Bowl",
    category: "Main course",
    sold: "284 sold",
    revenue: "₦852,000",
    width: "86%",
    color: "lime",
  },
  {
    name: "Grilled Chicken",
    category: "Main course",
    sold: "196 sold",
    revenue: "₦784,000",
    width: "67%",
    color: "orange",
  },
  {
    name: "Chapman",
    category: "Beverages",
    sold: "173 sold",
    revenue: "₦259,500",
    width: "53%",
    color: "blue",
  },
  {
    name: "Puff-puff (6 pcs)",
    category: "Sides",
    sold: "142 sold",
    revenue: "₦142,000",
    width: "41%",
    color: "purple",
  },
];

export function DashboardOverview() {
  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">MONDAY, BUSINESS OVERVIEW</div>
          <h1>
            Good to have you here{" "}
            <span className="heading-wave">✳</span>
          </h1>
          <p>Here’s a snapshot of how your business is doing.</p>
        </div>

        <button
          className="button button-outline button-sm"
          onClick={() => window.print()}
        >
          Export overview <ArrowRight size={15} />
        </button>
      </div>

      <div className="demo-banner">
        <span className="demo-banner-icon">
          <Lightbulb size={17} />
        </span>
        <div>
          <strong>Preview workspace</strong>
          <span>
            These figures are illustrative demo data, not your live business
            results.
          </span>
        </div>
        <span className="demo-banner-label">DEMO DATA</span>
      </div>

      <div className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-top">
            <span>Total revenue</span>
            <span className="kpi-icon lime">
              <TrendingUp size={17} />
            </span>
          </div>
          <strong className="kpi-value">₦4,820,500</strong>
          <div className="kpi-foot">
            <span className="trend-positive">
              <ArrowUpRight size={14} /> 12.8%
            </span>
            <span>vs. previous period</span>
          </div>
          <div className="kpi-sparkline spark-one">
            <svg viewBox="0 0 120 30">
              <path d="M1 25 C18 20 19 7 34 15 S55 26 67 11 S90 15 119 2" />
            </svg>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span>Orders completed</span>
            <span className="kpi-icon orange">
              <Coffee size={17} />
            </span>
          </div>
          <strong className="kpi-value">1,284</strong>
          <div className="kpi-foot">
            <span className="trend-positive">
              <ArrowUpRight size={14} /> 8.2%
            </span>
            <span>vs. previous period</span>
          </div>
          <div className="kpi-sparkline spark-two">
            <svg viewBox="0 0 120 30">
              <path d="M1 24 C18 24 22 10 37 17 S58 20 73 8 S95 17 119 4" />
            </svg>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span>Average order value</span>
            <span className="kpi-icon blue">
              <ArrowUpRight size={17} />
            </span>
          </div>
          <strong className="kpi-value">₦3,754</strong>
          <div className="kpi-foot">
            <span className="trend-positive">
              <ArrowUpRight size={14} /> 4.1%
            </span>
            <span>vs. previous period</span>
          </div>
          <div className="kpi-sparkline spark-three">
            <svg viewBox="0 0 120 30">
              <path d="M1 21 C20 15 26 23 42 14 S61 17 75 11 S97 12 119 3" />
            </svg>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-top">
            <span>Active customers</span>
            <span className="kpi-icon purple">
              <Users size={17} />
            </span>
          </div>
          <strong className="kpi-value">846</strong>
          <div className="kpi-foot">
            <span className="trend-positive">
              <ArrowUpRight size={14} /> 6.7%
            </span>
            <span>vs. previous period</span>
          </div>
          <div className="kpi-sparkline spark-four">
            <svg viewBox="0 0 120 30">
              <path d="M1 27 C19 19 22 21 38 13 S62 19 76 10 S99 8 119 4" />
            </svg>
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>Track your revenue movement over time.</p>
            </div>
            <button className="select-pill" type="button">
              This week <ChevronRight size={14} />
            </button>
          </div>

          <div className="revenue-total">
            <strong>₦4,820,500</strong>
            <span className="trend-positive">
              <ArrowUpRight size={14} /> 12.8%
            </span>
            <small>Illustrative total</small>
          </div>

          <div className="revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="revenueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#a8e85b"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#a8e85b"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#edf0e9"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b9188", fontSize: 11 }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b9188", fontSize: 10 }}
                  tickFormatter={(value) =>
                    value === 0 ? "₦0" : `₦${value / 1000}k`
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    `₦${Number(value).toLocaleString("en-NG")}`,
                    "Revenue",
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e8ece4",
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#83bd3d"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  activeDot={{
                    r: 4,
                    strokeWidth: 0,
                    fill: "#6d9f2f",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-footnote">
            <span>
              <i className="legend-dot" /> Revenue · demo series
            </span>
            <span>Currency: NGN</span>
          </div>
        </section>

        <section className="panel insight-panel">
          <div className="panel-heading">
            <div className="panel-title-icon">
              <span className="feature-icon compact">
                <BrainCircuit size={17} />
              </span>
              <div>
                <h2>AI insights</h2>
                <p>Ideas to review with your team.</p>
              </div>
            </div>

            <a className="text-link" href="/dashboard/insights">
              View all <ArrowRight size={14} />
            </a>
          </div>

          <div className="insight-list">
            <article className="insight-item">
              <span className="insight-dot green">
                <TrendingUp size={15} />
              </span>
              <div>
                <div className="insight-meta">
                  <span>REVENUE OPPORTUNITY</span>
                  <span className="confidence-pill">Illustrative</span>
                </div>
                <h3>Review your weekend demand</h3>
                <p>
                  Compare weekend order patterns with staffing and menu
                  availability before planning the next schedule.
                </p>
                <a href="/dashboard/insights">
                  Review insight <ArrowRight size={13} />
                </a>
              </div>
            </article>

            <article className="insight-item">
              <span className="insight-dot amber">
                <CircleAlert size={15} />
              </span>
              <div>
                <div className="insight-meta">
                  <span>INVENTORY CHECK</span>
                  <span className="confidence-pill">Illustrative</span>
                </div>
                <h3>Check high-movement ingredients</h3>
                <p>
                  Review stock levels for popular menu items to reduce the
                  chance of avoidable stock-outs.
                </p>
                <a href="/dashboard/inventory">
                  Review inventory <ArrowRight size={13} />
                </a>
              </div>
            </article>
          </div>

          <div className="insight-disclaimer">
            <Sparkles size={14} /> Demo suggestions only. Live AI analysis is
            not connected yet.
          </div>
        </section>

        <section className="panel menu-performance-panel">
          <div className="panel-heading">
            <div>
              <h2>Menu performance</h2>
              <p>Illustrative best-performing items</p>
            </div>
            <a className="text-link" href="/dashboard/menu">
              View menu <ArrowRight size={14} />
            </a>
          </div>

          <div className="top-items">
            {topItems.map((item, index) => (
              <div className="top-item" key={item.name}>
                <div className="top-item-rank">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="top-item-main">
                  <div className="top-item-heading">
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.category} · {item.sold}
                      </span>
                    </div>
                    <b>{item.revenue}</b>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${item.color}`}
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel quick-actions-panel">
          <div className="panel-heading">
            <div>
              <h2>Quick actions</h2>
              <p>Jump into your workspace.</p>
            </div>
            <MoreHorizontal size={18} color="#9aa096" />
          </div>

          <div className="quick-actions">
            <a href="/dashboard/sales">
              <span className="quick-icon quick-lime">
                <TrendingUp size={17} />
              </span>
              <span>
                <strong>Review sales</strong>
                <small>Explore revenue activity</small>
              </span>
              <ChevronRight size={16} />
            </a>

            <a href="/dashboard/customers">
              <span className="quick-icon quick-blue">
                <Users size={17} />
              </span>
              <span>
                <strong>Customer overview</strong>
                <small>Understand your audience</small>
              </span>
              <ChevronRight size={16} />
            </a>

            <a href="/dashboard/reports">
              <span className="quick-icon quick-orange">
                <Clock3 size={17} />
              </span>
              <span>
                <strong>Build a report</strong>
                <small>Prepare a business summary</small>
              </span>
              <ChevronRight size={16} />
            </a>

            <a href="/dashboard/insights">
              <span className="quick-icon quick-purple">
                <MessageSquareText size={17} />
              </span>
              <span>
                <strong>Ask TasteAI</strong>
                <small>Explore the AI workspace</small>
              </span>
              <ChevronRight size={16} />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
