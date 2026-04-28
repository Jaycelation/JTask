import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { getTodayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { ensureUserWithDefaultList } from "@/lib/task-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    await ensureUserWithDefaultList(user.id);
    const { start, end } = getTodayBounds();

    const [myDay, important, planned, all, completed] = await Promise.all([
      prisma.task.count({
        where: {
          userId: user.id,
          OR: [{ isMyDay: true }, { dueDate: { gte: start, lte: end } }],
        },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          isStarred: true,
          isCompleted: false,
        },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          dueDate: { not: null },
          isCompleted: false,
        },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
        },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
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
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    return apiError(500, "SUMMARY_FETCH_FAILED", "Không thể tải tổng quan.");
  }
}
