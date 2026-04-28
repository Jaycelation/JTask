import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/serializers";
import { buildTaskOrderBy, buildTaskWhere, ensureUserWithDefaultList } from "@/lib/task-service";
import { createTaskSchema, taskQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await ensureUserWithDefaultList(user.id);

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = taskQuerySchema.parse(params);
    const where = buildTaskWhere({
      userId: user.id,
      filter: query.filter,
      listId: query.listId,
      search: query.search,
      status: query.status,
    });

    const tasks = await prisma.task.findMany({
      where,
      include: {
        list: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { subtasks: true },
        },
      },
      orderBy: buildTaskOrderBy(query.sort, query.order),
    });

    return apiSuccess(tasks.map(serializeTask), { total: tasks.length });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "TASKS_FETCH_FAILED", "Không thể tải danh sách task.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const defaultList = await ensureUserWithDefaultList(user.id);
    const json = await request.json();
    const body = createTaskSchema.parse(json);

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        listId: body.listId ?? defaultList.id,
        userId: user.id,
        isMyDay: body.isMyDay ?? false,
        isStarred: body.isStarred ?? false,
        dueDate: body.dueDate ?? null,
        reminderAt: body.reminderAt ?? null,
        recurrencePattern: body.recurrencePattern ?? "NONE",
        recurrenceInterval: body.recurrenceInterval ?? 1,
        recurrenceDays: body.recurrenceDays ?? [],
      },
      include: {
        list: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { subtasks: true },
        },
      },
    });

    return apiSuccess(serializeTask(task), {
      status: 201,
      message: "Tạo task thành công.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return apiError(401, "UNAUTHORIZED", "Bạn chưa đăng nhập.");
    }
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "TASK_CREATE_FAILED", "Không thể tạo task.");
  }
}
