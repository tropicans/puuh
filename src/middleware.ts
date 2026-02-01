import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simplified middleware that checks for auth session cookie
// This avoids the Edge Runtime crypto issue by not importing next-auth
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Check for NextAuth session token in cookies
    const sessionToken = req.cookies.get("authjs.session-token") ||
        req.cookies.get("__Secure-authjs.session-token") ||
        req.cookies.get("next-auth.session-token") ||
        req.cookies.get("__Secure-next-auth.session-token");

    const isLoggedIn = !!sessionToken;

    // TODO: Role checking requires decoding JWT which needs crypto
    // For now, we just check if logged in
    // Full RBAC is enforced at the API/action level

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

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
