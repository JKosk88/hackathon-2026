export type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  success?: boolean;
  token?: string;
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
  id: string;
  title: string;
  category?: string;
  summary?: string;
  description?: string;
  city?: string;
  location?: string;
  date?: string;
  time?: string;
  price?: string;
  organizer?: string;
  tag?: string;
  accent?: string;
};
