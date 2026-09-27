import { NextResponse, type NextRequest } from "next/server";
import { readToken } from "@/lib/auth/token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readToken(request.cookies.get("rms_session")?.value);

  if (pathname.startsWith("/driver") && session?.role !== "driver") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/owner") && session?.role !== "client") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (session?.role !== "admin" && session?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  if (pathname === "/login" && session?.role === "driver") {
    return NextResponse.redirect(new URL("/driver", request.url));
  }
  if (pathname === "/login" && session?.role === "client") {
    return NextResponse.redirect(new URL("/owner", request.url));
  }
  if (pathname === "/admin/login" && (session?.role === "admin" || session?.role === "super_admin")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/driver/:path*", "/owner/:path*", "/admin/:path*", "/login"],
};
