import { createHash } from "crypto";
import { getErrorMessage } from "@/lib/format";
import {
  getSnackSignatureInput,
  type Snack,
  type SnackSelection,
} from "@/lib/snacks";
import { createClient } from "@/lib/supabase/server";

export async function getActiveSnacks(): Promise<{
  data: Snack[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("snacks")
      .select("id, name, price, image_url, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    const snacks = (data ?? [])
      .map((row) => ({
        id: String(row.id),
        name: String(row.name ?? "").trim(),
        price: Number(row.price),
        image_url: typeof row.image_url === "string" ? row.image_url : null,
        is_active: row.is_active !== false,
      }))
      .filter((snack) => snack.name && Number.isFinite(snack.price) && snack.price >= 0);

    return { data: snacks, error: null };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error, "Could not load snacks."),
    };
  }
}

export function getSnackSignature(selections: SnackSelection[]) {
  return createHash("sha256")
    .update(getSnackSignatureInput(selections))
    .digest("hex")
    .slice(0, 32);
}
