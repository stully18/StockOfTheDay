import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stock of the Day",
  description: "One compelling stock story, every day. Powered by real market data.",
  openGraph: {
    title: "Stock of the Day",
    description: "One compelling stock story, every day.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
