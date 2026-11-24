
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  BrainCircuit,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Sparkles,
  Utensils,
  XCircle,
} from "lucide-react";

type FoodRecommendation = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  city: string;
  address: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
  reason: string;
};

type FoodAssistantResponse = {
  message?: string;
  recommendations?: FoodRecommendation[];
  error?: string;
};

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export default function HomeFoodAI() {
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("Ado-Ekiti");
  const [budget, setBudget] = useState("5000");
  const [answer, setAnswer] = useState("");
  const [recommendations, setRecommendations] = useState<
    FoodRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();
    const numericBudget = Number(budget);

    if (!cleanMessage) {
      setError("Please enter what you would like help finding.");
      return;
    }

    if (!Number.isFinite(numericBudget) || numericBudget < 0) {
      setError("Please enter a valid budget.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setRecommendations([]);

    try {
      const response = await fetch("/api/ai/food-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
          city: city.trim() || undefined,
          budget: numericBudget,
        }),
      });

      const payload =
        (await response.json()) as FoodAssistantResponse;

      if (!response.ok) {
        throw new Error(
          payload.error || "TasteAI could not complete your request.",
        );
      }

      setAnswer(
        payload.message ||
          "Here is the information TasteAI found for your request.",
      );

      setRecommendations(payload.recommendations || []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function useSuggestion(suggestion: string) {
    setMessage(suggestion);
    setError("");
  }

  return (
    <section className="home-ai" aria-labelledby="home-ai-title">
      <div className="home-ai-orb home-ai-orb-one" />
      <div className="home-ai-orb home-ai-orb-two" />

      <div className="home-ai-header">
        <div className="home-ai-brand-icon">
          <BrainCircuit size={27} strokeWidth={2.1} />
          <span className="home-ai-icon-sparkle">
            <Sparkles size={12} />
          </span>
        </div>

        <div className="home-ai-heading">
          <span className="home-ai-eyebrow">
            YOUR INTELLIGENT FOOD COMPANION
          </span>
          <h3 id="home-ai-title">TasteAI Intelligence</h3>
          <p>Find your next favourite meal with AI.</p>
        </div>

        <span className="home-ai-status">
          <span />
          AI READY
        </span>
      </div>

      <div className="home-ai-message">
        <Sparkles size={17} />
        <p>
          Tell me what you are craving, where you are, and your budget.
          I&apos;ll help you discover available meals from the TasteAI
          marketplace.
        </p>
      </div>

      <form className="home-ai-form" onSubmit={handleSubmit}>
        <label className="home-ai-input-label" htmlFor="home-ai-question">
          WHAT CAN I HELP YOU FIND?
        </label>

        <textarea
          id="home-ai-question"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. Recommend lunch under ₦5,000 in Ado-Ekiti..."
          rows={3}
          maxLength={2000}
          disabled={loading}
        />

        <div className="home-ai-form-fields">
          <label className="home-ai-field">
            <span>
              <MapPin size={14} />
              Location
            </span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Enter your city"
              maxLength={100}
              disabled={loading}
            />
          </label>

          <label className="home-ai-field">
            <span>
              <span className="home-ai-naira">₦</span>
              Budget
            </span>
            <input
              type="number"
              min="0"
              step="100"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="5000"
              disabled={loading}
            />
          </label>
        </div>

        <button
          className="home-ai-submit"
          type="submit"
          disabled={loading || !message.trim()}
        >
          {loading ? (
            <>
              <LoaderCircle className="home-ai-spinner" size={18} />
              Finding recommendations...
            </>
          ) : (
            <>
              <Sparkles size={17} />
              Ask TasteAI
              <ArrowUp size={17} />
            </>
          )}
        </button>
      </form>

      <div className="home-ai-suggestions">
        <span>TRY ASKING</span>
        <div>
          <button
            type="button"
            onClick={() =>
              useSuggestion("Recommend lunch within my budget")
            }
            disabled={loading}
          >
            <Utensils size={13} />
            Lunch ideas
          </button>

          <button
            type="button"
            onClick={() =>
              useSuggestion("Find affordable meals for me")
            }
            disabled={loading}
          >
            Affordable meals
          </button>

          <button
            type="button"
            onClick={() =>
              useSuggestion("Recommend popular local dishes")
            }
            disabled={loading}
          >
            Local dishes
          </button>
        </div>
      </div>

      {error && (
        <div className="home-ai-error" role="alert">
          <XCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {answer && (
        <div className="home-ai-response" aria-live="polite">
          <div className="home-ai-response-heading">
            <CheckCircle2 size={18} />
            <strong>TasteAI&apos;s response</strong>
          </div>

          <p className="home-ai-answer">{answer}</p>

          {recommendations.length > 0 && (
            <div className="home-ai-results">
              <h4>Recommended for you</h4>

              {recommendations.map((food) => (
                <article className="home-ai-food" key={food.id}>
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="home-ai-food-placeholder">
                      <Utensils size={23} />
                    </div>
                  )}

                  <div className="home-ai-food-info">
                    <strong>{food.name}</strong>
                    <span>{food.restaurantName}</span>
                    <small>
                      {food.city}
                      {food.category ? ` · ${food.category}` : ""}
                    </small>
                    {food.reason && <p>{food.reason}</p>}
                  </div>

                  <strong className="home-ai-food-price">
                    {formatNaira(food.price)}
                  </strong>
                </article>
              ))}
            </div>
          )}

          <Link className="home-ai-marketplace-link" href="/marketplace">
            Explore marketplace
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="home-ai-footer">
        <span>
          <ShieldCheckIcon />
          Powered by TasteAI
        </span>
        <span>Discover meals that fit your needs</span>
      </div>
    </section>
  );
}

function ShieldCheckIcon() {
  return <CheckCircle2 size={13} />;
}
