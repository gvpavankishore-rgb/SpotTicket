export interface MovieRecord {
  id: string;
  title: string;
  language: string;
  genre: string;
  duration: string;
  poster_url: string;
  trailer_url: string | null;
  description: string | null;
  created_at: string;
}

export interface LocationRecord {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface TheatreRecord {
  id: string;
  name: string;
  location: string;
  location_id: string;
  total_seats: number;
  created_at: string;
}

export interface ShowRecord {
  id: string;
  movie_id: string;
  theatre_id: string;
  show_date: string;
  show_time: string;
  price: number;
  created_at: string;
}

export interface MovieOption {
  id: string;
  title: string;
}

export interface TheatreOption {
  id: string;
  name: string;
  location: string;
  location_id: string;
}

export interface ShowWithRelations extends ShowRecord {
  movies: MovieOption | null;
  theatres: TheatreOption | null;
}
