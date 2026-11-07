import type { Metadata, Viewport } from "next";
import { Caprasimo, Great_Vibes, Hanken_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { themeInitScript } from "@/components/theme-toggle";
import "./globals.css";

const body = Hanken_Grotesk({ variable: "--font-body", subsets: ["latin", "latin-ext"] });
// Calligraphic script, used only for the "Pizza di Napi" wordmark.
const script = Great_Vibes({ variable: "--font-script", subsets: ["latin", "latin-ext"], weight: "400" });
const display = Caprasimo({ variable: "--font-display", subsets: ["latin", "latin-ext"], weight: "400" });

export const metadata: Metadata = {
  title: "Pizza di Napi | Wood-fired pizza, delivered",
  description:
    "Neapolitan pizza from a wood-fired oven. Order in a minute, pay with PayPal, follow your delivery live.",
  appleWebApp: { capable: true, title: "Pizza di Napi", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151614" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions add data-* attributes to <html> before React hydrates.
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${script.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
