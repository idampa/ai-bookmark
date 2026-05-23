import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Bookmark",
  description: "AI-powered bookmark manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
