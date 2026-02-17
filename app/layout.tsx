import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested for premium feel
import "./globals.css";
import { AppProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Turtlemint BondDesk",
  description: "Enterprise Surety Eligibility & Scoring Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
