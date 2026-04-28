import {
  endOfDay,
  format,
  isPast,
  isToday,
  isTomorrow,
  startOfDay,
} from "date-fns";
import { vi } from "date-fns/locale";

export function getTodayBounds() {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

export function formatDateLabel(value?: string | Date | null) {
  if (!value) {
    return "Chưa đặt hạn";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (isToday(date)) {
    return "Hôm nay";
  }

  if (isTomorrow(date)) {
    return "Ngày mai";
  }

  return format(date, "dd/MM/yyyy", { locale: vi });
}

export function getPlannedGroupLabel(value?: string | Date | null) {
  if (!value) {
    return "Later";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (isPast(endOfDay(date)) && !isToday(date)) {
    return "Overdue";
  }

  if (isToday(date)) {
    return "Today";
  }

  if (isTomorrow(date)) {
    return "Tomorrow";
  }

  return "Later";
}
