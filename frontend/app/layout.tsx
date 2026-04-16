import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
