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
  X,
} from "lucide-react";
import {
  Field,
  TextArea,
  TextInput,
} from "@/components/admin/FormControls";
import type { MovieRecord } from "@/lib/admin";
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
};

type MovieForm = typeof emptyForm;

export default function MoviesManager() {
  const [movies, setMovies] = useState<MovieRecord[]>([]);
  const [form, setForm] = useState<MovieForm>(emptyForm);
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
      const { data, error: loadError } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (loadError) {
        throw loadError;
      }

      setMovies((data ?? []) as MovieRecord[]);
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
    setEditingId(null);
  }

  function handleEdit(movie: MovieRecord) {
    setEditingId(movie.id);
    setForm({
      title: movie.title,
      language: movie.language,
      genre: movie.genre,
      duration: movie.duration,
      poster_url: movie.poster_url,
      trailer_url: movie.trailer_url ?? "",
      description: movie.description ?? "",
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const payload = {
      title: form.title.trim(),
      language: form.language.trim(),
      genre: form.genre.trim(),
      duration: form.duration.trim(),
      poster_url: form.poster_url.trim(),
      trailer_url: form.trailer_url.trim() || null,
      description: form.description.trim() || null,
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

    setSaving(true);

    try {
      const supabase = createClient();

      if (editingId) {
        const { error: updateError } = await supabase
          .from("movies")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setNotice("Movie updated.");
      } else {
        const { error: insertError } = await supabase
          .from("movies")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setNotice("Movie added.");
      }

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
      `Delete "${movie.title}"? Any shows linked to this movie will also be removed.`,
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
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <th className="px-4 py-3">Movie</th>
                    <th className="px-4 py-3">Genre</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Duration</th>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(movie)}
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
