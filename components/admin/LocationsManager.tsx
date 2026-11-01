"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { Field, TextInput } from "@/components/admin/FormControls";
import type { LocationRecord } from "@/lib/admin";
import { getErrorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const emptyForm = {
  name: "",
  is_active: true,
};

type LocationForm = typeof emptyForm;

function formatCreatedAt(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function LocationsManager() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });

      if (loadError) {
        throw loadError;
      }

      setLocations((data ?? []) as LocationRecord[]);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "Could not load locations. Make sure the locations table exists.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  function updateField<K extends keyof LocationForm>(
    key: K,
    value: LocationForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(location: LocationRecord) {
    setEditingId(location.id);
    setForm({
      name: location.name,
      is_active: location.is_active,
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const payload = {
      name: form.name.trim(),
      is_active: form.is_active,
    };

    if (!payload.name) {
      setError("Please enter a location name.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const previousName = locations.find(
        (location) => location.id === editingId,
      )?.name;

      if (editingId) {
        const { error: updateError } = await supabase
          .from("locations")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        if (previousName && previousName !== payload.name) {
          const { error: syncError } = await supabase
            .from("theatres")
            .update({ location: payload.name })
            .eq("location_id", editingId);

          if (syncError) {
            throw syncError;
          }
        }

        setNotice("Location updated.");
      } else {
        const { error: insertError } = await supabase
          .from("locations")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setNotice("Location added.");
      }

      resetForm();
      await loadLocations();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save the location."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(location: LocationRecord) {
    const confirmed = window.confirm(
      `Delete "${location.name}"? Theatres linked to this location must be moved first.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(location.id);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("locations")
        .delete()
        .eq("id", location.id);

      if (deleteError) {
        throw deleteError;
      }

      if (editingId === location.id) {
        resetForm();
      }

      setNotice("Location deleted.");
      await loadLocations();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete the location."));
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
                {isEditing ? "Edit location" : "Add location"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isEditing
                  ? "Update the city and save."
                  : "Add a city where theatres operate."}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field
              label="Location name"
              htmlFor="location-name"
              hint="Example: Kavali, Nellore, Ongole"
            >
              <TextInput
                id="location-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Kavali"
                required
              />
            </Field>

            <label
              htmlFor="location-active"
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <Power className="h-3.5 w-3.5 text-accent" />
                Visible to customers
              </span>
              <input
                id="location-active"
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
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add location"}
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
              <MapPin className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-white">
                All locations
              </h2>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              {locations.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Loading locations...
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <MapPin className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">
                No locations yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Use the form to add your first city.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr
                      key={location.id}
                      className="border-b border-white/[0.04] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                            <MapPin className="h-4 w-4" />
                          </span>
                          <p className="truncate text-sm font-semibold text-white">
                            {location.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                            location.is_active
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-white/[0.08] bg-white/[0.03] text-zinc-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              location.is_active
                                ? "bg-emerald-400"
                                : "bg-zinc-500"
                            }`}
                          />
                          {location.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {formatCreatedAt(location.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(location)}
                            title={`Edit ${location.name}`}
                            aria-label={`Edit ${location.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-accent/40 hover:text-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(location)}
                            disabled={deletingId === location.id}
                            title={`Delete ${location.name}`}
                            aria-label={`Delete ${location.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === location.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
