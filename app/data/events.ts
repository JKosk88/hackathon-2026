import type { BackendEvent } from "@/types/api";

export const categories = [
  { name: "All", slug: "all" },
  { name: "Kultura", slug: "kultura" },
  { name: "Wystawy", slug: "wystawy" },
  { name: "Koncerty", slug: "koncerty" },
  { name: "Rock Pop", slug: "rock-pop" },
  { name: "Muzyka klasyczna", slug: "muzyka-klasyczna" },
  {
    name: "Muzyka elektroniczna/Techno",
    slug: "muzyka-elektroniczna-techno",
  },
  {
    name: "Hard & Heavy / Metal / Punk",
    slug: "hard-heavy-metal-punk",
  },
  { name: "Jazz", slug: "jazz" },
  { name: "Opera i operetka", slug: "opera-i-operetka" },
  { name: "Alternatywa", slug: "alternatywa" },
  { name: "Rozrywka", slug: "rozrywka" },
  { name: "Dla dzieci", slug: "dla-dzieci" },
  { name: "Balet/Taniec", slug: "balet-taniec" },
  { name: "Muzyka filmowa", slug: "muzyka-filmowa" },
  { name: "Rap/Hip Hop", slug: "rap-hip-hop" },
  { name: "Pozostałe", slug: "pozostale" },
  { name: "Kabarety/Stand up", slug: "kabarety-stand-up" },
  { name: "Teatr", slug: "teatr" },
  { name: "Folk/World/Reggae", slug: "folk-world-reggae" },
  { name: "Sport", slug: "sport" },
  { name: "Siatkówka", slug: "siatkowka" },
] as const;

export type EventCategory = Exclude<(typeof categories)[number]["name"], "All">;

const validEventCategories = new Map(
  categories
    .filter((category) => category.slug !== "all")
    .map((category) => [
      category.name.toLowerCase(),
      category.name as EventCategory,
    ]),
);

export type EventItem = {
  id: string;
  title: string;
  category: EventCategory;
  summary: string;
  description: string;
  url?: string;
  city: string;
  location: string;
  date: string;
  time: string;
  price: string;
  organizer: string;
  tag: string;
  accent: string;
  image?: string;
};

export function normalizeEventCategory(rawCategory?: string): EventCategory {
  const nextCategory = (rawCategory ?? "Pozostałe").trim().toLowerCase();

  const directMatch = validEventCategories.get(nextCategory);

  if (directMatch) {
    return directMatch;
  }

  switch (nextCategory) {
    case "culture":
    case "kultura":
      return "Kultura";
    case "art":
    case "creative":
    case "wystawa":
    case "wystawy":
    case "exhibition":
      return "Wystawy";
    case "music":
    case "concert":
    case "koncert":
    case "koncerty":
    case "festival":
      return "Koncerty";
    case "rock":
    case "pop":
      return "Rock Pop";
    case "classical":
      return "Muzyka klasyczna";
    case "techno":
    case "electronic":
    case "elektroniczna":
      return "Muzyka elektroniczna/Techno";
    case "metal":
    case "punk":
    case "hardcore":
      return "Hard & Heavy / Metal / Punk";
    case "jazz":
      return "Jazz";
    case "opera":
    case "operetta":
      return "Opera i operetka";
    case "alternative":
      return "Alternatywa";
    case "entertainment":
    case "rozrywka":
    case "nightlife":
      return "Rozrywka";
    case "kids":
    case "children":
      return "Dla dzieci";
    case "dance":
    case "ballet":
      return "Balet/Taniec";
    case "film":
    case "soundtrack":
      return "Muzyka filmowa";
    case "rap":
    case "hip hop":
    case "hip-hop":
      return "Rap/Hip Hop";
    case "cabaret":
    case "standup":
    case "stand-up":
      return "Kabarety/Stand up";
    case "theatre":
    case "theater":
      return "Teatr";
    case "folk":
    case "world":
    case "reggae":
      return "Folk/World/Reggae";
    case "sport":
      return "Sport";
    case "volleyball":
    case "siatkowka":
    case "siatkówka":
      return "Siatkówka";
    default:
      return "Pozostałe";
  }
}

