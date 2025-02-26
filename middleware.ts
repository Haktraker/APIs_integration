import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Temporarily disabled auth middleware
  return NextResponse.next()

  /*
  const token = request.cookies.get("auth-token")

  if (!token && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (token && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
  */
}

export const config = {
  matcher: ["/", "/home", "/change-password"],
}

