import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoPratle | Find trusted professionals for your event",
  description:
    "Share your event requirements, receive proposals from trusted professionals, and find the right people to bring your event together.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
