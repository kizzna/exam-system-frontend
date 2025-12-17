import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login'];

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies or headers
  const authStorage = request.cookies.get('auth-storage');
  let isAuthenticated = false;

  if (authStorage) {
    try {
      // Decode the cookie value since it's URL encoded in auth-store
      const cookieValue = decodeURIComponent(authStorage.value);
      const authData = JSON.parse(cookieValue);
      isAuthenticated = !!authData?.state?.accessToken;
    } catch {
      isAuthenticated = false;
    }
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && pathname.startsWith('/dashboard')) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Admin only routes protection
  const adminRoutes = [
    '/dashboard/profiles',
    '/dashboard/review',
    '/dashboard/grading/answer-keys'
  ];

  if (isAuthenticated && adminRoutes.some(route => pathname.startsWith(route))) {
    try {
      const cookieValue = decodeURIComponent(authStorage?.value || '');
      const authData = JSON.parse(cookieValue);
      const isAdmin = authData?.state?.user?.is_admin === true;

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // If parsing fails, treat as not admin
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
