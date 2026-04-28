import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { serializeSuggestion } from "@/lib/serializers";
import { ensureUserWithDefaultList, getTaskSuggestions } from "@/lib/task-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    await ensureUserWithDefaultList(user.id);
    const suggestions = await getTaskSuggestions(user.id);
    return apiSuccess(suggestions.map(serializeSuggestion));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    return apiError(500, "SUGGESTIONS_FETCH_FAILED", "Không thể tải gợi ý My Day.");
  }
}
