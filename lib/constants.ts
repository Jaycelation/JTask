export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEFAULT_LIST_NAME = "Tasks";

export const SMART_LISTS = [
  { key: "my-day", label: "My Day", icon: "SunMedium" },
  { key: "important", label: "Quan trọng", icon: "Star" },
  { key: "planned", label: "Đã lên kế hoạch", icon: "CalendarRange" },
  { key: "all", label: "Tất cả", icon: "ListTodo" },
  { key: "completed", label: "Đã hoàn thành", icon: "CheckCheck" },
] as const;

export type SmartListKey = (typeof SMART_LISTS)[number]["key"];
