import { Prisma } from "@prisma/client";
import { endOfDay, startOfDay, subDays } from "date-fns";

import { DEFAULT_LIST_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { SmartFilter } from "@/lib/types";

export async function ensureUserWithDefaultList(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "demo@focusflow.local",
      name: "Demo User",
      lists: {
        create: {
          name: DEFAULT_LIST_NAME,
          color: "#3B82F6",
        },
      },
    },
  });

  const existingList = await prisma.taskList.findFirst({
    where: { userId, name: DEFAULT_LIST_NAME },
  });

  if (existingList) {
    return existingList;
  }

  return prisma.taskList.create({
    data: {
      name: DEFAULT_LIST_NAME,
      color: "#3B82F6",
      userId,
    },
  });
}

export function buildTaskWhere(input: {
  userId: string;
  filter?: SmartFilter;
  listId?: string;
  search?: string;
  status?: "active" | "completed";
}) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const and: Prisma.TaskWhereInput[] = [];

  const where: Prisma.TaskWhereInput = {
    userId: input.userId,
  };

  if (input.listId) {
    where.listId = input.listId;
  }

  if (input.search) {
    and.push({
      OR: [
        { title: { contains: input.search, mode: "insensitive" } },
        { description: { contains: input.search, mode: "insensitive" } },
      ],
    });
  }

  if (input.status === "active") {
    where.isCompleted = false;
  }

  if (input.status === "completed") {
    where.isCompleted = true;
  }

  switch (input.filter) {
    case "myday":
      and.push({
        OR: [
        { isMyDay: true },
        { dueDate: { gte: todayStart, lte: todayEnd } },
        ],
      });
      break;
    case "important":
      where.isStarred = true;
      break;
    case "planned":
      where.dueDate = { not: null };
      break;
    case "completed":
      where.isCompleted = true;
      break;
    case "all":
    default:
      break;
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

export function buildTaskOrderBy(sort?: "createdAt" | "dueDate" | "updatedAt" | "completedAt", order?: "asc" | "desc") {
  if (!sort) {
    return [{ isCompleted: "asc" as const }, { updatedAt: "desc" as const }];
  }

  return [{ [sort]: order ?? "desc" } as Prisma.TaskOrderByWithRelationInput];
}

export async function getTaskSuggestions(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const recentThreshold = subDays(now, 3);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      isCompleted: false,
      OR: [
        { dueDate: { lt: todayStart } },
        { dueDate: { gte: todayStart, lte: todayEnd } },
        { isStarred: true },
        { updatedAt: { gte: recentThreshold } },
      ],
    },
    orderBy: [{ isStarred: "desc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    take: 8,
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    listId: task.listId,
    reason: task.isStarred
      ? "Task này được đánh dấu quan trọng"
      : task.dueDate && task.dueDate < todayStart
        ? "Task này đang quá hạn"
        : task.dueDate && task.dueDate <= todayEnd
          ? "Task này đến hạn hôm nay"
          : "Task này vừa được cập nhật gần đây",
  }));
}
