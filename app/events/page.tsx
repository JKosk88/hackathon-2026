"use client";

import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EventCard } from "@/app/components/EventCard";
import { useLanguage } from "@/app/components/LanguageProvider";
import {
  categories,
  type EventItem,
  mapBackendEventToEventItem,
} from "@/app/data/events";
import { categoryLabels } from "@/app/i18n";
import { getEventsPage } from "@/lib/events";

const MAX_FAILED_LOADS = 3;
const LOAD_COOLDOWN_MS = 500;

const monthMap: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function parseEventDate(date: string) {
  const match = date.match(/(?:\w{3},\s+)?([A-Za-z]{3})\s+(\d{1,2})/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, monthName, day] = match;
  return (monthMap[monthName] ?? 12) * 100 + Number(day);
}

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [failedLoads, setFailedLoads] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef(1);
  const lastLoadAtRef = useRef(0);
  const requestInFlightRef = useRef(false);

  const activeCategory = searchParams.get("category") ?? "All";
  const activeSort = searchParams.get("sort") ?? "soonest";
  const recommendationQuery = searchParams.get("q") ?? "";
  const activeCategoryFilter =
    activeCategory === "All" ? undefined : activeCategory;
  const recommendedSearchFilter = recommendationQuery.trim() || undefined;

  const loadPage = useCallback(
    async (pageNumber: number, append: boolean) => {
      if (requestInFlightRef.current) {
        return null;
      }

      requestInFlightRef.current = true;

      try {
        const page = await getEventsPage(pageNumber, {
          categories: activeCategoryFilter,
          search: recommendedSearchFilter,
        });
        const mappedEvents = page.results.map(mapBackendEventToEventItem);

        setEvents((currentEvents) =>
          append ? [...currentEvents, ...mappedEvents] : mappedEvents,
        );
        setTotalCount(page.count ?? mappedEvents.length);
        currentPageRef.current = pageNumber;
        setHasMore(Boolean(page.next));
        setFailedLoads(0);
        return page;
      } catch {
        setFailedLoads((current) => {
          const nextFailedLoads = current + 1;
          setHasMore(nextFailedLoads < MAX_FAILED_LOADS);
          return nextFailedLoads;
        });
        return null;
      } finally {
        requestInFlightRef.current = false;
      }
    },
    [activeCategoryFilter, recommendedSearchFilter],
  );

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setEvents([]);
    setHasMore(true);

    getEventsPage(1, {
      categories: activeCategoryFilter,
      search: recommendedSearchFilter,
    })
      .then((page) => {
        if (!isMounted) {
          return;
        }

        const mapped = page.results.map(mapBackendEventToEventItem);
        setEvents(mapped);
        setTotalCount(page.count ?? mapped.length);
        currentPageRef.current = 1;
        setHasMore(Boolean(page.next));
        setFailedLoads(0);
      })
      .catch(() => {
        if (isMounted) {
          setEvents([]);
          setHasMore(false);
          setFailedLoads((current) => current + 1);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategoryFilter, recommendedSearchFilter]);

  const loadMore = useCallback(async () => {
    const now = Date.now();

    if (requestInFlightRef.current || isLoadingMore || !hasMore) {
      return;
    }

    if (failedLoads >= MAX_FAILED_LOADS) {
      setHasMore(false);
      return;
    }

    if (now - lastLoadAtRef.current < LOAD_COOLDOWN_MS) {
      return;
    }

    lastLoadAtRef.current = now;
    setIsLoadingMore(true);

    try {
      await loadPage(currentPageRef.current + 1, true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [failedLoads, hasMore, isLoadingMore, loadPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore || isLoading) {
      return;
    }

    let isDisposed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isDisposed || !entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        if (
          requestInFlightRef.current ||
          isLoadingMore ||
          failedLoads >= MAX_FAILED_LOADS
        ) {
          return;
        }

        if (Date.now() - lastLoadAtRef.current < LOAD_COOLDOWN_MS) {
          return;
        }

        void loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);

    return () => {
      isDisposed = true;
      observer.disconnect();
    };
  }, [failedLoads, hasMore, isLoading, isLoadingMore, loadMore]);

  const getRecommendationScore = useCallback(
    (event: (typeof events)[number], query: string) => {
      if (!query.trim()) {
        return 0;
      }

      const normalizedQuery = query.toLowerCase();
      const haystack = [
        event.title,
        event.summary,
        event.description,
        event.category,
        event.city,
        event.location,
        event.tag,
      ]
        .join(" ")
        .toLowerCase();

      const synonyms: Record<string, string[]> = {
        music: ["music", "concert", "band", "dj", "live", "sound"],
        food: [
          "food",
          "restaurant",
          "eat",
          "dinner",
          "market",
          "snack",
          "cuisine",
        ],
        art: [
          "art",
          "craft",
          "creative",
          "gallery",
          "maker",
          "workshop",
          "painting",
        ],
        wellness: [
          "wellness",
          "yoga",
          "mindful",
          "fitness",
          "relax",
          "meditation",
          "health",
        ],
        outdoors: [
          "outdoor",
          "park",
          "bike",
          "nature",
          "sunset",
          "greenway",
          "hike",
          "fresh air",
        ],
        nightlife: [
          "night",
          "late",
          "dj",
          "cocktails",
          "party",
          "club",
          "after dark",
        ],
        family: ["family", "kids", "friendly", "group", "community"],
        affordable: ["cheap", "budget", "free", "low cost", "affordable"],
      };

      let score = 0;
      const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

      queryTerms.forEach((term) => {
        if (haystack.includes(term)) {
          score += 3;
        }

        if (event.title.toLowerCase().includes(term)) {
          score += 2;
        }

        if (event.summary.toLowerCase().includes(term)) {
          score += 1;
        }

        Object.entries(synonyms).forEach(([key, values]) => {
          if (
            term === key ||
            values.some((value) => value.includes(term) || term.includes(value))
          ) {
            if (
              event.category.toLowerCase().includes(key) ||
              haystack.includes(key)
            ) {
              score += 4;
            }
          }
        });
      });

      return score;
    },
    [],
  );

  const filteredEvents = useMemo(() => {
    const scoredEvents = events.map((event) => ({
      event,
      score: getRecommendationScore(event, recommendationQuery),
    }));

    if (recommendationQuery.trim()) {
      return scoredEvents
        .sort((left, right) => {
          const scoreDiff = right.score - left.score;
          if (scoreDiff !== 0) {
            return scoreDiff;
          }

          return left.event.title.localeCompare(right.event.title);
        })
        .map(({ event }) => event);
    }

    return [...events].sort((left, right) => {
      if (activeSort === "title") {
        return left.title.localeCompare(right.title);
      }

      if (activeSort === "latest") {
        return parseEventDate(right.date) - parseEventDate(left.date);
      }

      return parseEventDate(left.date) - parseEventDate(right.date);
    });
  }, [activeSort, events, getRecommendationScore, recommendationQuery]);

  const applyFilters = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, value);
    });

    const query = nextParams.toString();
    router.push(query ? `/events?${query}` : "/events");
  };

  const recommendationInput = recommendationQuery;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-300">
              {t("discover")}
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              {t("localEventsNearby")}
            </h1>
          </div>

          <Link
            href="/post"
            className="inline-flex rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
          >
            {t("postEvent")}
          </Link>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              ✨
            </span>
            <input
              value={recommendationInput}
              onChange={(event) =>
                applyFilters({ q: event.target.value || null })
              }
              placeholder="I want something relaxed, outdoors, and mostly free"
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              applyFilters({ q: recommendationInput.trim() || null })
            }
            className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Recommend
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                applyFilters({ category: category === "All" ? null : category })
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === category
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              }`}
            >
              {categoryLabels[
                category
                  .toLowerCase()
                  .replace(/\s+/g, "-") as keyof typeof categoryLabels
              ]?.[language] ?? category}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("showing")}{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {totalCount}
            </span>{" "}
            {t("eventsCount")}
          </p>

          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-events"
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              {t("sortBy")}
            </label>
            <select
              id="sort-events"
              value={activeSort}
              onChange={(event) => applyFilters({ sort: event.target.value })}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500"
            >
              <option value="soonest">{t("soonest")}</option>
              <option value="latest">{t("latest")}</option>
              <option value="title">{t("title")}</option>
            </select>
          </div>
        </div>
      </section>

      {recommendationQuery.trim() ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Recommended for:{" "}
          <span className="font-semibold">{recommendationQuery}</span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-72 rounded-[28px] bg-slate-100" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </section>

          {hasMore ? (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {isLoadingMore ? "Loading more events..." : "Scroll for more"}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700">
          {t("noMatches")}
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
              Discover
            </p>
            <div className="mt-4 h-10 w-64 rounded-full bg-white/10" />
          </section>
          <div className="h-24 rounded-3xl bg-slate-100" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-72 rounded-3xl bg-slate-100" />
            ))}
          </div>
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
