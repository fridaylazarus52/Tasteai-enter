
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CircleAlert,
  LoaderCircle,
  MapPin,
  Send,
  Sparkles,
  Utensils,
} from "lucide-react";

type FoodRecommendation = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  city: string;
  address: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string | null;
  reason: string;
};

type FoodAssistantResponse = {
  message?: string;
  recommendations?: FoodRecommendation[];
  error?: string;
};

const suggestions = [
  "Recommend lunch under 5000 naira",
  "Show me local Nigerian dishes",
  "Find an affordable rice meal",
];

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FoodAssistant() {
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("Ado-Ekiti");
  const [budget, setBudget] = useState("5000");
  const [responseMessage, setResponseMessage] = useState("");
  const [recommendations, setRecommendations] = useState<
    FoodRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (cleanMessage.length < 3) {
      setError("Please describe the food you want.");
      return;
    }

    const numericBudget = budget.trim() ? Number(budget) : undefined;

    if (
      numericBudget !== undefined &&
      (!Number.isFinite(numericBudget) || numericBudget < 0)
    ) {
      setError("Enter a valid budget of zero or more naira.");
      return;
    }

    setLoading(true);
    setError("");
    setResponseMessage("");
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
          payload.error ||
            `The Food Assistant request failed (HTTP ${response.status}).`
        );
      }

      setResponseMessage(
        payload.message || "Here are the available food recommendations."
      );
      setRecommendations(
        Array.isArray(payload.recommendations)
          ? payload.recommendations
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach the Food Assistant. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function useSuggestion(value: string) {
    setMessage(value);
    setError("");
  }

  return (
    <main className="food-assistant-page">
      <div className="food-assistant-container">
        <nav className="food-assistant-nav">
          <Link href="/" className="food-assistant-back">
            <ArrowLeft size={17} />
            Back to TasteAI
          </Link>

          <Link
            href="/marketplace"
            className="food-assistant-marketplace-link"
          >
            Browse marketplace <ArrowRight size={16} />
          </Link>
        </nav>

        <header className="food-assistant-hero">
          <div className="food-assistant-logo">
            <Sparkles size={23} />
          </div>

          <p className="food-assistant-eyebrow">
            TASTEAI INTELLIGENCE
          </p>

          <h1>Your personal Food Assistant</h1>

          <p className="food-assistant-intro">
            Tell us what you feel like eating. Get recommendations
            based on available marketplace menus, your location and
            your budget.
          </p>

          <div className="food-assistant-powered">
            <span className="food-assistant-status-dot" />
            Powered by Groq AI and Supabase menu data
          </div>
        </header>

        <section className="food-assistant-panel">
          <div className="food-assistant-panel-heading">
            <div className="food-assistant-bot-icon">
              <Bot size={22} />
            </div>
            <div>
              <h2>What would you like to eat?</h2>
              <p>Describe your meal, preferences or budget.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              className="food-assistant-label"
              htmlFor="food-message"
            >
              Your request
            </label>

            <textarea
              id="food-message"
              className="food-assistant-textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Example: Recommend lunch under 5000 naira"
              maxLength={500}
              rows={3}
              disabled={loading}
              required
            />

            <div className="food-assistant-fields">
              <div className="food-assistant-field">
                <label
                  className="food-assistant-label"
                  htmlFor="food-city"
                >
                  <MapPin size={15} />
                  City or location
                </label>
                <input
                  id="food-city"
                  className="food-assistant-input"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="e.g. Ado-Ekiti or Lagos"
                  maxLength={100}
                  disabled={loading}
                />
              </div>

              <div className="food-assistant-field">
                <label
                  className="food-assistant-label"
                  htmlFor="food-budget"
                >
                  Budget (₦)
                </label>
                <input
                  id="food-budget"
                  className="food-assistant-input"
                  type="number"
                  min="0"
                  step="100"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="5000"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="food-assistant-suggestions">
              <span>Try asking</span>
              <div className="food-assistant-suggestion-list">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="food-assistant-suggestion"
                    onClick={() => useSuggestion(suggestion)}
                    disabled={loading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="food-assistant-error" role="alert">
                <CircleAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="food-assistant-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="food-assistant-spinner" size={18} />
                  Finding available meals...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Find my meals
                </>
              )}
            </button>
          </form>
        </section>

        {responseMessage && (
          <section
            className="food-assistant-results"
            aria-live="polite"
          >
            <div className="food-assistant-response">
              <div className="food-assistant-response-icon">
                <Sparkles size={18} />
              </div>
              <p>{responseMessage}</p>
            </div>

            <div className="food-assistant-results-heading">
              <div>
                <h2>Recommended for you</h2>
                <p>
                  {recommendations.length
                    ? `${recommendations.length} meal${recommendations.length === 1 ? "" : "s"} found`
                    : "No matching meals were returned for this request."}
                </p>
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="food-assistant-meal-grid">
                {recommendations.map((food) => (
                  <article
                    className="food-assistant-meal-card"
                    key={food.id}
                  >
                    <div className="food-assistant-meal-image">
                      {food.imageUrl ? (
                        // Marketplace image URLs come from the Supabase menu.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="food-assistant-image-placeholder">
                          <Utensils size={35} />
                          <span>Food image unavailable</span>
                        </div>
                      )}
                    </div>

                    <div className="food-assistant-meal-content">
                      {food.category && (
                        <span className="food-assistant-category">
                          {food.category}
                        </span>
                      )}

                      <h3>{food.name}</h3>
                      <p className="food-assistant-restaurant">
                        {food.restaurantName}
                      </p>

                      <p className="food-assistant-address">
                        <MapPin size={14} />
                        {food.address || food.city}
                      </p>

                      {food.description && (
                        <p className="food-assistant-description">
                          {food.description}
                        </p>
                      )}

                      {food.reason && (
                        <div className="food-assistant-reason">
                          <Sparkles size={15} />
                          <span>{food.reason}</span>
                        </div>
                      )}

                      <div className="food-assistant-meal-footer">
                        <strong>{formatNaira(food.price)}</strong>
                        <Link
                          href="/marketplace"
                          className="food-assistant-view-link"
                        >
                          View marketplace <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <p className="food-assistant-data-note">
              Recommendations use available menu records. An image
              appears only when the menu has an image URL. No order is
              placed by requesting recommendations.
            </p>
          </section>
        )}

        <footer className="food-assistant-footer">
          <Link href="/marketplace">
            Explore all marketplace menus <ArrowRight size={15} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
