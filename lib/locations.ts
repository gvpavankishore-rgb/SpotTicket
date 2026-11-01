import { cache } from "react";
import { cookies } from "next/headers";
import { getErrorMessage } from "@/lib/format";
import { LOCATION_COOKIE } from "@/lib/location-cookie";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface LocationOption {
  id: string;
  name: string;
}

export interface LocationContext {
  locations: LocationOption[];
  selected: LocationOption | null;
  error: string | null;
}

export const getLocationContext = cache(
  async (): Promise<LocationContext> => {
    if (!isSupabaseConfigured) {
      return { locations: [], selected: null, error: null };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        return { locations: [], selected: null, error: error.message };
      }

      const locations = (data ?? []) as LocationOption[];
      const cookieStore = cookies();
      const selectedId = cookieStore.get(LOCATION_COOKIE)?.value;
      const selected =
        locations.find((location) => location.id === selectedId) ??
        locations[0] ??
        null;

      return { locations, selected, error: null };
    } catch (error) {
      return {
        locations: [],
        selected: null,
        error: getErrorMessage(error, "Could not load locations."),
      };
    }
  },
);
