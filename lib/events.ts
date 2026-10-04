import { apiRequest } from "@/lib/api";
import type {
  ApiEnvelope,
  BackendEvent,
  PaginatedApiResponse,
} from "@/types/api";

export type EventFilters = {
  categories?: string | string[] | null;
  category?: string | string[] | null;
  search?: string | null;
  ordering?: string | null;
};

function appendFilterValues(
  params: URLSearchParams,
  key: string,
  value: string | string[] | null | undefined,
) {
  if (value === undefined || value === null) {
    return;
  }

  const values = Array.isArray(value) ? value : [value];

  values.forEach((entry) => {
    if (typeof entry === "string" && entry.trim()) {
      params.append(key, entry.trim());
    }
  });
}

export function buildEventsQueryString(
  page: number,
  filters: EventFilters = {},
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));

  const categories = filters.categories ?? filters.category;
  if (categories) {
    appendFilterValues(params, "categories__name", categories);
  }

  if (filters.search && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.ordering && filters.ordering.trim()) {
    params.set("ordering", filters.ordering.trim());
  }

  return params.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeEventsPayload(payload: unknown): BackendEvent[] {
  if (Array.isArray(payload)) {
    return payload as BackendEvent[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.results)) {
    return record.results as BackendEvent[];
  }

  if (Array.isArray(record.data)) {
    return record.data as BackendEvent[];
  }

  if (Array.isArray(record.items)) {
    return record.items as BackendEvent[];
  }

  if (isRecord(record.data)) {
    if (Array.isArray(record.data.results)) {
      return record.data.results as BackendEvent[];
    }

    if (Array.isArray(record.data.items)) {
      return record.data.items as BackendEvent[];
    }
  }

  if (isRecord(record.items)) {
    if (Array.isArray(record.items.results)) {
      return record.items.results as BackendEvent[];
    }
  }

  if (record.data && typeof record.data === "object") {
    return [record.data as BackendEvent];
  }

  return [];
}

export function normalizePaginatedEventsPayload(
  payload: unknown,
): PaginatedApiResponse<BackendEvent> {
  const results = normalizeEventsPayload(payload);

  if (!isRecord(payload)) {
    return { count: results.length, next: null, previous: null, results };
  }

  const record = payload as Record<string, unknown>;

  return {
    count: typeof record.count === "number" ? record.count : results.length,
    next: typeof record.next === "string" ? record.next : null,
    previous: typeof record.previous === "string" ? record.previous : null,
    results,
  };
}

export async function getEvents(
  page = 1,
  filters: EventFilters = {},
): Promise<BackendEvent[]> {
  const response = await apiRequest<
    | PaginatedApiResponse<BackendEvent>
    | ApiEnvelope<BackendEvent[]>
    | BackendEvent[]
    | {
        count?: number;
        next?: string | null;
        previous?: string | null;
        data?: BackendEvent[] | Record<string, unknown>;
        items?: BackendEvent[] | Record<string, unknown>;
        results?: BackendEvent[];
      }
  >(`/events/?${buildEventsQueryString(page, filters)}`);

  return normalizeEventsPayload(response);
}

export async function getEventsPage(
  page = 1,
  filters: EventFilters = {},
): Promise<PaginatedApiResponse<BackendEvent>> {
  const response = await apiRequest<
    | PaginatedApiResponse<BackendEvent>
    | ApiEnvelope<BackendEvent[]>
    | BackendEvent[]
    | {
        count?: number;
        next?: string | null;
        previous?: string | null;
        data?: BackendEvent[] | Record<string, unknown>;
        items?: BackendEvent[] | Record<string, unknown>;
        results?: BackendEvent[];
      }
  >(`/events/?${buildEventsQueryString(page, filters)}`);

  return normalizePaginatedEventsPayload(response);
}

export async function getEventById(id: string): Promise<BackendEvent | null> {
  const response = await apiRequest<
    ApiEnvelope<BackendEvent> | BackendEvent | { data?: BackendEvent }
  >(`/events/${encodeURIComponent(id)}`);

  if (
    typeof response === "object" &&
    response &&
    "data" in response &&
    response.data
  ) {
    return response.data as BackendEvent;
  }

  if (typeof response === "object" && response && "id" in response) {
    return response as BackendEvent;
  }

  return null;
}

export async function createEvent(payload: Partial<BackendEvent>) {
  return apiRequest<BackendEvent>("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
