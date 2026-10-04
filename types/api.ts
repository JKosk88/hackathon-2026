export type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  success?: boolean;
  token?: string;
};

export type PaginatedApiResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type EventTag = {
  id?: string | number;
  name: string;
};

export type BackendUser = {
  id?: string | number;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  refreshToken?: string;
  provider?: string;
};

export type BackendEvent = {
  id: string | number;
  title: string;
  description?: string;
  summary?: string;
  source?: string;
  lem_tags?: EventTag[];
  date_created?: string;
  date_updated?: string;
  start_date?: string;
  end_date?: string;
  photo_url?: string;
  external_id?: string;
  external_group_id?: string;
  url?: string;
  category?: string;
  city?: string;
  location?: string;
  date?: string;
  time?: string;
  price?: string;
  organizer?: string;
  tag?: string;
  accent?: string;
};
