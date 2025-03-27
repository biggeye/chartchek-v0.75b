import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ReactNode, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Barlow_Condensed, Montserrat } from 'next/font/google';
import Footer from "@/components/ui/modules/Footer";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "chartChek",
  description: "Compliance & Accreditation",
};

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});



export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true} className="scrollbar">
      <body className={`${barlowCondensed.variable} ${montserrat.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            {children}
            <Analytics />
            <SpeedInsights />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
