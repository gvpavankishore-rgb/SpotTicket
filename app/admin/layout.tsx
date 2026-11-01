import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin | SpotTicket",
    template: "%s | SpotTicket Admin",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    redirect("/login");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      <AdminNav userEmail={user.email ?? null} />
      <div className="mt-5 min-w-0 flex-1 lg:mt-0">{children}</div>
    </div>
  );
}
