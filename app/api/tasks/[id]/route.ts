import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { getCurrentUserId } from "@/lib/mock-user";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/serializers";
import { updateTaskSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const userId = getCurrentUserId();
    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        list: {
          select: { id: true, name: true, color: true },
        },
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) {
      return apiError(404, "TASK_NOT_FOUND", "Không tìm thấy task.");
    }

    return apiSuccess(serializeTask(task));
  } catch {
    return apiError(500, "TASK_FETCH_FAILED", "Không thể tải chi tiết task.");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = getCurrentUserId();
    const { id } = await params;
    const existing = await prisma.task.findFirst({ where: { id, userId } });

    if (!existing) {
      return apiError(404, "TASK_NOT_FOUND", "Không tìm thấy task.");
    }

    const json = await request.json();
    const body = updateTaskSchema.parse(json);

    const isCompleted =
      typeof body.isCompleted === "boolean" ? body.isCompleted : existing.isCompleted;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.isStarred !== undefined ? { isStarred: body.isStarred } : {}),
        ...(body.isMyDay !== undefined ? { isMyDay: body.isMyDay } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
        ...(body.reminderAt !== undefined ? { reminderAt: body.reminderAt } : {}),
        ...(body.listId !== undefined ? { listId: body.listId } : {}),
        ...(body.isCompleted !== undefined
          ? {
              isCompleted,
              completedAt: isCompleted ? new Date() : null,
            }
          : {}),
      },
      include: {
        list: {
          select: { id: true, name: true, color: true },
        },
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { subtasks: true },
        },
      },
    });

    return apiSuccess(serializeTask(task), { message: "Cập nhật task thành công." });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return apiError(400, "TASK_UPDATE_FAILED", "Không thể cập nhật task.");
    }

    return apiError(500, "TASK_UPDATE_FAILED", "Không thể cập nhật task.");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const userId = getCurrentUserId();
    const { id } = await params;
    const existing = await prisma.task.findFirst({ where: { id, userId } });

    if (!existing) {
      return apiError(404, "TASK_NOT_FOUND", "Không tìm thấy task.");
    }

    await prisma.task.delete({ where: { id } });
    return apiSuccess(null, { message: "Task deleted successfully" });
  } catch {
    return apiError(500, "TASK_DELETE_FAILED", "Không thể xóa task.");
  }
}
