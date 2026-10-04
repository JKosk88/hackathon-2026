import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AppHeader } from "@/app/components/AppHeader";
import { AuthProvider } from "@/app/components/AuthProvider";
import { LanguageProvider } from "@/app/components/LanguageProvider";
import { NotificationToastHost } from "@/app/components/NotificationToastHost";
import { PWAInstallPrompt } from "@/app/components/PWAInstallPrompt";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CityVibe | Discover Events Near You",
  description:
    "Discover the city's best live music, food, culture, wellness, and community events with CityVibe.",
  applicationName: "CityVibe",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/ct-vab-favicon.svg", type: "image/svg+xml" },
      { url: "/ct vab.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/ct-vab-favicon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "CityVibe",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <div className="min-h-screen">
                <AppHeader />

                <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                  {children}
                </main>
                <NotificationToastHost />
                <PWAInstallPrompt />
              </div>
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
