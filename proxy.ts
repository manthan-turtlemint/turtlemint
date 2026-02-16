import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function proxy(req) {
        const token = req.nextauth.token;
        const isApproved = token?.isApproved;
        const isPendingPage = req.nextUrl.pathname === "/pending-approval";
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

        // 1. If not approved and not on the pending page, redirect to pending
        if (token && !isApproved && !isPendingPage) {
            return NextResponse.redirect(new URL("/pending-approval", req.url));
        }

        // 2. If approved and on the pending page, redirect to home
        if (token && isApproved && isPendingPage) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // 3. Admin-only route protection
        if (isAdminPage && token?.role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|login|auth).*)",
    ],
};
