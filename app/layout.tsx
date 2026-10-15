import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasteAI Enterprise — Food Business Intelligence",
  description:
    "AI-powered business intelligence for restaurants, cafés, catering, and hospitality teams."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
