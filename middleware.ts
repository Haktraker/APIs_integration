import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for login page and API routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api') || pathname.includes('_next')) {
    return NextResponse.next()
  }
  
  // Check if user is authenticated (commented out for now)
  // const token = request.cookies.get("auth-token")
  // if (!token) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }
  
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

