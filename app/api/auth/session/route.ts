import { apiError, apiSuccess } from "@/lib/api";
import { clearAuthCookie, getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }

    return apiSuccess(user);
  } catch {
    return apiError(500, "SESSION_FETCH_FAILED", "Không thể tải phiên đăng nhập.");
  }
}

export async function DELETE() {
  await clearAuthCookie();
  return apiSuccess(null, { message: "Đã đăng xuất." });
}
