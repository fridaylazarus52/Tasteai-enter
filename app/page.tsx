
import "./globals.css";

import HomeFoodAI from "@/components/home-food-ai";

import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChefHat,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Utensils,
  Boxes,
  MapPin,
  ShoppingBag,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Business intelligence",
    text: "Bring sales, customer, and operations signals into one clear view.",
  },
  {
    icon: BrainCircuit,
    title: "AI business analyst",
    text: "Turn business data into practical explanations and next steps.",
  },
  {
    icon: LineChart,
    title: "Predictive operations",
    text: "Plan more confidently with demand and revenue forecasts.",
  },
  {
    icon: Boxes,
    title: "Menu and inventory intelligence",
    text: "Understand product performance and spot stock risks earlier.",
  },
];

const marketplaceFeatures = [
  {
    icon: MapPin,
    title: "Discover restaurants",
    text: "Explore participating restaurants, search listings, and find locations.",
    image: "/image/discover-restaurants.jpg",
    imageAlt: "Discover restaurants and dining locations",
  },
  {
    icon: Utensils,
    title: "Explore food menus",
    text: "Explore food menus, dishes, descriptions, photos, and prices.",
    image: "/image/food-explore-menu.jpg",
    imageAlt: "Explore food and restaurant menus",
  },
  {
    icon: ShoppingBag,
    title: "Order and track",
    text: "Explore food ordering and track orders through the marketplace.",
    image: "/image/order-track.jpg",
    imageAlt: "Food ordering and delivery tracking",
  },
];

export default function HomePage() {
  return (
    <main className="landing">
      <header className="marketing-nav container">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <ChefHat size={21} />
          </span>
          <span>
            TasteAI<span className="brand-light"> Enterprise</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#marketplace">Marketplace</a>
          <a href="#industries">Industries</a>
          <a href="#security">Security</a>
        </nav>

        <div className="nav-actions">
          <Link className="button button-quiet" href="/login">
            Log in
          </Link>
          <Link className="button button-primary" href="/signup">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            AI-powered food business intelligence
          </div>

          <h1>
            Run your food business with <span>more clarity.</span>
          </h1>

          <p className="hero-subtitle">
            Bring your sales, menu, customers, and operations together.
            TasteAI turns business data into insights your team can actually
            use.
          </p>

          <div className="hero-actions">
            <Link
              href="/signup"
              className="button button-primary button-large"
            >
              Start building smarter <ArrowRight size={18} />
            </Link>

            <Link
              href="/marketplace"
              className="button button-outline button-large"
            >
              <Utensils size={17} /> Discover restaurants
            </Link>
          </div>

          <div className="hero-proof">
            <span className="proof-check">
              <Check size={13} />
            </span>
            Designed for restaurants, cafés, caterers, and hospitality teams
          </div>
        </div>

        {/* Food recommendation AI replaces the entire dashboard preview. */}
        <div
          className="hero-visual home-food-ai-visual"
          aria-label="TasteAI food recommendation assistant"
        >
          <div className="visual-glow" />
          <HomeFoodAI />
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-inner">
          <span>BUILT FOR FOOD &amp; HOSPITALITY</span>

          <div>
            <Utensils size={17} /> Restaurants
          </div>

          <div>
            <ChefHat size={17} /> Cafés &amp; bakeries
          </div>

          <div>
            <Boxes size={17} /> Catering teams
          </div>

          <div>
            <ShieldCheck size={17} /> Multi-location groups
          </div>
        </div>
      </section>

      <section className="section container" id="platform">
        <div className="section-heading">
          <div className="eyebrow">THE PLATFORM</div>

          <h2>
            From scattered numbers to <span>better decisions.</span>
          </h2>

          <p>
            Bring your key business signals together and give your team a
            clearer starting point for the next decision.
          </p>
        </div>

        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon">
                <Icon size={21} />
              </div>

              <h3>{title}</h3>
              <p>{text}</p>

              <Link href="/signup">
                Explore capability <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section container" id="marketplace">
        <div className="section-heading">
          <div className="eyebrow">TASTEAI MARKETPLACE</div>

          <h2>
            Discover food. <span>Order with confidence.</span>
          </h2>

          <p>
            Explore participating restaurants, browse their menus, and manage
            your food orders from one place.
          </p>
        </div>

        <div className="feature-grid marketplace-feature-grid">
          {marketplaceFeatures.map(
            ({ icon: Icon, title, text, image, imageAlt }) => (
              <article
                className="feature-card marketplace-image-card"
                key={title}
              >
                <div className="marketplace-card-image">
                  <img
                    src={image}
                    alt={imageAlt}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="marketplace-card-content">
                  <div className="feature-icon">
                    <Icon size={21} />
                  </div>

                  <h3>{title}</h3>
                  <p>{text}</p>

                  <Link href="/marketplace">
                    Open marketplace <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            )
          )}
        </div>

        <div
          className="hero-actions"
          style={{ justifyContent: "center", marginTop: 32 }}
        >
          <Link
            href="/marketplace"
            className="button button-primary button-large"
          >
            Explore the marketplace <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="dark-band" id="industries">
        <div className="container dark-band-inner">
          <div>
            <div className="eyebrow eyebrow-dark">
              BUILT FOR YOUR REALITY
            </div>

            <h2>Made for the moving parts of food service.</h2>

            <p>
              Whether you manage one café or coordinate multiple locations,
              start with a clearer picture of what is happening across your
              business.
            </p>
          </div>

          <div className="industry-pills">
            <span>Restaurants</span>
            <span>Hotels</span>
            <span>Catering</span>
            <span>Food brands</span>
            <span>Bakeries</span>
            <span>Multi-location groups</span>
          </div>
        </div>
      </section>

      <section className="security-section container" id="security">
        <div className="security-icon">
          <ShieldCheck size={27} />
        </div>

        <div>
          <h2>Business data deserves care.</h2>

          <p>
            TasteAI is designed around authenticated access and database-level
            access controls. Supabase Row Level Security is part of the
            foundation; production deployments still require configuration
            review and testing.
          </p>
        </div>

        <Link className="button button-outline" href="/signup">
          Create your workspace <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="footer container">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <ChefHat size={18} />
          </span>

          <span>
            TasteAI<span className="brand-light"> Enterprise</span>
          </span>
        </Link>

        <span>
          © {new Date().getFullYear()} TasteAI Enterprise. A smarter starting
          point for food business decisions.
        </span>

        <div>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Get started</Link>
        </div>
      </footer>
    </main>
  );
}
