import { apiError, apiSuccess } from "@/lib/api";
import { getTodayBounds } from "@/lib/date";
import { getCurrentUserId } from "@/lib/mock-user";
import { prisma } from "@/lib/prisma";
import { ensureUserWithDefaultList } from "@/lib/task-service";

export async function GET() {
  try {
    const userId = getCurrentUserId();
    await ensureUserWithDefaultList(userId);
    const { start, end } = getTodayBounds();

    const [myDay, important, planned, all, completed] = await Promise.all([
      prisma.task.count({
        where: {
          userId,
          OR: [{ isMyDay: true }, { dueDate: { gte: start, lte: end } }],
        },
      }),
      prisma.task.count({
        where: {
          userId,
          isStarred: true,
          isCompleted: false,
        },
      }),
      prisma.task.count({
        where: {
          userId,
          dueDate: { not: null },
          isCompleted: false,
        },
      }),
      prisma.task.count({
        where: {
          userId,
        },
      }),
      prisma.task.count({
        where: {
          userId,
          isCompleted: true,
        },
      }),
    ]);

    return apiSuccess({
      counts: {
        myDay,
        important,
        planned,
        all,
        completed,
      },
      hasAnyTasks: all > 0,
    });
  } catch {
    return apiError(500, "SUMMARY_FETCH_FAILED", "Không thể tải tổng quan.");
  }
}
