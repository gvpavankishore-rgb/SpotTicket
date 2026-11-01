"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.push("/");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Could not sign out. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {loading ? "Signing out..." : "Log out"}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
