
"use client";

import "./login.css";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get("message") ?? ""
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (!user) {
        throw new Error(
          "Unable to retrieve your account after signing in."
        );
      }

      // Check the protected Supabase role table.
      const { data: roleRecord, error: roleError } =
        await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "super_admin")
          .maybeSingle();

      if (roleError) {
        throw new Error(
          `Your account was authenticated, but your permissions could not be verified: ${roleError.message}`
        );
      }

      // Platform administrators go to the platform admin area.
      // All other existing users retain the normal dashboard flow.
      if (roleRecord?.role === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-side">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <ChefHat size={20} />
          </span>

          <span>
            TasteAI
            <span className="brand-light"> Enterprise</span>
          </span>
        </Link>

        <div className="auth-side-content">
          <div className="eyebrow eyebrow-dark">
            YOUR BUSINESS, IN FOCUS
          </div>

          <h1>Welcome back to a clearer picture.</h1>

          <p>
            Sign in to continue to your food business
            intelligence workspace.
          </p>

          <div className="auth-side-points">
            <span>
              <ShieldCheck size={17} />
              Protected account access
            </span>

            <span>
              <ArrowRight size={17} />
              Your workspace in one place
            </span>
          </div>
        </div>

        <div className="auth-side-footer">
          TasteAI Enterprise · Business intelligence for food
          and hospitality
        </div>
      </div>

      <div className="auth-main">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="brand-mark">
              <ChefHat size={19} />
            </span>

            <strong>TasteAI Enterprise</strong>
          </div>

          <div className="auth-heading">
            <span className="auth-kicker">WELCOME BACK</span>

            <h2>Log in to your account</h2>

            <p>
              Enter your account details to continue.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@company.com"
              required
            />

            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Your password"
                required
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {error && (
              <div
                className="form-message error-message"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              className="button button-primary button-full"
              type="submit"
              disabled={loading}
            >
              {loading && (
                <LoaderCircle
                  className="spin"
                  size={17}
                />
              )}

              {loading ? "Signing in..." : "Log in"}

              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-switch">
            New to TasteAI?{" "}
            <Link href="/signup">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-loading">
          Loading sign in…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
