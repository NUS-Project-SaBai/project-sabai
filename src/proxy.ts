import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Proxy to refresh Supabase auth session and enforce route protection.
 *
 * Ensures on every matched request:
 * 1. Expired access tokens are refreshed via the refresh token
 * 2. Updated cookies are set on both request and response
 * 3. Unauthenticated users are redirected to /login (with return path)
 * 4. Authenticated users are bounced away from /login to the main app
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set on request so downstream server components see fresh cookies
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Re-create response so the browser also receives the updated cookies
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Do not run any Supabase logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make the app insecure.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use request.nextUrl (NextURL object) throughout — never request.url (plain string)
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");

  // Unauthenticated: redirect to /login, preserving the intended destination
  // Special case: allow unauthenticated access to and /api routes without redirecting, so the API can return 401/403 as appropriate
  if (!user && !isLoginRoute && !isApiRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = ""; // clear current route's params before setting redirectTo
    loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search); // preserve full intended destination (including query)
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated: bounce away from /login to the main app
  if (user && isLoginRoute) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (JS/CSS bundles)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - Public assets (images, SVGs, etc.)
     *
     * This prevents the middleware running on every static file request,
     * which would add unnecessary latency and Supabase auth calls.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
