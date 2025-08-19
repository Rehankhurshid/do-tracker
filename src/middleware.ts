import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    '/', 
    '/login', 
    '/reset-password', 
    '/consumer',
    '/api/auth/login',
  '/api/auth/me',
    '/api/auth/logout', // Add logout to public paths
    '/api/auth/reset-password',
    '/api/auth/check-user',
    '/api/auth/validate-token',
    '/api/auth/request-reset',
    '/api/public'
  ];
  
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

  const token = request.cookies.get('token')?.value || '';

  // Redirect to login if accessing protected route without token
  if (!isPublicPath && !token) {
    // Avoid redirect loop - if already going to login, don't redirect again
    if (path !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to dashboard if accessing login with token
  // Note: Do not auto-redirect from /login based on token presence, as stale/invalid
  // cookies can cause redirect loops (especially on mobile caches). Let the page
  // verify with /api/auth/me and decide client-side.

  const res = NextResponse.next();
  // Reduce cache issues on mobile: ensure protected routes are not cached
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/public).*)',
  ],
};

