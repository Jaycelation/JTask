import { apiError, apiSuccess } from "@/lib/api";
import { getCurrentUserId } from "@/lib/mock-user";
import { serializeSuggestion } from "@/lib/serializers";
import { ensureUserWithDefaultList, getTaskSuggestions } from "@/lib/task-service";

export async function GET() {
  try {
    const userId = getCurrentUserId();
    await ensureUserWithDefaultList(userId);
    const suggestions = await getTaskSuggestions(userId);
    return apiSuccess(suggestions.map(serializeSuggestion));
  } catch {
    return apiError(500, "SUGGESTIONS_FETCH_FAILED", "Không thể tải gợi ý My Day.");
  }
}
