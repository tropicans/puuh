import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function getSessionRole(req: NextRequest): Promise<string | null> {
  try {
    const sessionUrl = new URL('/api/auth/session', req.url);
    const response = await fetch(sessionUrl, {
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const session = (await response.json()) as
      | {
          user?: {
            role?: string;
          };
        }
      | null;

    if (!session || typeof session !== 'object') {
      return null;
    }

    return session.user?.role ?? null;
  } catch (error) {
    console.error('Failed to fetch session role in proxy:', error);
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  const nextWithPathname = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  const sessionToken =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');

  const isLoggedIn = !!sessionToken;

  const publicRoutes = ['/design', '/login', '/api/auth', '/api/seed'];
  const isPublicRoute = pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route));

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return nextWithPathname();
  }

  if (isPublicRoute) {
    return nextWithPathname();
  }

  const protectedRoutes = ['/dashboard', '/compare', '/regulations', '/upload', '/manage', '/settings'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  const protectedApiRoutes = ['/api/upload', '/api/seed', '/api/versions', '/api/regulations/fetch', '/api/regulations'];
  const isProtectedApi = protectedApiRoutes.some((route) => pathname.startsWith(route));

  const adminRoutes = ['/upload', '/manage', '/settings'];
  const isAdminRoute = adminRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  const adminApiRoutes = ['/api/upload', '/api/seed', '/api/versions'];
  const isAdminApiRoute = adminApiRoutes.some((route) => pathname.startsWith(route));

  const devRoutes = ['/api/test-ai', '/api/test-vision', '/api/db-status'];
  const isDevRoute = devRoutes.some((route) => pathname.startsWith(route));

  if (isDevRoute && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint not available in production' }, { status: 404 });
  }

  if (!isLoggedIn && (isProtectedRoute || isProtectedApi)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (isAdminRoute || isAdminApiRoute)) {
    const role = await getSessionRole(req);

    if (!role) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin = role === 'ADMIN';

    if (!isAdmin && isAdminApiRoute) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && isAdminRoute) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return nextWithPathname();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
