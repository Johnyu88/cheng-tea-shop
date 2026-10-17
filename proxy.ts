import { NextResponse, type NextRequest } from "next/server";
import { assertAcerDemoRequest, acerDemoRequested, assertCloudDemoRequest, cloudDemoRequested, hasCloudDemoAuthorization } from "@/lib/server/demo-cloud";

// Global budget is deliberately single-instance and contains no addresses or credentials.
let failures = 0;
let windowStart = 0;
export function proxy(request: NextRequest) {
  if (process.env.PUBLIC_STOREFRONT_SERVER === "enabled") {
    const path = request.nextUrl.pathname;
    const denied = path === "/admin" || path.startsWith("/admin/") || path === "/api" || (path.startsWith("/api/") && path !== "/api/public/catalog" && !path.startsWith("/api/public/media/")) || path === "/orders" || path.startsWith("/orders/") || path === "/install" || path.startsWith("/install/") || path.startsWith("/checkout/success") || path.startsWith("/manifest-orders") || path.startsWith("/manifest-products") || path === "/private-app" || path.startsWith("/private-app/");
    if (denied) return new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
    if (request.method !== "GET" && request.method !== "HEAD") return new NextResponse("Method not allowed", { status: 405 });
    const response = NextResponse.next();
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    response.headers.set("x-frame-options", "DENY");
    return response;
  }
  if (process.env.DEMO_COMMERCE_ACER === "enabled" && process.env.DEMO_ACER_MERCHANT_LOGIN_DIRECT === "enabled") {
    const path = request.nextUrl.pathname;
    const allowed = path === "/admin/products" || path === "/admin/products/new" || path === "/admin/orders"
      || path === "/api/health"
      || path === "/api/demo/admin/session"
      || path.startsWith("/api/demo/admin/orders")
      || path === "/api/demo/admin/otp"
      || path === "/api/demo/admin/passkey/enroll"
      || path === "/api/demo/catalog"
      || path.startsWith("/api/demo/catalog/media/")
      || path === "/api/demo/otp"
      || path.startsWith("/api/demo/orders")
      || path.startsWith("/api/auth/")
      || path.startsWith("/_next/")
      || path.startsWith("/icons/")
      || path.startsWith("/media/")
      || path === "/manifest-products.webmanifest"
      || path === "/manifest-orders.webmanifest"
      || path === "/favicon.ico";
    if (!allowed) return new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
    const response = NextResponse.next();
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    response.headers.set("x-frame-options", "DENY");
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("referrer-policy", "same-origin");
    response.headers.set("strict-transport-security", "max-age=31536000");
    return response;
  }
  const cloud = cloudDemoRequested();
  const acer = acerDemoRequested();
  if (!cloud && !acer) return NextResponse.next();
  // Health returns no application data; staging is reachable only inside the Tailscale tailnet.
  if (request.nextUrl.pathname === "/api/health" && request.method === "GET") return NextResponse.next();
  const now = Date.now();
  if (now - windowStart >= 60_000) { failures = 0; windowStart = now; }
  if (failures >= 120 && !hasCloudDemoAuthorization(request)) return new NextResponse("Please retry later", { status: 429, headers: { "retry-after": "60", "cache-control": "no-store" } });
  try {
    if (cloud) assertCloudDemoRequest(request);
    else assertAcerDemoRequest(request);
  }
  catch (error) {
    console.warn("Preview request denied:", error instanceof Error ? error.message : "Invalid request");
    failures += 1;
    return new NextResponse("Private test site", { status: 401, headers: {
      "www-authenticate": 'Basic realm="Chen Tea private preview", charset="UTF-8"',
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    } });
  }
  const response = NextResponse.next();
  response.headers.set("cache-control", "private, no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "same-origin");
  response.headers.set("strict-transport-security", "max-age=31536000");
  response.headers.set("content-security-policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  return response;
}

export const config = { matcher: "/:path*" };
