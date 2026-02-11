"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BookOpen, LogIn, LogOut, Scale } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const noShellRoutes = ["/", "/design", "/login"];

export function AppShell({ children, isAuthenticated }: AppShellProps) {
  const pathname = usePathname();
  const shouldHideShell =
    pathname === "/" ||
    pathname.startsWith("/design") ||
    pathname.startsWith("/login");

  if (shouldHideShell || noShellRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="fixed inset-0 z-[-2] bg-background" />
      <div className="fixed inset-0 z-[-1] bg-[linear-gradient(to_right,#8080800f_1px,transparent_1px),linear-gradient(to_bottom,#8080800f_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <p className="text-sm font-semibold">PUU Tracker</p>
              <p className="text-[11px] text-muted-foreground">Regulatory Workspace</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Landing</Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
            <Link href="/compare" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Bandingkan</Link>
            <Link href="/manage" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Kelola</Link>
            <Link href="/settings" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pengaturan</Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Link>
            )}
            <Link href="/upload" className="hidden rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 sm:inline-flex">
              + Upload
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">{children}</div>
      </main>

      <footer className="border-t border-border/60 bg-background/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <p>© {new Date().getFullYear()} PUU Tracker. Hak cipta dilindungi.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <Link href="/compare" className="hover:text-foreground">Bandingkan</Link>
            <Link href="/upload" className="hover:text-foreground">Upload</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
