import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { getCurrentUserId } from "@/lib/mock-user";
import { prisma } from "@/lib/prisma";
import { serializeSubtask } from "@/lib/serializers";
import { updateSubtaskSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = getCurrentUserId();
    const { id } = await params;
    const existing = await prisma.subtask.findFirst({
      where: { id, task: { userId } },
    });

    if (!existing) {
      return apiError(404, "SUBTASK_NOT_FOUND", "Không tìm thấy subtask.");
    }

    const json = await request.json();
    const body = updateSubtaskSchema.parse(json);

    const subtask = await prisma.subtask.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.isCompleted !== undefined ? { isCompleted: body.isCompleted } : {}),
      },
    });

    return apiSuccess(serializeSubtask(subtask), { message: "Cập nhật subtask thành công." });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "SUBTASK_UPDATE_FAILED", "Không thể cập nhật subtask.");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const userId = getCurrentUserId();
    const { id } = await params;
    const existing = await prisma.subtask.findFirst({
      where: { id, task: { userId } },
    });

    if (!existing) {
      return apiError(404, "SUBTASK_NOT_FOUND", "Không tìm thấy subtask.");
    }

    await prisma.subtask.delete({ where: { id } });
    return apiSuccess(null, { message: "Subtask deleted successfully" });
  } catch {
    return apiError(500, "SUBTASK_DELETE_FAILED", "Không thể xóa subtask.");
  }
}