export function mapBackendEventToEventItem(event: BackendEvent): EventItem {
  const fallbackDate = new Date(
    event.start_date ?? event.date_created ?? Date.now(),
  );
  const formattedDate = Number.isNaN(fallbackDate.getTime())
    ? "Date TBD"
    : new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(fallbackDate);
  const formattedTime = Number.isNaN(fallbackDate.getTime())
    ? "Time TBD"
    : new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(fallbackDate);
  const primaryTag = event.lem_tags?.[0]?.name ?? event.source ?? "Community";

  return {
    id: String(event.id),
    title: event.title || "Untitled event",
    category: normalizeEventCategory(
      event.category ?? primaryTag ?? "Pozostałe",
    ),
    summary:
      event.summary ||
      event.description ||
      "A community event with local highlights and a vibrant atmosphere.",
    description:
      event.description || event.summary || "No description provided.",
    url: event.url || undefined,
    city: event.source || "Local city",
    location: event.url ? "See event details" : "Location TBD",
    date: formattedDate,
    time: formattedTime,
    price: "TBD",
    organizer: event.source || "Local organizer",
    tag: event.lem_tags?.map((tag) => tag.name).join(" • ") || primaryTag,
    accent: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    image: event.photo_url || undefined,
  };
}

export const events: EventItem[] = [
  {
    id: "sunset-market-live",
    title: "Sunset Market & Live Music",
    category: "Rozrywka",
    summary: "Local food stalls and acoustic sets by neighborhood artists.",
    description:
      "Spending the evening with local chefs, vintage finds, and a live music line-up that turns the riverfront into a vibrant community stage.",
    city: "Portland",
    location: "Riverfront Plaza",
    date: "Fri, Apr 18",
    time: "18:00",
    price: "Darmowe",
    organizer: "Portland Nights Collective",
    tag: "Open air • Family friendly",
    accent: "linear-gradient(135deg, #f97316 0%, #fb7185 100%)",
  },
  {
    id: "harbor-sound-festival",
    title: "Harbor Sound Live",
    category: "Koncerty",
    summary:
      "An indie-pop evening with waterfront performances and pop-up food trucks.",
    description:
      "Catch emerging artists from around the region while enjoying sunset views over the harbor and a curated selection of local food vendors.",
    city: "Seattle",
    location: "Pier 62",
    date: "Sob, 19 kwi",
    time: "17:30",
    price: "99 zł",
    organizer: "Northline Live",
    tag: "Live sets • Waterfront",
    accent: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
  },
  {
    id: "maker-studio-saturday",
    title: "Maker Studio Saturday",
    category: "Wystawy",
    summary:
      "Hands-on art sessions for beginners and experienced creators alike.",
    description:
      "From pottery to printmaking, this workshop-driven market invites visitors to learn from local artists and take home a handmade piece.",
    city: "Austin",
    location: "South Congress Arts Hall",
    date: "Sob, 20 kwi",
    time: "11:00",
    price: "69 zł",
    organizer: "Canvas & Co.",
    tag: "Workshop • Creative",
    accent: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  },
  {
    id: "sunrise-yoga-on-the-park",
    title: "Sunrise Yoga in the Park",
    category: "Sport",
    summary: "A gentle outdoor yoga flow followed by a coffee social.",
    description:
      "Start your weekend with a guided mindful practice, stretching, and a calm social hour with your neighborhood wellness community.",
    city: "Denver",
    location: "Civic Park Lawn",
    date: "Niedz, 21 kwi",
    time: "7:30",
    price: "59 zł",
    organizer: "Bloom Collective",
    tag: "Wellness • Community",
    accent: "linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)",
  },
  {
    id: "night-market-lights",
    title: "Night Market Lights",
    category: "Rozrywka",
    summary:
      "Lantern-lit street market with DJs, cocktails, and late-night bites.",
    description:
      "Explore vibrant pop-ups, live DJ sets, and creative drinks as the neighborhood comes alive after dark with an energetic local atmosphere.",
    city: "Chicago",
    location: "West Loop Yard",
    date: "Pią, 26 kwi",
    time: "20:00",
    price: "79 zł",
    organizer: "Afterglow Events",
    tag: "DJ • Late night",
    accent: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  },
  {
    id: "greenway-bike-social",
    title: "Greenway Bike Social",
    category: "Sport",
    summary: "A casual cycling route with picnic stops and a sunset finale.",
    description:
      "Join a social ride through the city greenway, connect with other cyclists, and end the night with a relaxed picnic by the water.",
    city: "San Diego",
    location: "Mission Bay Loop",
    date: "Sob, 27 kwi",
    time: "16:00",
    price: "Darmowe",
    organizer: "City Wheels Club",
    tag: "Outdoor • Social ride",
    accent: "linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)",
  },
];

export function getEventById(id: string) {
  return events.find((event) => event.id === id);
}

export function getEventsByCategory(category: string) {
  const normalized = category.toLowerCase();
  return events.filter(
    (event) =>
      event.category.toLowerCase() === normalized || normalized === "all",
  );
}
