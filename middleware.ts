import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ['/', '/about', '/features', '/login', '/contact']

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = publicRoutes.includes(pathname)
  const token = request.cookies.get("auth-token")
  
  // Allow access to public routes regardless of authentication
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check if user is authenticated for protected routes
  if (!token) {
    // Redirect to login page if not authenticated
    const loginUrl = new URL('/login', request.url)
    // Store the attempted URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

