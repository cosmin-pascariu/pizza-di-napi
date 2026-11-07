import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. The only third-party code allowed is the PayPal JS SDK
 * (buttons + checkout popup). 'unsafe-inline' for scripts is needed by Next.js's
 * inline bootstrap and our tiny theme script; nonces would force every page to be
 * dynamically rendered. Dev additionally needs 'unsafe-eval' and the HMR websocket.
 */
const paypal = "https://*.paypal.com https://*.paypalobjects.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${paypal}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${paypal}`,
  "font-src 'self' data:",
  `connect-src 'self' ${paypal}${isDev ? " ws: wss:" : ""}`,
  `frame-src ${paypal}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self'",
  "manifest-src 'self'",
  // No upgrade-insecure-requests: HSTS already forces HTTPS in production, and the
  // directive breaks service-worker registration when testing a build on http://localhost.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The PayPal checkout opens a popup that must talk back to this page.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), usb=(), payment=(self "https://www.paypal.com" "https://www.sandbox.paypal.com")',
  },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lets phones on the same Wi-Fi (http://192.168.x.x:3000) use hot reload in dev.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
