import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeList } from "@/lib/serializers";
import { ensureUserWithDefaultList } from "@/lib/task-service";
import { createListSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    await ensureUserWithDefaultList(user.id);

    const lists = await prisma.taskList.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: [{ name: "asc" }],
    });

    return apiSuccess(lists.map(serializeList));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    return apiError(500, "LISTS_FETCH_FAILED", "Không thể tải danh sách.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await ensureUserWithDefaultList(user.id);
    const json = await request.json();
    const body = createListSchema.parse(json);

    const list = await prisma.taskList.create({
      data: {
        name: body.name,
        color: body.color ?? null,
        userId: user.id,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return apiSuccess(serializeList(list), { status: 201, message: "Tạo danh sách thành công." });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "LIST_CREATE_FAILED", "Không thể tạo danh sách.");
  }
}
