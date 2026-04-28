import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/serializers";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const now = new Date();

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        isCompleted: false,
        reminderAt: {
          not: null,
          lte: now,
        },
      },
      include: {
        list: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: [{ reminderAt: "asc" }],
      take: 20,
    });

    return apiSuccess(tasks.map(serializeTask));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    return apiError(500, "REMINDERS_FETCH_FAILED", "Không thể tải nhắc nhở đến hạn.");
  }
}
