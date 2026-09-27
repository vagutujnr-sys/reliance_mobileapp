import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reliance Mobility",
    short_name: "Reliance",
    description: "Driving Possibilities. Delivering Trust.",
    start_url: "/",
    display: "standalone",
    background_color: "#111113",
    theme_color: "#111113",
    orientation: "portrait",
    icons: [
      { src: "/brand/main-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/main-logo.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}
