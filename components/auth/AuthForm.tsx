"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

function getPostAuthPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  const next = new URLSearchParams(window.location.search).get("next");

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured. Add your credentials to .env.local and restart the dev server.",
      );
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isLogin && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.push(getPostAuthPath());
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.push(getPostAuthPath());
        router.refresh();
        return;
      }

      setMessage(
        "Account created. Check your email to confirm your account, then sign in.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-white/[0.06] bg-surface/80 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-7">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-black shadow-glow">
          <Ticket className="h-6 w-6" strokeWidth={2.5} />
        </span>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {isLogin
            ? "Sign in to book tickets and keep track of your shows."
            : "Join SpotTicket to book tickets near you in a few taps."}
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
            Supabase is not configured. Copy{" "}
            <code className="rounded bg-black/30 px-1 py-0.5">
              .env.local.example
            </code>{" "}
            to <code className="rounded bg-black/30 px-1 py-0.5">.env.local</code>{" "}
            and add your project credentials.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-xs font-medium text-zinc-300"
            >
              Email address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/30 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-xs font-medium text-zinc-300"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={isLogin ? undefined : 6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isLogin ? "Your password" : "At least 6 characters"}
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/30 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="confirm-password"
                className="text-xs font-medium text-zinc-300"
              >
                Confirm password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/30 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-relaxed text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLogin ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {isLogin ? "New to SpotTicket?" : "Already have an account?"}{" "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="font-semibold text-accent transition-colors hover:text-amber-300"
          >
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
