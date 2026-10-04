import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CityVibe",
    short_name: "CityVibe",
    description:
      "Discover live music, food, culture, wellness, and community events in your city.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait",
    lang: "en",
    categories: ["lifestyle", "entertainment", "travel"],
    icons: [
      {
        src: "/ct-vab-favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/ct vab.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
