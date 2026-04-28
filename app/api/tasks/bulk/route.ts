import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, "Cần chọn ít nhất một task."),
  action: z.enum(["complete", "uncomplete", "star", "unstar", "myday", "remove-myday", "delete"]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const json = await request.json();
    const body = bulkSchema.parse(json);

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        id: { in: body.ids },
      },
      select: { id: true },
    });

    const validIds = tasks.map((task) => task.id);
    if (validIds.length === 0) {
      return apiError(404, "TASKS_NOT_FOUND", "Không tìm thấy task hợp lệ.");
    }

    if (body.action === "delete") {
      await prisma.subtask.deleteMany({
        where: { taskId: { in: validIds } },
      });
      await prisma.task.deleteMany({
        where: { userId: user.id, id: { in: validIds } },
      });
      return apiSuccess({ affected: validIds.length }, { message: "Đã xóa các task đã chọn." });
    }

    const data =
      body.action === "complete"
        ? { isCompleted: true, completedAt: new Date() }
        : body.action === "uncomplete"
          ? { isCompleted: false, completedAt: null }
          : body.action === "star"
            ? { isStarred: true }
            : body.action === "unstar"
              ? { isStarred: false }
              : body.action === "myday"
                ? { isMyDay: true }
                : { isMyDay: false };

    await prisma.task.updateMany({
      where: {
        userId: user.id,
        id: { in: validIds },
      },
      data,
    });

    return apiSuccess({ affected: validIds.length }, { message: "Đã cập nhật các task đã chọn." });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }
    return apiError(500, "TASK_BULK_FAILED", "Không thể xử lý thao tác hàng loạt.");
  }
}
