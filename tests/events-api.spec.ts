import {
  buildEventsQueryString,
  getEvents,
  getEventsPage,
  normalizeEventsPayload,
} from "../lib/events";

async function verifyEventsApiContract() {
  const listing = await getEvents(1);
  const filteredListing = await getEvents(1, {
    categories: "koncerty",
    ordering: "-start_date",
    search: "rock",
  });
  const page = await getEventsPage(1);
  const filteredPage = await getEventsPage(1, {
    categories: "koncerty",
    ordering: "-start_date",
    search: "rock",
  });
  const normalized = normalizeEventsPayload({
    count: 1,
    next: null,
    previous: null,
    results: [{ id: 1, title: "Test event" }],
  });
  const queryString = buildEventsQueryString(1, {
    categories: ["koncerty", "sport"],
    ordering: "-start_date",
    search: "rock",
  });

  if (!Array.isArray(listing)) {
    throw new Error("getEvents should return an array of event items");
  }

  if (!Array.isArray(filteredListing)) {
    throw new Error("getEvents should accept category and search filters");
  }

  if (!Array.isArray(page.results)) {
    throw new Error("getEventsPage should include a results array");
  }

  if (!Array.isArray(filteredPage.results)) {
    throw new Error("getEventsPage should accept category and search filters");
  }

  if (
    !queryString.includes("page=1") ||
    !queryString.includes("categories__name=koncerty") ||
    !queryString.includes("categories__name=sport") ||
    !queryString.includes("ordering=-start_date") ||
    !queryString.includes("search=rock")
  ) {
    throw new Error(
      "buildEventsQueryString should include page, categories__name, ordering and search values",
    );
  }

  if (!Array.isArray(normalized) || normalized.length !== 1) {
    throw new Error("normalizeEventsPayload should unwrap the results array");
  }
}

void verifyEventsApiContract();
