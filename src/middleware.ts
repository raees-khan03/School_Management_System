import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { routeAccessMap } from "./lib/settings";

// Public Pages (Login / Home)
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)"]);

// API Routes (UploadThing, Clerk Webhooks, etc.)
const isApiRoute = createRouteMatcher(["/api/(.*)", "/trpc/(.*)"]);

const validRoles = ["admin", "teacher", "student", "parent"];

// ===== routeAccessMap se matchers banana =====
const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

export default clerkMiddleware(async (auth, req) => {
  // 1. API routes ko PAGE REDIRECTS se bypass karein (UploadThing HTML error fix)
  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  // 2. Login nahi hai aur private page khol raha hai -> login page (/) par bhejo
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. Login hai aur public page (/) par hai -> uske role ke page par bhejo
  if (userId && role && validRoles.includes(role) && isPublicRoute(req)) {
    return NextResponse.redirect(new URL(`/${role}`, req.url));
  }

  // 4. routeAccessMap ke hisaab se check karein — kya is role ko yeh route dekhne ki ijazat hai
  if (userId && role) {
    for (const { matcher, allowedRoles } of matchers) {
      if (matcher(req) && !allowedRoles.includes(role)) {
        // Role ko is route ki ijazat nahi -> apne role ke home page par bhejo
        return NextResponse.redirect(new URL(`/${role}`, req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and ALL static/map/json files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|map|json)).*)",
    "/(api|trpc)(.*)",
  ],
};