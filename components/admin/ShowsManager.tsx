"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Film,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import {
  Field,
  SelectInput,
  TextInput,
} from "@/components/admin/FormControls";
import type {
  MovieOption,
  ShowWithRelations,
  TheatreOption,
} from "@/lib/admin";
import {
  formatPrice,
  formatShowDate,
  formatShowTime,
  getErrorMessage,
  toTimeInputValue,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const emptyForm = {
  movie_id: "",
  theatre_id: "",
  show_date: "",
  show_time: "",
  price: "",
};

type ShowForm = typeof emptyForm;

export default function ShowsManager() {
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [theatres, setTheatres] = useState<TheatreOption[]>([]);
  const [shows, setShows] = useState<ShowWithRelations[]>([]);
  const [form, setForm] = useState<ShowForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = editingId !== null;
  const canSchedule = movies.length > 0 && theatres.length > 0;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [moviesResult, theatresResult, showsResult] = await Promise.all([
        supabase.from("movies").select("id, title").order("title"),
        supabase
          .from("theatres")
          .select("id, name, location, location_id")
          .order("name"),
        supabase
          .from("shows")
          .select("*, movies(title), theatres(name, location)")
          .order("show_date", { ascending: true })
          .order("show_time", { ascending: true }),
      ]);

      if (moviesResult.error) {
        throw moviesResult.error;
      }

      if (theatresResult.error) {
        throw theatresResult.error;
      }

      if (showsResult.error) {
        throw showsResult.error;
      }

      setMovies((moviesResult.data ?? []) as MovieOption[]);
      setTheatres((theatresResult.data ?? []) as TheatreOption[]);
      setShows((showsResult.data ?? []) as ShowWithRelations[]);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "Could not load shows. Make sure all three tables exist.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateField<K extends keyof ShowForm>(key: K, value: ShowForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(show: ShowWithRelations) {
    setEditingId(show.id);
    setForm({
      movie_id: show.movie_id,
      theatre_id: show.theatre_id,
      show_date: show.show_date,
      show_time: toTimeInputValue(show.show_time),
      price: String(show.price),
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const price = Number(form.price);
    const payload = {
      movie_id: form.movie_id,
      theatre_id: form.theatre_id,
      show_date: form.show_date,
      show_time: form.show_time,
      price,
    };

    if (
      !payload.movie_id ||
      !payload.theatre_id ||
      !payload.show_date ||
      !payload.show_time ||
      !form.price.trim()
    ) {
      setError("Please fill in all show details.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be zero or greater.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      if (editingId) {
        const { error: updateError } = await supabase
          .from("shows")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setNotice("Show updated.");
      } else {
        const { error: insertError } = await supabase
          .from("shows")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setNotice("Show added.");
      }

      resetForm();
      await loadData();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save the show."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(show: ShowWithRelations) {
    const confirmed = window.confirm(
      `Delete the show "${show.movies?.title ?? "Movie"}" on ${formatShowDate(
        show.show_date,
      )} at ${formatShowTime(show.show_time)}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(show.id);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("shows")
        .delete()
        .eq("id", show.id);

      if (deleteError) {
        throw deleteError;
      }

      if (editingId === show.id) {
        resetForm();
      }

      setNotice("Show deleted.");
      await loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete the show."));
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
                {isEditing ? "Edit show" : "Add show"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isEditing
                  ? "Update the screening and save."
                  : "Schedule a movie at a theatre."}
              </p>
            </div>
          </div>

          {!canSchedule && !loading && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
              Add at least one{" "}
              <Link
                href="/admin/movies"
                className="font-semibold text-accent underline-offset-2 hover:underline"
              >
                movie
              </Link>{" "}
              and one{" "}
              <Link
                href="/admin/theatres"
                className="font-semibold text-accent underline-offset-2 hover:underline"
              >
                theatre
              </Link>{" "}
              before scheduling a show.
            </div>
          )}

          <div className="mt-5 space-y-4">
            <Field label="Movie" htmlFor="show-movie">
              <SelectInput
                id="show-movie"
                value={form.movie_id}
                onChange={(event) =>
                  updateField("movie_id", event.target.value)
                }
                disabled={movies.length === 0}
                required
              >
                <option value="">Select a movie</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Theatre" htmlFor="show-theatre">
              <SelectInput
                id="show-theatre"
                value={form.theatre_id}
                onChange={(event) =>
                  updateField("theatre_id", event.target.value)
                }
                disabled={theatres.length === 0}
                required
              >
                <option value="">Select a theatre</option>
                {theatres.map((theatre) => (
                  <option key={theatre.id} value={theatre.id}>
                    {theatre.name} — {theatre.location}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" htmlFor="show-date">
                <TextInput
                  id="show-date"
                  type="date"
                  value={form.show_date}
                  onChange={(event) =>
                    updateField("show_date", event.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Time" htmlFor="show-time">
                <TextInput
                  id="show-time"
                  type="time"
                  value={form.show_time}
                  onChange={(event) =>
                    updateField("show_time", event.target.value)
                  }
                  required
                />
              </Field>
            </div>

            <Field label="Ticket price (₹)" htmlFor="show-price">
              <TextInput
                id="show-price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="250"
                required
              />
            </Field>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving || (!canSchedule && !isEditing)}
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
                  : "Add show"}
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
              <CalendarClock className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-white">All shows</h2>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              {shows.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Loading shows...
            </div>
          ) : shows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <Ticket className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">
                No shows scheduled
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Use the form to schedule the first screening.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <th className="px-4 py-3">Movie</th>
                    <th className="px-4 py-3">Theatre</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.map((show) => (
                    <tr
                      key={show.id}
                      className="border-b border-white/[0.04] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                            <Film className="h-3.5 w-3.5" />
                          </span>
                          <p className="truncate text-sm font-semibold text-white">
                            {show.movies?.title ?? "Unknown movie"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {show.theatres?.name ?? "Unknown theatre"}
                            </p>
                            {show.theatres?.location && (
                              <p className="flex items-center gap-1 truncate text-[11px] text-zinc-500">
                                <MapPin className="h-2.5 w-2.5" />
                                {show.theatres.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {formatShowDate(show.show_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-zinc-300">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {formatShowTime(show.show_time)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-accent">
                        {formatPrice(show.price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(show)}
                            title="Edit show"
                            aria-label="Edit show"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-accent/40 hover:text-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(show)}
                            disabled={deletingId === show.id}
                            title="Delete show"
                            aria-label="Delete show"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === show.id ? (
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
