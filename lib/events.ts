import { apiRequest } from "@/lib/api";
import type { ApiEnvelope, BackendEvent } from "@/types/api";

function normalizeEventsPayload(payload: unknown): BackendEvent[] {
  if (Array.isArray(payload)) {
    return payload as BackendEvent[];
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as BackendEvent[];
  }

  if (Array.isArray(record.items)) {
    return record.items as BackendEvent[];
  }

  if (record.data && typeof record.data === "object") {
    return [record.data as BackendEvent];
  }

  return [];
}

export async function getEvents(): Promise<BackendEvent[]> {
  const response = await apiRequest<
    | ApiEnvelope<BackendEvent[]>
    | BackendEvent[]
    | { data?: BackendEvent[]; items?: BackendEvent[] }
  >("/events");

  return normalizeEventsPayload(response);
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
