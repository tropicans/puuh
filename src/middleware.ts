import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function getSessionRole(req: NextRequest): Promise<string | null> {
    try {
        const sessionUrl = new URL("/api/auth/session", req.url);
        const response = await fetch(sessionUrl, {
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        const session = await response.json() as {
            user?: {
                role?: string;
            };
        };

        return session.user?.role ?? null;
    } catch (error) {
        console.error("Failed to fetch session role in middleware:", error);
        return null;
    }
}

// Auth middleware with route protection and role checks
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Check for NextAuth session token in cookies
    const sessionToken = req.cookies.get("authjs.session-token") ||
        req.cookies.get("__Secure-authjs.session-token") ||
        req.cookies.get("next-auth.session-token") ||
        req.cookies.get("__Secure-next-auth.session-token");

    const isLoggedIn = !!sessionToken;

    // Public routes - no auth required
    // Note: /api/seed is public for initial setup - in production, consider protecting or removing
    const publicRoutes = ["/login", "/api/auth", "/api/seed"];
    const isPublicRoute = publicRoutes.some(route =>
        pathname.startsWith(route)
    );

    // Static files that should be public
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Allow public routes
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Protected routes - need authentication
    const protectedRoutes = ["/", "/compare", "/regulations", "/upload", "/manage", "/settings"];
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route ||
        pathname.startsWith(route + "/")
    );

    // Protected API routes
    const protectedApiRoutes = [
        "/api/upload",
        "/api/seed",
        "/api/versions",
        "/api/regulations/fetch",
        "/api/regulations"
    ];
    const isProtectedApi = protectedApiRoutes.some(route =>
        pathname.startsWith(route)
    );

    // Admin-only sections
    const adminRoutes = ["/upload", "/manage", "/settings"];
    const isAdminRoute = adminRoutes.some(route =>
        pathname === route || pathname.startsWith(route + "/")
    );

    const adminApiRoutes = ["/api/upload", "/api/seed", "/api/versions"];
    const isAdminApiRoute = adminApiRoutes.some(route =>
        pathname.startsWith(route)
    );

    // Test/dev endpoints - only in development
    const devRoutes = ["/api/test-ai", "/api/test-vision", "/api/db-status"];
    const isDevRoute = devRoutes.some(route => pathname.startsWith(route));

    // Block dev routes in production
    if (isDevRoute && process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Endpoint not available in production" },
            { status: 404 }
        );
    }

    // Check authentication for protected routes
    if (!isLoggedIn && (isProtectedRoute || isProtectedApi)) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isLoggedIn && (isAdminRoute || isAdminApiRoute)) {
        const role = await getSessionRole(req);
        const isAdmin = role === "ADMIN";

        if (!isAdmin && isAdminApiRoute) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        if (!isAdmin && isAdminRoute) {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
