"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  Film,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/FormControls";
import type { CastRecord, MovieRecord } from "@/lib/admin";
import { CAST_ROLES, type CastRole } from "@/lib/cast";
import { getErrorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const emptyForm = {
  title: "",
  language: "",
  genre: "",
  duration: "",
  poster_url: "",
  trailer_url: "",
  description: "",
  is_3d: false,
  glass_charge: "30",
};

type MovieForm = typeof emptyForm;

interface CastFormItem {
  key: string;
  id: string | null;
  name: string;
  role: CastRole;
  photo_url: string;
}

type CastPayload = Omit<CastFormItem, "key">;

let castKeyCounter = 0;

function newCastItem(): CastFormItem {
  castKeyCounter += 1;
  return {
    key: `cast-${castKeyCounter}`,
    id: null,
    name: "",
    role: "Actor",
    photo_url: "",
  };
}

function toCastFormItem(record: CastRecord): CastFormItem {
  return {
    key: `cast-${record.id}`,
    id: record.id,
    name: record.name,
    role: record.role,
    photo_url: record.photo_url,
  };
}

async function saveCastForMovie(
  supabase: ReturnType<typeof createClient>,
  movieId: string,
  items: CastPayload[],
) {
  const { data: existing, error: fetchError } = await supabase
    .from("movie_cast")
    .select("id")
    .eq("movie_id", movieId);

  if (fetchError) {
    throw fetchError;
  }

  const keptIds = new Set(
    items.map((item) => item.id).filter((id): id is string => Boolean(id)),
  );
  const staleIds = ((existing ?? []) as { id: string }[])
    .map((row) => row.id)
    .filter((id) => !keptIds.has(id));

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("movie_cast")
      .delete()
      .in("id", staleIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const payload = {
      movie_id: movieId,
      name: item.name,
      role: item.role,
      photo_url: item.photo_url,
      sort_order: index,
    };

    if (item.id) {
      const { error: updateError } = await supabase
        .from("movie_cast")
        .update(payload)
        .eq("id", item.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("movie_cast")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }
    }
  }
}

export default function MoviesManager() {
  const [movies, setMovies] = useState<MovieRecord[]>([]);
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [castItems, setCastItems] = useState<CastFormItem[]>([]);
  const [castCounts, setCastCounts] = useState<Record<string, number>>({});
  const [castLoading, setCastLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const [moviesResult, castResult] = await Promise.all([
        supabase
          .from("movies")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("movie_cast").select("movie_id"),
      ]);

      if (moviesResult.error) {
        throw moviesResult.error;
      }

      setMovies((moviesResult.data ?? []) as MovieRecord[]);

      const counts: Record<string, number> = {};
      for (const row of (castResult.data ?? []) as { movie_id: string }[]) {
        counts[row.movie_id] = (counts[row.movie_id] ?? 0) + 1;
      }
      setCastCounts(counts);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "Could not load movies. Make sure the movies table exists.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  function updateField<K extends keyof MovieForm>(key: K, value: MovieForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setCastItems([]);
    setEditingId(null);
  }

  function updateCastItem(key: string, patch: Partial<CastFormItem>) {
    setCastItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removeCastItem(key: string) {
    setCastItems((current) => current.filter((item) => item.key !== key));
  }

  async function handleEdit(movie: MovieRecord) {
    setEditingId(movie.id);
    setForm({
      title: movie.title,
      language: movie.language,
      genre: movie.genre,
      duration: movie.duration,
      poster_url: movie.poster_url,
      trailer_url: movie.trailer_url ?? "",
      description: movie.description ?? "",
      is_3d: movie.is_3d === true,
      glass_charge: String(movie.glass_charge ?? 30),
    });
    setCastItems([]);
    setError(null);
    setNotice(null);
    setCastLoading(true);

    try {
      const supabase = createClient();
      const { data, error: castError } = await supabase
        .from("movie_cast")
        .select("*")
        .eq("movie_id", movie.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (castError) {
        throw castError;
      }

      setCastItems(((data ?? []) as CastRecord[]).map(toCastFormItem));
    } catch (castLoadError) {
      setError(
        getErrorMessage(castLoadError, "Could not load the cast for this movie."),
      );
    } finally {
      setCastLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (castLoading) {
      return;
    }

    setError(null);
    setNotice(null);

    const glassCharge = Number(form.glass_charge);
    const payload = {
      title: form.title.trim(),
      language: form.language.trim(),
      genre: form.genre.trim(),
      duration: form.duration.trim(),
      poster_url: form.poster_url.trim(),
      trailer_url: form.trailer_url.trim() || null,
      description: form.description.trim() || null,
      is_3d: form.is_3d,
      glass_charge: form.is_3d
        ? Number.isFinite(glassCharge) && glassCharge >= 0
          ? glassCharge
          : NaN
        : 0,
    };

    if (
      !payload.title ||
      !payload.language ||
      !payload.genre ||
      !payload.duration ||
      !payload.poster_url
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!Number.isFinite(payload.glass_charge) || payload.glass_charge < 0) {
      setError("3D glass charge must be zero or greater.");
      return;
    }

    const castPayload: CastPayload[] = castItems
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        role: item.role,
        photo_url: item.photo_url.trim(),
      }))
      .filter((item) => item.name || item.photo_url);

    if (castPayload.some((item) => !item.name)) {
      setError("Every cast member needs a name.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      let movieId = editingId;

      if (editingId) {
        const { error: updateError } = await supabase
          .from("movies")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("movies")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        movieId = inserted.id as string;
      }

      if (!movieId) {
        throw new Error("Could not determine the movie to save.");
      }

      await saveCastForMovie(supabase, movieId, castPayload);

      setNotice(isEditing ? "Movie and cast updated." : "Movie added.");
      resetForm();
      await loadMovies();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save the movie."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(movie: MovieRecord) {
    const confirmed = window.confirm(
      `Delete "${movie.title}"? Any shows and cast details linked to this movie will also be removed.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(movie.id);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("movies")
        .delete()
        .eq("id", movie.id);

      if (deleteError) {
        throw deleteError;
      }

      if (editingId === movie.id) {
        resetForm();
      }

      setNotice("Movie deleted.");
      await loadMovies();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete the movie."));
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
                {isEditing ? "Edit movie" : "Add movie"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isEditing
                  ? "Update the details and save."
                  : "Add a new title to the catalog."}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Title" htmlFor="movie-title">
              <TextInput
                id="movie-title"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Neon Horizon"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Language" htmlFor="movie-language">
                <TextInput
                  id="movie-language"
                  value={form.language}
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
                  placeholder="English"
                  required
                />
              </Field>

              <Field label="Genre" htmlFor="movie-genre">
                <TextInput
                  id="movie-genre"
                  value={form.genre}
                  onChange={(event) => updateField("genre", event.target.value)}
                  placeholder="Sci-Fi"
                  required
                />
              </Field>
            </div>

            <Field label="Duration" htmlFor="movie-duration" hint="Example: 2h 18m">
              <TextInput
                id="movie-duration"
                value={form.duration}
                onChange={(event) =>
                  updateField("duration", event.target.value)
                }
                placeholder="2h 18m"
                required
              />
            </Field>

            <Field label="Poster URL" htmlFor="movie-poster">
              <TextInput
                id="movie-poster"
                type="url"
                value={form.poster_url}
                onChange={(event) =>
                  updateField("poster_url", event.target.value)
                }
                placeholder="https://example.com/poster.jpg"
                required
              />
            </Field>

            <Field
              label="Trailer URL"
              htmlFor="movie-trailer"
              hint="YouTube or direct video URL. Powers View from Seat."
            >
              <TextInput
                id="movie-trailer"
                type="url"
                value={form.trailer_url}
                onChange={(event) =>
                  updateField("trailer_url", event.target.value)
                }
                placeholder="https://youtube.com/watch?v=..."
              />
            </Field>

            <Field label="Description" htmlFor="movie-description">
              <TextArea
                id="movie-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="A short synopsis for the movie..."
              />
            </Field>

            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  type="checkbox"
                  checked={form.is_3d}
                  onChange={(event) => updateField("is_3d", event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/40 text-accent accent-[#f59e0b]"
                />
                This is a 3D Movie
              </label>
              <div className="mt-3">
                <Field label="3D Glass Charge (₹)" htmlFor="movie-glass-charge">
                  <TextInput
                    id="movie-glass-charge"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={form.glass_charge}
                    onChange={(event) =>
                      updateField("glass_charge", event.target.value)
                    }
                    disabled={!form.is_3d}
                    placeholder="30"
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Cast &amp; Crew
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Director, actors and producers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCastItems((current) => [...current, newCastItem()])
                  }
                  disabled={saving || castLoading}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {castLoading ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  Loading cast...
                </div>
              ) : castItems.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-3 py-4 text-center text-[11px] leading-relaxed text-zinc-500">
                  No cast added yet. Use Add to include the director, actors
                  and producers.
                </p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {castItems.map((item, index) => (
                    <div
                      key={item.key}
                      className="rounded-xl border border-white/[0.06] bg-black/20 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Person {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCastItem(item.key)}
                          disabled={saving}
                          aria-label={`Remove cast member ${index + 1}`}
                          title={`Remove cast member ${index + 1}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_112px]">
                        <TextInput
                          aria-label={`Name of cast member ${index + 1}`}
                          value={item.name}
                          onChange={(event) =>
                            updateCastItem(item.key, {
                              name: event.target.value,
                            })
                          }
                          placeholder="Full name"
                          disabled={saving}
                        />
                        <SelectInput
                          aria-label={`Role of cast member ${index + 1}`}
                          value={item.role}
                          onChange={(event) =>
                            updateCastItem(item.key, {
                              role: event.target.value as CastRole,
                            })
                          }
                          disabled={saving}
                        >
                          {CAST_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                      <TextInput
                        aria-label={`Photo URL of cast member ${index + 1}`}
                        type="url"
                        className="mt-2"
                        value={item.photo_url}
                        onChange={(event) =>
                          updateCastItem(item.key, {
                            photo_url: event.target.value,
                          })
                        }
                        placeholder="https://example.com/photo.jpg"
                        disabled={saving}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving || castLoading}
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
                  : "Add movie"}
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
              <Clapperboard className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-white">All movies</h2>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              {movies.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Loading movies...
            </div>
          ) : movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <Film className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">
                No movies yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Use the form to add your first movie to the catalog.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <th className="px-4 py-3">Movie</th>
                    <th className="px-4 py-3">Genre</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Cast</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((movie) => (
                    <tr
                      key={movie.id}
                      className="border-b border-white/[0.04] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-black/40 text-zinc-600">
                            {movie.poster_url ? (
                              <Image
                                src={movie.poster_url}
                                alt=""
                                width={40}
                                height={56}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Film className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {movie.title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 max-w-[280px] text-xs text-zinc-500">
                              {movie.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {movie.genre}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {movie.language}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {movie.duration}
                      </td>
                      <td className="px-4 py-3">
                        {movie.is_3d ? (
                          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent">
                            3D · {Number(movie.glass_charge ?? 0) > 0 ? `₹${movie.glass_charge}` : "No glass charge"}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">2D</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-zinc-300">
                          {castCounts[movie.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleEdit(movie)}
                            title={`Edit ${movie.title}`}
                            aria-label={`Edit ${movie.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-accent/40 hover:text-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(movie)}
                            disabled={deletingId === movie.id}
                            title={`Delete ${movie.title}`}
                            aria-label={`Delete ${movie.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === movie.id ? (
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
