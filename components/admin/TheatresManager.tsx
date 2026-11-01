"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Armchair,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Field,
  SelectInput,
  TextInput,
} from "@/components/admin/FormControls";
import type { LocationRecord, TheatreRecord } from "@/lib/admin";
import { getErrorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const emptyForm = {
  name: "",
  location_id: "",
  total_seats: "",
};

type TheatreForm = typeof emptyForm;

export default function TheatresManager() {
  const [theatres, setTheatres] = useState<TheatreRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [form, setForm] = useState<TheatreForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const loadTheatres = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const [theatresResult, locationsResult] = await Promise.all([
        supabase
          .from("theatres")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("locations")
          .select("id, name, is_active, created_at")
          .order("name", { ascending: true }),
      ]);

      if (theatresResult.error) {
        throw theatresResult.error;
      }

      if (locationsResult.error) {
        throw locationsResult.error;
      }

      setTheatres((theatresResult.data ?? []) as TheatreRecord[]);
      setLocations((locationsResult.data ?? []) as LocationRecord[]);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "Could not load theatres. Make sure the theatres and locations tables exist.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTheatres();
  }, [loadTheatres]);

  function updateField<K extends keyof TheatreForm>(
    key: K,
    value: TheatreForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(theatre: TheatreRecord) {
    setEditingId(theatre.id);
    setForm({
      name: theatre.name,
      location_id: theatre.location_id ?? "",
      total_seats: String(theatre.total_seats),
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const seats = Number(form.total_seats);
    const selectedLocation = locations.find(
      (location) => location.id === form.location_id,
    );

    if (!form.name.trim() || !form.location_id) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!selectedLocation) {
      setError("Select a valid location for this theatre.");
      return;
    }

    if (!Number.isInteger(seats) || seats < 1) {
      setError("Total seats must be a whole number greater than zero.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      location_id: selectedLocation.id,
      location: selectedLocation.name,
      total_seats: seats,
    };

    setSaving(true);

    try {
      const supabase = createClient();

      if (editingId) {
        const { error: updateError } = await supabase
          .from("theatres")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setNotice("Theatre updated.");
      } else {
        const { error: insertError } = await supabase
          .from("theatres")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setNotice("Theatre added.");
      }

      resetForm();
      await loadTheatres();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save the theatre."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(theatre: TheatreRecord) {
    const confirmed = window.confirm(
      `Delete "${theatre.name}"? Any shows linked to this theatre will also be removed.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(theatre.id);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("theatres")
        .delete()
        .eq("id", theatre.id);

      if (deleteError) {
        throw deleteError;
      }

      if (editingId === theatre.id) {
        resetForm();
      }

      setNotice("Theatre deleted.");
      await loadTheatres();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete the theatre."));
    } finally {
      setDeletingId(null);
    }
  }

  function getLocationName(theatre: TheatreRecord) {
    const location = locations.find(
      (item) => item.id === theatre.location_id,
    );

    return location?.name || theatre.location || "Unassigned";
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
                {isEditing ? "Edit theatre" : "Add theatre"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isEditing
                  ? "Update the venue details and save."
                  : "Register a new venue for shows."}
              </p>
            </div>
          </div>

          {locations.length === 0 && !loading && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
              Add a{" "}
              <Link
                href="/admin/locations"
                className="font-semibold text-accent underline-offset-2 hover:underline"
              >
                location
              </Link>{" "}
              before registering a theatre.
            </div>
          )}

          <div className="mt-5 space-y-4">
            <Field label="Theatre name" htmlFor="theatre-name">
              <TextInput
                id="theatre-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="PVR Central"
                required
              />
            </Field>

            <Field
              label="Location"
              htmlFor="theatre-location"
              hint="Customers see this theatre only in the selected city."
            >
              <SelectInput
                id="theatre-location"
                value={form.location_id}
                onChange={(event) =>
                  updateField("location_id", event.target.value)
                }
                disabled={locations.length === 0}
                required
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.is_active ? "" : " (inactive)"}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field
              label="Total seats"
              htmlFor="theatre-seats"
              hint="Total seats available for each show."
            >
              <TextInput
                id="theatre-seats"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={form.total_seats}
                onChange={(event) =>
                  updateField("total_seats", event.target.value)
                }
                placeholder="180"
                required
              />
            </Field>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving || locations.length === 0}
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
                  : "Add theatre"}
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
              <Building2 className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-white">
                All theatres
              </h2>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              {theatres.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Loading theatres...
            </div>
          ) : theatres.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <Building2 className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">
                No theatres yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Use the form to add your first venue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <th className="px-4 py-3">Theatre</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Total seats</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {theatres.map((theatre) => (
                    <tr
                      key={theatre.id}
                      className="border-b border-white/[0.04] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <p className="truncate text-sm font-semibold text-white">
                            {theatre.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                          <span className="truncate">
                            {getLocationName(theatre)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-zinc-300">
                          <Armchair className="h-3.5 w-3.5 text-accent" />
                          {Number(theatre.total_seats).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(theatre)}
                            title={`Edit ${theatre.name}`}
                            aria-label={`Edit ${theatre.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-accent/40 hover:text-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(theatre)}
                            disabled={deletingId === theatre.id}
                            title={`Delete ${theatre.name}`}
                            aria-label={`Delete ${theatre.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === theatre.id ? (
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
