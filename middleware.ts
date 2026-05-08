import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the requested URL path (e.g., "/admin/menu")
  const path = request.nextUrl.pathname;

  // 2. Check if the user is trying to access a secure route (Staff or Kitchen)
  const isSecureRoute = path.startsWith('/admin') || path.startsWith('/kitchen');

  // 3. We check for a Firebase Auth token in the cookies
  // (We will set this cookie when they log in)
  const sessionCookie = request.cookies.get('session')?.value;

  // 4. THE BOUNCER LOGIC:
  // If they want a secure route BUT have no session cookie -> Kick to login
  if (isSecureRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If they are ALREADY logged in and try to go to /login -> Send to admin panel
  if (path === '/login' && sessionCookie) {
    return NextResponse.redirect(new URL('/admin/menu', request.url));
  }

  // Otherwise, let them pass
  return NextResponse.next();
}

// Tell Next.js which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*', '/login'],
};