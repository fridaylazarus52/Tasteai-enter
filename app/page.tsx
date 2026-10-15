import Link from "next/link";
import {
  ArrowRight, BarChart3, BrainCircuit, Check, ChefHat, CircleDollarSign,
  LineChart, ShieldCheck, Sparkles, TrendingUp, Utensils, Boxes
} from "lucide-react";

const features = [
  { icon: BarChart3, title: "Business intelligence", text: "Bring sales, customer, and operations signals into one clear view." },
  { icon: BrainCircuit, title: "AI business analyst", text: "Turn business data into practical explanations and next steps." },
  { icon: LineChart, title: "Predictive operations", text: "Build a stronger planning habit with demand and revenue forecasts." },
  { icon: Boxes, title: "Menu & inventory intelligence", text: "Understand product performance and spot stock risks earlier." }
];

export default function HomePage() {
  return (
    <main className="landing">
      <header className="marketing-nav container">
        <Link className="brand" href="/"><span className="brand-mark"><ChefHat size={21} /></span><span>TasteAI<span className="brand-light"> Enterprise</span></span></Link>
        <nav className="nav-links"><a href="#platform">Platform</a><a href="#industries">Industries</a><a href="#security">Security</a></nav>
        <div className="nav-actions"><Link className="button button-quiet" href="/login">Log in</Link><Link className="button button-primary" href="/signup">Get started <ArrowRight size={16} /></Link></div>
      </header>

      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> AI-powered food business intelligence</div>
          <h1>Run your food business with <span>more clarity.</span></h1>
          <p className="hero-subtitle">Bring your sales, menu, customers, and operations together. TasteAI turns business data into insights your team can actually use.</p>
          <div className="hero-actions"><Link href="/signup" className="button button-primary button-large">Start building smarter <ArrowRight size={18} /></Link><a className="button button-outline button-large" href="#platform">Explore the platform</a></div>
          <div className="hero-proof"><span className="proof-check"><Check size={13} /></span> Designed for restaurants, cafés, caterers, and hospitality teams</div>
        </div>
        <div className="hero-visual" aria-label="Illustrative TasteAI dashboard preview">
          <div className="visual-glow" />
          <div className="preview-window">
            <div className="preview-top"><div className="preview-brand"><span className="brand-mark mini"><ChefHat size={14} /></span> TasteAI <span className="demo-label">PREVIEW</span></div><span className="live-dot">Overview</span></div>
            <div className="preview-title"><div><small>BUSINESS OVERVIEW</small><h3>Your business at a glance</h3></div><span className="preview-period">Illustrative data</span></div>
            <div className="preview-stats">
              <div className="preview-stat"><small>Revenue</small><strong>₦4.82m</strong><span className="positive"><TrendingUp size={13} /> 12.8%</span></div>
              <div className="preview-stat"><small>Orders</small><strong>1,284</strong><span className="positive"><TrendingUp size={13} /> 8.2%</span></div>
              <div className="preview-stat"><small>Avg. order</small><strong>₦3,754</strong><span className="positive">+4.1%</span></div>
            </div>
            <div className="preview-chart">
              <div className="chart-head"><strong>Revenue trend</strong><small>DEMO DATA</small></div>
              <div className="fake-chart"><div className="chart-y-labels"><span>₦5m</span><span>₦3m</span><span>₦1m</span><span>₦0</span></div><svg viewBox="0 0 390 126" role="img" aria-label="Illustrative revenue line chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b6f36b" stopOpacity=".28"/><stop offset="100%" stopColor="#b6f36b" stopOpacity="0"/></linearGradient></defs><path d="M0 103 C22 96 31 75 53 82 S87 90 109 65 S142 77 163 52 S196 62 216 39 S252 52 274 31 S310 48 331 22 S366 33 390 10 L390 126 L0 126 Z" fill="url(#area)"/><path d="M0 103 C22 96 31 75 53 82 S87 90 109 65 S142 77 163 52 S196 62 216 39 S252 52 274 31 S310 48 331 22 S366 33 390 10" fill="none" stroke="#9ee65a" strokeWidth="3" strokeLinecap="round"/></svg></div>
              <div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
            </div>
            <div className="preview-insight"><span className="insight-icon"><Sparkles size={16} /></span><div><strong>AI insight preview</strong><p>Weekend demand may be a useful focus for your next menu and staffing review.</p></div></div>
          </div>
          <div className="floating-tag"><span className="floating-icon"><CircleDollarSign size={17} /></span><span><strong>One clear view</strong><small>Sales · Menu · Operations</small></span></div>
        </div>
      </section>

      <section className="trust-strip"><div className="container trust-inner"><span>BUILT FOR FOOD & HOSPITALITY</span><div><Utensils size={17} /> Restaurants</div><div><ChefHat size={17} /> Cafés & bakeries</div><div><Boxes size={17} /> Catering teams</div><div><ShieldCheck size={17} /> Multi-location groups</div></div></section>

      <section className="section container" id="platform">
        <div className="section-heading"><div className="eyebrow">THE PLATFORM</div><h2>From scattered numbers to <span>better decisions.</span></h2><p>Bring your key business signals together and give your team a clearer starting point for the next decision.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, text }) => <article className="feature-card" key={title}><div className="feature-icon"><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><a href="/signup">Explore capability <ArrowRight size={14} /></a></article>)}</div>
      </section>

      <section className="dark-band" id="industries"><div className="container dark-band-inner"><div><div className="eyebrow eyebrow-dark">BUILT FOR YOUR REALITY</div><h2>Made for the moving parts of food service.</h2><p>Whether you manage one café or coordinate multiple locations, start with a clearer picture of what is happening across your business.</p></div><div className="industry-pills"><span>Restaurants</span><span>Hotels</span><span>Catering</span><span>Food brands</span><span>Bakeries</span><span>Multi-location groups</span></div></div></section>

      <section className="security-section container" id="security"><div className="security-icon"><ShieldCheck size={27} /></div><div><h2>Business data deserves care.</h2><p>TasteAI is designed around authenticated access and database-level access controls. Supabase Row Level Security is part of the starter foundation; production deployments still require configuration review and testing.</p></div><Link className="button button-outline" href="/signup">Create your workspace <ArrowRight size={16} /></Link></section>

      <footer className="footer container"><Link className="brand" href="/"><span className="brand-mark"><ChefHat size={18} /></span><span>TasteAI<span className="brand-light"> Enterprise</span></span></Link><span>© {new Date().getFullYear()} TasteAI Enterprise. A smarter starting point for food business decisions.</span><div><Link href="/login">Log in</Link><Link href="/signup">Get started</Link></div></footer>
    </main>
  );
}
