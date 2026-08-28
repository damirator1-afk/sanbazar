// Shared by middleware.ts (gates the /admin page) and any /api/admin/*
// route (gates the actual mutation) — the page-only check via middleware
// matcher previously missed /api/admin/upload-product entirely, since its
// path doesn't start with /admin/, leaving it reachable with no auth at
// all. Checking here too means a route stays protected even if a future
// matcher edit misses it again.
export function isAdminAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const expected = process.env.ADMIN_UPLOAD_PASSWORD;
  return Boolean(expected) && auth === `Basic ${Buffer.from(`admin:${expected}`).toString("base64")}`;
}
