import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const h = new Headers(request.headers);
  h.delete("x-jcts-preview");
  const token = request.nextUrl.searchParams.get("preview");
  if (token && token.length < 100) h.set("x-jcts-preview", token);
  return NextResponse.next({ request: { headers: h } });
}
export const config = {
  matcher: ["/((?!api|_next|uploads|favicon.ico|robots.txt|sitemap.xml).*)"],
};
