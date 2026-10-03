export type EventCategory =
  | "Music"
  | "Food"
  | "Art"
  | "Wellness"
  | "Outdoors"
  | "Nightlife";

export type EventItem = {
  id: string;
  title: string;
  category: EventCategory;
  summary: string;
  description: string;
  city: string;
  location: string;
  date: string;
  time: string;
  price: string;
  organizer: string;
  tag: string;
  accent: string;
};

export const categories = [
  { name: "All", slug: "all" },
  { name: "Music", slug: "music" },
  { name: "Food", slug: "food" },
  { name: "Art", slug: "art" },
  { name: "Wellness", slug: "wellness" },
  { name: "Outdoors", slug: "outdoors" },
  { name: "Nightlife", slug: "nightlife" },
] as const;

export const events: EventItem[] = [
  {
    id: "sunset-market-live",
    title: "Sunset Market & Live Music",
    category: "Food",
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
    category: "Music",
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
    category: "Art",
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
    category: "Wellness",
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
    category: "Nightlife",
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
    category: "Outdoors",
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
