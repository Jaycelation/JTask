import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { getCurrentUserId } from "@/lib/mock-user";
import { prisma } from "@/lib/prisma";
import { serializeSubtask } from "@/lib/serializers";
import { createSubtaskSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ taskId: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const userId = getCurrentUserId();
    const { taskId } = await params;
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });

    if (!task) {
      return apiError(404, "TASK_NOT_FOUND", "Không tìm thấy task.");
    }

    const subtasks = await prisma.subtask.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(subtasks.map(serializeSubtask));
  } catch {
    return apiError(500, "SUBTASKS_FETCH_FAILED", "Không thể tải subtask.");
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userId = getCurrentUserId();
    const { taskId } = await params;
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });

    if (!task) {
      return apiError(404, "TASK_NOT_FOUND", "Không tìm thấy task.");
    }

    const json = await request.json();
    const body = createSubtaskSchema.parse(json);

    const subtask = await prisma.subtask.create({
      data: {
        title: body.title,
        taskId,
      },
    });

    return apiSuccess(serializeSubtask(subtask), {
      status: 201,
      message: "Tạo subtask thành công.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "SUBTASK_CREATE_FAILED", "Không thể tạo subtask.");
  }
}
