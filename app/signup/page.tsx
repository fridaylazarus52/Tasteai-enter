"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChefHat, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(""); setError(""); setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: name }
        }
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: name });
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        setMessage("Account created. Check your email to confirm your address, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><div className="auth-side"><Link className="brand" href="/"><span className="brand-mark"><ChefHat size={20} /></span><span>TasteAI<span className="brand-light"> Enterprise</span></span></Link><div className="auth-side-content"><div className="eyebrow eyebrow-dark">A CLEARER VIEW OF YOUR BUSINESS</div><h1>Build a smarter way to run your food business.</h1><p>Bring your operations together and make your next decision with more clarity.</p><div className="auth-side-points"><span><ShieldCheck size={17} /> Secure sign-in with Supabase</span><span><ArrowRight size={17} /> A workspace designed to grow with you</span></div></div><div className="auth-side-footer">TasteAI Enterprise · Business intelligence for food and hospitality</div></div><div className="auth-main"><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to home</Link><div className="auth-card"><div className="auth-mobile-brand"><span className="brand-mark"><ChefHat size={19} /></span><strong>TasteAI Enterprise</strong></div><div className="auth-heading"><span className="auth-kicker">GET STARTED</span><h2>Create your account</h2><p>Set up your TasteAI workspace in a few steps.</p></div><form className="auth-form" onSubmit={handleSubmit}><label htmlFor="name">Full name</label><input id="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required maxLength={100} /><label htmlFor="email">Work email</label><input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required /><label htmlFor="password">Password</label><div className="password-wrap"><input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required /><button className="password-toggle" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{error && <div className="form-message error-message" role="alert">{error}</div>}{message && <div className="form-message success-message" role="status">{message}</div>}<button className="button button-primary button-full" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : null}{loading ? "Creating account..." : "Create account"} {!loading && <ArrowRight size={17} />}</button><p className="terms-note">By creating an account, you agree to use TasteAI responsibly and protect your account credentials.</p></form><div className="auth-switch">Already have an account? <Link href="/login">Log in</Link></div></div></div></main>;
}
