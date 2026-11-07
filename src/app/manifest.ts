import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pizza di Napi",
    short_name: "Pizza di Napi",
    description: "Order wood-fired pizza and pay with PayPal.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ee",
    theme_color: "#d4442a",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
