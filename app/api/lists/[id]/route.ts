import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { DEFAULT_LIST_NAME } from "@/lib/constants";
import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeList } from "@/lib/serializers";
import { ensureUserWithDefaultList } from "@/lib/task-service";
import { deleteListModeSchema, updateListSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const existing = await prisma.taskList.findFirst({ where: { id, userId: user.id } });

    if (!existing) {
      return apiError(404, "LIST_NOT_FOUND", "Không tìm thấy danh sách.");
    }

    const json = await request.json();
    const body = updateListSchema.parse(json);

    const list = await prisma.taskList.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return apiSuccess(serializeList(list), { message: "Cập nhật danh sách thành công." });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "LIST_UPDATE_FAILED", "Không thể cập nhật danh sách.");
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const list = await prisma.taskList.findFirst({ where: { id, userId: user.id } });

    if (!list) {
      return apiError(404, "LIST_NOT_FOUND", "Không tìm thấy danh sách.");
    }

    if (list.name === DEFAULT_LIST_NAME) {
      return apiError(400, "DEFAULT_LIST_PROTECTED", "Không thể xóa danh sách mặc định.");
    }

    const mode = deleteListModeSchema.parse(request.nextUrl.searchParams.get("mode") ?? "move-to-default");

    if (mode === "delete-tasks") {
      const tasks = await prisma.task.findMany({
        where: { userId: user.id, listId: id },
        select: { id: true },
      });

      if (tasks.length > 0) {
        await prisma.subtask.deleteMany({
          where: { taskId: { in: tasks.map((task: { id: string }) => task.id) } },
        });
      }

      await prisma.task.deleteMany({ where: { userId: user.id, listId: id } });
      await prisma.taskList.delete({ where: { id } });
      return apiSuccess(null, { message: "List deleted successfully" });
    }

    const defaultList = await ensureUserWithDefaultList(user.id);

    await prisma.task.updateMany({
      where: { userId: user.id, listId: id },
      data: { listId: defaultList.id },
    });
    await prisma.taskList.delete({ where: { id } });

    return apiSuccess(null, { message: "List deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "LIST_DELETE_FAILED", "Không thể xóa danh sách.");
  }
}
