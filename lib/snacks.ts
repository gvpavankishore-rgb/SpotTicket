export const MAX_SNACK_QUANTITY = 20;
export const MAX_SNACKS_PER_BOOKING = 20;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Snack {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_active?: boolean;
}

export interface SnackSelection {
  id: string;
  quantity: number;
}

export interface PricedSnack extends SnackSelection {
  name: string;
  price: number;
  image_url: string | null;
}

export interface SnackPricing {
  items: PricedSnack[];
  total: number;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeSnackSelections(
  value: unknown,
): SnackSelection[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const selections: SnackSelection[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const { id, quantity } = entry as { id?: unknown; quantity?: unknown };

    if (
      typeof id !== "string" ||
      !uuidPattern.test(id) ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_SNACK_QUANTITY ||
      seen.has(id)
    ) {
      return null;
    }

    seen.add(id);
    selections.push({ id, quantity });
  }

  if (selections.length > MAX_SNACKS_PER_BOOKING) {
    return null;
  }

  return selections.sort((a, b) => a.id.localeCompare(b.id));
}

export function priceSnackSelections(
  selections: SnackSelection[],
  snacks: Snack[],
): SnackPricing | null {
  const snacksById = new Map(
    snacks
      .filter((snack) => snack.is_active !== false)
      .map((snack) => [snack.id, snack] as const),
  );
  const items: PricedSnack[] = [];

  for (const selection of selections) {
    const snack = snacksById.get(selection.id);

    if (
      !snack ||
      !Number.isFinite(snack.price) ||
      snack.price < 0 ||
      !snack.name?.trim()
    ) {
      return null;
    }

    items.push({
      id: selection.id,
      quantity: selection.quantity,
      name: snack.name.trim(),
      price: snack.price,
      image_url: snack.image_url,
    });
  }

  return {
    items,
    total: roundMoney(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    ),
  };
}

export function getSnackSignatureInput(selections: SnackSelection[]) {
  const canonical = selections
    .map((selection) => `${selection.id}:${selection.quantity}`)
    .join("|");

  return `snacks:v1:${canonical}`;
}

export function calculateSnackTotal(items: PricedSnack[]) {
  return roundMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
}
