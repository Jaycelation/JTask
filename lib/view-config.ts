import type { SmartFilter } from "@/lib/types";

export type FocusView =
  | { type: "smart"; key: "my-day" | "important" | "planned" | "all" | "completed" }
  | { type: "list"; listId: string };

export function getViewQuery(view: FocusView): { filter?: SmartFilter; listId?: string } {
  if (view.type === "list") {
    return { filter: "all", listId: view.listId };
  }

  return {
    filter:
      view.key === "my-day"
        ? "myday"
        : view.key === "important"
          ? "important"
          : view.key === "planned"
            ? "planned"
            : view.key === "completed"
              ? "completed"
              : "all",
  };
}

export function getViewMeta(view: FocusView) {
  if (view.type === "list") {
    return {
      title: "Danh sách",
      subtitle: "Quản lý task trong danh sách tùy chỉnh của bạn.",
      viewKey: "list" as const,
      emptyTitle: "Danh sách này đang trống.",
      emptyDescription: "Hãy thêm một task để bắt đầu làm việc.",
    };
  }

  switch (view.key) {
    case "my-day":
      return {
        title: "My Day",
        subtitle: "Tập trung vào những việc quan trọng nhất hôm nay.",
        viewKey: view.key,
        emptyTitle: "Hôm nay chưa có việc nào.",
        emptyDescription: "Hãy thêm một task để bắt đầu.",
      };
    case "important":
      return {
        title: "Quan trọng",
        subtitle: "Những task cần ưu tiên xử lý trước.",
        viewKey: view.key,
        emptyTitle: "Không có task quan trọng nào.",
        emptyDescription: "Đánh dấu sao cho các task cần tập trung.",
      };
    case "planned":
      return {
        title: "Đã lên kế hoạch",
        subtitle: "Theo dõi các task đã có lịch và hạn chót.",
        viewKey: view.key,
        emptyTitle: "Chưa có task nào được lên kế hoạch.",
        emptyDescription: "Hãy đặt hạn cho task để nó xuất hiện ở đây.",
      };
    case "completed":
      return {
        title: "Đã hoàn thành",
        subtitle: "Nhìn lại các việc bạn đã hoàn thành.",
        viewKey: view.key,
        emptyTitle: "Bạn chưa hoàn thành task nào.",
        emptyDescription: "Các task đã hoàn tất sẽ xuất hiện tại đây.",
      };
    case "all":
    default:
      return {
        title: "Tất cả task",
        subtitle: "Toàn bộ công việc của bạn ở một nơi.",
        viewKey: view.key,
        emptyTitle: "Chưa có task nào.",
        emptyDescription: "Hãy tạo task đầu tiên để bắt đầu hệ thống của bạn.",
      };
  }
}
