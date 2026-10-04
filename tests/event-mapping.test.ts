import { mapBackendEventToEventItem } from "../app/data/events";

const event = mapBackendEventToEventItem({
  id: 42,
  title: "City Lights Festival",
  summary: "Live music downtown",
  description: "An evening under the city lights",
  source: "City Pulse",
  category: "Music",
  photo_url: "https://example.com/event.jpg",
});

if (event.image !== "https://example.com/event.jpg") {
  throw new Error("Expected mapped event image to use photo_url");
}
