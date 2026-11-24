
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Utensils,
  MapPin,
  RefreshCw,
  ImageOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./menus.css";

type Restaurant = {
  id: string;
  public_name: string;
  description: string | null;
  city: string;
  address: string;
};

type Food = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string;
  image_url: string | null;
};

const money = (amount: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount));

export default function FoodMenusPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMenus() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: restaurantData, error: restaurantError } =
        await supabase
          .from("marketplace_restaurants")
          .select("id, public_name, description, city, address")
          .eq("is_published", true)
          .order("public_name");

      if (restaurantError) throw restaurantError;

      const availableRestaurants = (restaurantData ?? []) as Restaurant[];
      setRestaurants(availableRestaurants);

      if (availableRestaurants.length === 0) {
        setFoods([]);
        return;
      }

      const restaurantIds = availableRestaurants.map((item) => item.id);

      const { data: foodData, error: foodError } = await supabase
        .from("marketplace_foods")
        .select(
          "id, restaurant_id, name, description, category, price, image_url"
        )
        .in("restaurant_id", restaurantIds)
        .eq("is_available", true)
        .order("name");

      if (foodError) throw foodError;

      setFoods((foodData ?? []) as Food[]);
    } catch (err) {
      console.error("Unable to load food menus:", err);
      setError(
        "We couldn't load the food menus. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenus();
  }, []);

  const categories = useMemo(() => {
    const values = foods
      .map((food) => food.category?.trim())
      .filter((value): value is string => Boolean(value));

    return ["All categories", ...Array.from(new Set(values)).sort()];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    const term = search.trim().toLowerCase();

    return foods.filter((food) => {
      const restaurant = restaurants.find(
        (item) => item.id === food.restaurant_id
      );

      const matchesRestaurant =
        selectedRestaurant === "all" ||
        food.restaurant_id === selectedRestaurant;

      const matchesCategory =
        category === "All categories" || food.category === category;

      const matchesSearch =
        !term ||
        food.name.toLowerCase().includes(term) ||
        food.description?.toLowerCase().includes(term) ||
        food.category?.toLowerCase().includes(term) ||
        restaurant?.public_name.toLowerCase().includes(term);

      return matchesRestaurant && matchesCategory && matchesSearch;
    });
  }, [foods, restaurants, selectedRestaurant, category, search]);

  return (
    <main className="food-menus-page">
      <header className="menus-topbar">
        <Link href="/" className="menus-brand">
          <span className="menus-brand-icon">
            <Utensils size={20} />
          </span>
          <span>
            TasteAI <strong>Marketplace</strong>
          </span>
        </Link>

        <Link href="/marketplace" className="menus-back-link">
          <ArrowLeft size={16} />
          Discover restaurants
        </Link>
      </header>

      <section className="menus-hero">
        <div className="menus-hero-inner">
          <span className="menus-eyebrow">TASTEAI FOOD MARKETPLACE</span>
          <h1>Explore food menus</h1>
          <p>
            Discover available dishes, compare prices, and find something
            delicious from participating restaurants.
          </p>

          <div className="menus-search">
            <Search size={19} />
            <input
              aria-label="Search food menus"
              placeholder="Search dishes, categories, or restaurants..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="menus-content">
        <div className="menus-toolbar">
          <div>
            <h2>Browse available dishes</h2>
            <p>
              {loading
                ? "Loading menus..."
                : `${filteredFoods.length} ${
                    filteredFoods.length === 1 ? "dish" : "dishes"
                  } available`}
            </p>
          </div>

          <button
            type="button"
            className="menus-refresh"
            onClick={() => void loadMenus()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="menus-filters">
          <label>
            <span>Restaurant</span>
            <select
              value={selectedRestaurant}
              onChange={(event) => setSelectedRestaurant(event.target.value)}
            >
              <option value="all">All restaurants</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.public_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Food category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="menus-message menus-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadMenus()}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="menus-message">
            <div className="menus-loader" />
            <p>Loading restaurant menus...</p>
          </div>
        ) : !error && restaurants.length === 0 ? (
          <div className="menus-message">
            <Utensils size={34} />
            <h3>No published restaurants yet</h3>
            <p>
              Menus will appear here when restaurants are published in
              TasteAI Marketplace.
            </p>
            <Link href="/marketplace" className="menus-primary-link">
              Visit restaurant discovery
            </Link>
          </div>
        ) : !error && filteredFoods.length === 0 ? (
          <div className="menus-message">
            <Search size={32} />
            <h3>No matching dishes found</h3>
            <p>
              Try another search, restaurant, or category. Only available
              dishes from published restaurants are shown.
            </p>
            <button
              type="button"
              className="menus-reset"
              onClick={() => {
                setSearch("");
                setCategory("All categories");
                setSelectedRestaurant("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : !error ? (
          <div className="food-menu-grid">
            {filteredFoods.map((food) => {
              const restaurant = restaurants.find(
                (item) => item.id === food.restaurant_id
              );

              return (
                <article className="food-menu-card" key={food.id}>
                  <div className="food-menu-image">
                    {food.image_url ? (
                      <img
                        src={food.image_url}
                        alt={food.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="food-image-placeholder">
                        <ImageOff size={28} />
                        <span>Food image unavailable</span>
                      </div>
                    )}

                    {food.category && (
                      <span className="food-category">
                        {food.category}
                      </span>
                    )}
                  </div>

                  <div className="food-menu-details">
                    <div className="food-menu-heading">
                      <h3>{food.name}</h3>
                      <strong>{money(food.price)}</strong>
                    </div>

                    <p className="food-description">
                      {food.description || "Ask the restaurant for details."}
                    </p>

                    {restaurant && (
                      <div className="food-restaurant">
                        <Utensils size={15} />
                        <span>{restaurant.public_name}</span>
                      </div>
                    )}

                    {restaurant && (
                      <div className="food-location">
                        <MapPin size={14} />
                        <span>
                          {restaurant.city}
                          {restaurant.address
                            ? ` · ${restaurant.address}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        <div className="menus-bottom-link">
          <Link href="/marketplace">
            <ArrowLeft size={16} />
            Back to restaurant discovery
          </Link>
        </div>
      </section>
    </main>
  );
}
