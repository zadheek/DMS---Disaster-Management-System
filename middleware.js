import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isLoginPage = pathname === "/admin/login";

    // Already on login page — let through
    if (isLoginPage) return NextResponse.next();

    // Non-admin trying to access admin routes
    if (token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Allow ALL requests through to the middleware function above
      // (login page needs to be accessible without a token)
      authorized: ({ req }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname === "/admin/login") return true;
        return true; // Let middleware function handle the role check
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
