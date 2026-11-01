import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { getLocationContext } from "@/lib/locations";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpotTicket | Book Movie Tickets Near You",
  description:
    "Discover now showing movies, pick your seats, and book tickets near you with SpotTicket.",
  applicationName: "SpotTicket",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;

  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
    } catch {
      userEmail = null;
    }
  }

  const locationContext = await getLocationContext();

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <Header
          userEmail={userEmail}
          locations={locationContext.locations}
          selectedLocationId={locationContext.selected?.id ?? null}
        />
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          {children}
        </main>
        <BottomNav userEmail={userEmail} />
      </body>
    </html>
  );
}
