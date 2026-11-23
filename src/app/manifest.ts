import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduFlow — School Management",
    short_name: "EduFlow",
    description: "Attendance, fees, results and parent updates for schools and academies in Pakistan.",
    start_url: "/login",
    display: "standalone",
    background_color: "#F6F7FB",
    theme_color: "#0B1030",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
