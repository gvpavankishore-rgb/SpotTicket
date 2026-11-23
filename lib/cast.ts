export const CAST_ROLES = ["Director", "Actor", "Producer"] as const;

export type CastRole = (typeof CAST_ROLES)[number];

export interface CastMember {
  id: string;
  movie_id: string;
  name: string;
  role: CastRole;
  photo_url: string;
  sort_order: number;
  created_at: string;
}
