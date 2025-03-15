import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ReactNode, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "chartChek",
  description: "Compliance & Accreditation",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true} className="scrollbar">
      <body className={`${geistSans.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Suspense fallback={null}>
            <Analytics />
            <SpeedInsights />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
