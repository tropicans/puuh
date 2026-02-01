import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={`${inter.variable} font-sans`}>
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                    <span className="text-white font-bold">📜</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold gradient-text">
                      PUU Tracker
                    </h1>
                    <p className="text-xs text-gray-500">
                      Perbandingan Peraturan Verbatim
                    </p>
                  </div>
                </a>

                <nav className="flex items-center gap-4">
                  <a
                    href="/"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/compare"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Bandingkan
                  </a>
                  <a
                    href="/manage"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    🔧 Kelola
                  </a>
                  <a
                    href="/settings"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    ⚙️
                  </a>
                  <a
                    href="/upload"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    + Upload
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-800 mt-auto">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <p>© 2024 PUU Tracker - Perbandingan Peraturan Perundang-undangan</p>
                <p>Powered by AI</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
