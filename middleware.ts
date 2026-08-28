import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";

// Защита /admin/* (страница) и /api/admin/* (её API) — логин "admin",
// пароль из ADMIN_UPLOAD_PASSWORD в .env.local. Matcher должен покрывать
// оба префикса: /api/admin/upload-product раньше не подпадал под
// /admin/:path* (другой корневой сегмент пути) и был доступен без
// авторизации несмотря на защищённую страницу — route.ts теперь тоже
// проверяет это сам, но не полагаемся только на путь здесь.
export function middleware(request: NextRequest) {
  if (isAdminAuthorized(request)) {
    return NextResponse.next();
  }

  return new NextResponse("Требуется авторизация", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SanBazar Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
