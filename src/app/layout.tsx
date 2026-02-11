import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "PUU Tracker - Perbandingan Peraturan Perundang-undangan",
  description: "Aplikasi AI untuk membandingkan peraturan perundang-undangan secara verbatim dan melacak perubahan pasal dari waktu ke waktu",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans selection:bg-indigo-500/30`}>
        <AppShell isAuthenticated={!!session?.user}>{children}</AppShell>
      </body>
    </html>
  );
}
