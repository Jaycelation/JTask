import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildNextRecurringTaskData } from "@/lib/recurrence";
import { serializeTask } from "@/lib/serializers";
import { updateTaskSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
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
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    return apiError(500, "TASK_FETCH_FAILED", "Không thể tải chi tiết task.");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });

    if (!existing) {
      return apiError(404, "TASK_NOT_FOUND", "Không tìm thấy task.");
    }

    const json = await request.json();
    const body = updateTaskSchema.parse(json);

    const isCompleted = typeof body.isCompleted === "boolean" ? body.isCompleted : existing.isCompleted;
    const wasJustCompleted = existing.isCompleted === false && isCompleted === true;

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
        ...(body.recurrencePattern !== undefined ? { recurrencePattern: body.recurrencePattern } : {}),
        ...(body.recurrenceInterval !== undefined ? { recurrenceInterval: body.recurrenceInterval } : {}),
        ...(body.recurrenceDays !== undefined ? { recurrenceDays: body.recurrenceDays } : {}),
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

    const nextRecurringTask = buildNextRecurringTaskData({
      ...existing,
      dueDate: body.dueDate !== undefined ? body.dueDate : existing.dueDate,
      reminderAt: body.reminderAt !== undefined ? body.reminderAt : existing.reminderAt,
      recurrencePattern: body.recurrencePattern ?? existing.recurrencePattern,
      recurrenceInterval: body.recurrenceInterval ?? existing.recurrenceInterval,
      recurrenceDays: body.recurrenceDays ?? existing.recurrenceDays,
    });

    if (wasJustCompleted && nextRecurringTask) {
      await prisma.task.create({
        data: nextRecurringTask,
      });
    }

    return apiSuccess(serializeTask(task), { message: "Cập nhật task thành công." });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "TASK_UPDATE_FAILED", "Không thể cập nhật task.");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });

    if (!existing) {
      return apiError(404, "TASK_NOT_FOUND", "Không tìm thấy task.");
    }

    await prisma.subtask.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });
    return apiSuccess(null, { message: "Task deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    return apiError(500, "TASK_DELETE_FAILED", "Không thể xóa task.");
  }
}
