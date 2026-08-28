import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS — IT Staffing",
  description: "Internal ATS for requirements, submissions, and shared pipeline tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
