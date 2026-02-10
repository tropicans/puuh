import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BookOpen, Menu } from "lucide-react";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "PUU Tracker - Perbandingan Peraturan Perundang-undangan",
  description: "Aplikasi AI untuk membandingkan peraturan perundang-undangan secara verbatim dan melacak perubahan pasal dari waktu ke waktu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans selection:bg-indigo-500/30`}>
        <div className="min-h-screen flex flex-col relative">
          {/* Subtle Grid Background */}
          <div className="fixed inset-0 z-[-2] bg-background"></div>
          <div className="fixed inset-0 z-[-1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 group">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
                    <BookOpen className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight gradient-text">
                      PUU TRACKER
                    </h1>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        AI Verification Engine
                      </p>
                    </div>
                  </div>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                  <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                  <Link href="/compare" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Bandingkan</Link>
                  <Link href="/manage" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Kelola</Link>
                  <Link href="/upload" className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-white/10 active:scale-95">
                    + Upload Peraturan
                  </Link>
                </nav>

                <div className="md:hidden">
                  <button className="p-2 text-gray-400">
                    <Menu className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 container mx-auto px-6 py-12">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">📜</div>
                  <p>© 2024 PUU Tracker. Hak Cipta Dilindungi.</p>
                </div>
                <div className="flex items-center gap-6">
                  <a href="#" className="hover:text-white transition-colors">Tentang Kami</a>
                  <a href="#" className="hover:text-white transition-colors">Panduan</a>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">AI Node: Active</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
