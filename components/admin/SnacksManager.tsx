"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Popcorn,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { Field, TextInput } from "@/components/admin/FormControls";
import type { SnackRecord } from "@/lib/admin";
import { formatPrice, getErrorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const emptyForm = {
  name: "",
  price: "",
  image_url: "",
  is_active: true,
};

type SnackForm = typeof emptyForm;

function imageStyle(imageUrl: string) {
  if (!imageUrl.trim()) {
    return undefined;
  }

  try {
    const parsed = new URL(imageUrl.trim());

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    const escaped = parsed.href.replace(/["'()\\]/g, "\\$&");
    return { backgroundImage: `url("${escaped}")` };
  } catch {
    return undefined;
  }
}

export default function SnacksManager() {
  const [snacks, setSnacks] = useState<SnackRecord[]>([]);
  const [form, setForm] = useState<SnackForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const loadSnacks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("snacks")
        .select("*")
        .order("name", { ascending: true });

      if (loadError) {
        throw loadError;
      }

      setSnacks((data ?? []) as SnackRecord[]);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "Could not load snacks. Make sure the snacks table exists.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnacks();
  }, [loadSnacks]);

  function updateField<K extends keyof SnackForm>(
    key: K,
    value: SnackForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(snack: SnackRecord) {
    setEditingId(snack.id);
    setForm({
      name: snack.name,
      price: String(snack.price),
      image_url: snack.image_url ?? "",
      is_active: snack.is_active,
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const price = Number(form.price.trim());

    if (!form.name.trim()) {
      setError("Please enter a snack name.");
      return;
    }

    if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Math.round(price * 100) / 100,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };

    setSaving(true);

    try {
      const supabase = createClient();

      if (editingId) {
        const { error: updateError } = await supabase
          .from("snacks")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setNotice("Snack updated.");
      } else {
        const { error: insertError } = await supabase
          .from("snacks")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setNotice("Snack added.");
      }

      resetForm();
      await loadSnacks();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save the snack."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(snack: SnackRecord) {
    const confirmed = window.confirm(`Delete "${snack.name}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(snack.id);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("snacks")
        .delete()
        .eq("id", snack.id);

      if (deleteError) {
        throw deleteError;
      }

      if (editingId === snack.id) {
        resetForm();
      }

      setNotice("Snack deleted.");
      await loadSnacks();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete the snack."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${
            error
              ? "border-red-500/20 bg-red-500/10 text-red-300"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{error ?? notice}</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-2xl border border-white/[0.06] bg-surface p-5"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {isEditing ? (
                <Pencil className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              )}
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {isEditing ? "Edit snack" : "Add snack"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isEditing
                  ? "Update the item and save."
                  : "Add a concession to the booking flow."}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field
              label="Snack name"
              htmlFor="snack-name"
              hint="Example: Popcorn (Large)"
            >
              <TextInput
                id="snack-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Popcorn (Large)"
                required
              />
            </Field>

            <Field label="Price (INR)" htmlFor="snack-price">
              <TextInput
                id="snack-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="180"
                required
              />
            </Field>

            <Field
              label="Image URL"
              htmlFor="snack-image"
              hint="Optional. Leave blank to show the default snack card."
            >
              <TextInput
                id="snack-image"
                type="url"
                value={form.image_url}
                onChange={(event) =>
                  updateField("image_url", event.target.value)
                }
                placeholder="https://example.com/popcorn.jpg"
              />
            </Field>

            <label
              htmlFor="snack-active"
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <Power className="h-3.5 w-3.5 text-accent" />
                Available to customers
              </span>
              <input
                id="snack-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  updateField("is_active", event.target.checked)
                }
                className="h-4 w-4 cursor-pointer accent-[#f59e0b]"
              />
            </label>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? "Saving..." : isEditing ? "Save changes" : "Add snack"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Popcorn className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-white">All snacks</h2>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              {snacks.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Loading snacks...
            </div>
          ) : snacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <Popcorn className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">
                No snacks yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Use the form to add your first concession.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <th className="px-4 py-3">Snack</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {snacks.map((snack) => {
                    const thumbnailStyle = imageStyle(snack.image_url ?? "");

                    return (
                      <tr
                        key={snack.id}
                        className="border-b border-white/[0.04] last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 bg-cover bg-center text-accent"
                              style={{
                                ...(thumbnailStyle ?? {}),
                                ...(thumbnailStyle
                                  ? {}
                                  : {
                                      backgroundImage:
                                        "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(0,0,0,0.4))",
                                    }),
                              }}
                              aria-hidden="true"
                            >
                              {!thumbnailStyle && (
                                <Popcorn className="h-4 w-4" />
                              )}
                            </div>
                            <p className="truncate text-sm font-semibold text-white">
                              {snack.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-200">
                          {formatPrice(snack.price)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                              snack.is_active
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-white/[0.08] bg-white/[0.03] text-zinc-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                snack.is_active
                                  ? "bg-emerald-400"
                                  : "bg-zinc-500"
                              }`}
                            />
                            {snack.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(snack)}
                              title={`Edit ${snack.name}`}
                              aria-label={`Edit ${snack.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-accent/40 hover:text-accent"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(snack)}
                              disabled={deletingId === snack.id}
                              title={`Delete ${snack.name}`}
                              aria-label={`Delete ${snack.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === snack.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
