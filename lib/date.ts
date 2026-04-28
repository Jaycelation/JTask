import {
  addHours,
  addDays,
  endOfDay,
  format,
  isPast,
  isToday,
  isTomorrow,
  setHours,
  setMinutes,
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
    return "Sau đó";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (isPast(endOfDay(date)) && !isToday(date)) {
    return "Quá hạn";
  }

  if (isToday(date)) {
    return "Hôm nay";
  }

  if (isTomorrow(date)) {
    return "Ngày mai";
  }

  return "Sau đó";
}

export function formatReminderLabel(value?: string | Date | null) {
  if (!value) {
    return "Chưa có nhắc nhở";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (isToday(date)) {
    return `Nhắc hôm nay, ${format(date, "HH:mm")}`;
  }

  if (isTomorrow(date)) {
    return `Nhắc ngày mai, ${format(date, "HH:mm")}`;
  }

  return `Nhắc ${format(date, "dd/MM HH:mm", { locale: vi })}`;
}

export function getReminderPresets() {
  const now = new Date();
  return [
    {
      label: "Sau 1 giờ",
      value: addHours(now, 1).toISOString(),
    },
    {
      label: "Tối nay 19:00",
      value: setMinutes(setHours(new Date(now), 19), 0).toISOString(),
    },
    {
      label: "Mai 09:00",
      value: setMinutes(setHours(addDays(new Date(now), 1), 9), 0).toISOString(),
    },
  ];
}
