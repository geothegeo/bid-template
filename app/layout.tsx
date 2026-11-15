import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bidboard — pay to rank",
  description: "A leaderboard ranked by the dollars behind each link.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
