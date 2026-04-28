import { addDays, addMonths, addWeeks, getDay } from "date-fns";

import type { RecurrenceDay, RecurrencePattern, TaskDto } from "@/lib/types";

const DAY_INDEX: Record<RecurrenceDay, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export function getNextRecurringDate(input: {
  baseDate: Date | null;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceDays: RecurrenceDay[];
}) {
  const { baseDate, recurrencePattern, recurrenceInterval, recurrenceDays } = input;
  if (!baseDate || recurrencePattern === "NONE") {
    return null;
  }

  switch (recurrencePattern) {
    case "DAILY":
      return addDays(baseDate, recurrenceInterval);
    case "WEEKLY": {
      if (!recurrenceDays.length) {
        return addWeeks(baseDate, recurrenceInterval);
      }

      const currentDow = getDay(baseDate);
      const sorted = [...recurrenceDays].sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]);
      const nextSameWeek = sorted.find((day) => DAY_INDEX[day] > currentDow);
      if (nextSameWeek) {
        return addDays(baseDate, DAY_INDEX[nextSameWeek] - currentDow);
      }

      return addDays(baseDate, 7 * recurrenceInterval - currentDow + DAY_INDEX[sorted[0]]);
    }
    case "MONTHLY":
      return addMonths(baseDate, recurrenceInterval);
    case "WEEKDAYS": {
      let next = addDays(baseDate, 1);
      while ([0, 6].includes(getDay(next))) {
        next = addDays(next, 1);
      }
      return next;
    }
    default:
      return null;
  }
}

export function buildNextRecurringTaskData(task: {
  title: string;
  description: string | null;
  isStarred: boolean;
  dueDate: Date | null;
  reminderAt: Date | null;
  listId: string;
  userId: string;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceDays: RecurrenceDay[];
  id: string;
}) {
  if (task.recurrencePattern === "NONE") {
    return null;
  }

  const nextDueDate = getNextRecurringDate({
    baseDate: task.dueDate,
    recurrencePattern: task.recurrencePattern,
    recurrenceInterval: task.recurrenceInterval,
    recurrenceDays: task.recurrenceDays,
  });

  const nextReminderAt = getNextRecurringDate({
    baseDate: task.reminderAt,
    recurrencePattern: task.recurrencePattern,
    recurrenceInterval: task.recurrenceInterval,
    recurrenceDays: task.recurrenceDays,
  });

  if (!nextDueDate && !nextReminderAt) {
    return null;
  }

  return {
    title: task.title,
    description: task.description,
    isCompleted: false,
    isStarred: task.isStarred,
    isMyDay: false,
    dueDate: nextDueDate,
    reminderAt: nextReminderAt,
    completedAt: null,
    recurrencePattern: task.recurrencePattern,
    recurrenceInterval: task.recurrenceInterval,
    recurrenceDays: task.recurrenceDays,
    recurringSourceId: task.id,
    listId: task.listId,
    userId: task.userId,
  };
}
