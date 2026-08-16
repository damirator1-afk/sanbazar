import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Простая защита /admin/* (страница + её API) — логин "admin", пароль
// из ADMIN_UPLOAD_PASSWORD в .env.local. Достаточно для внутреннего
// инструмента на локальной машине; если сайт когда-нибудь будет
// задеплоен публично, стоит заменить на что-то посерьёзнее.
export function middleware(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.ADMIN_UPLOAD_PASSWORD;

  if (expected && auth === `Basic ${Buffer.from(`admin:${expected}`).toString("base64")}`) {
    return NextResponse.next();
  }

  return new NextResponse("Требуется авторизация", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SanBazar Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
