import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simplified middleware that doesn't use Prisma (Edge runtime compatible)
// Auth checks are handled in individual route handlers
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes - allow access
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/api/auth"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // For protected routes, we'll check auth in the route handlers
  // This middleware just handles basic redirects
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // All other routes will have auth checks in their route handlers
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

