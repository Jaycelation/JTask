import { addDays, setHours, setMinutes, subDays } from "date-fns";

import { apiError, apiSuccess } from "@/lib/api";
import { DEFAULT_LIST_NAME } from "@/lib/constants";
import { getCurrentUserId } from "@/lib/mock-user";
import { prisma } from "@/lib/prisma";
import { ensureUserWithDefaultList } from "@/lib/task-service";

export async function POST() {
  try {
    const userId = getCurrentUserId();
    const defaultList = await ensureUserWithDefaultList(userId);

    const existingTasks = await prisma.task.count({ where: { userId } });
    if (existingTasks > 0) {
      return apiError(400, "DEMO_ALREADY_EXISTS", "Workspace hiện đã có task. Hãy dùng demo trên database trống.");
    }

    const listSeeds = [
      { name: DEFAULT_LIST_NAME, color: "#3B82F6", id: defaultList.id },
      { name: "Cá nhân", color: "#0EA5E9" },
      { name: "Công việc", color: "#6366F1" },
      { name: "Học tập", color: "#14B8A6" },
    ];

    const createdLists = [defaultList];
    for (const listSeed of listSeeds.slice(1)) {
      const list = await prisma.taskList.create({
        data: {
          name: listSeed.name,
          color: listSeed.color,
          userId,
        },
      });
      createdLists.push(list);
    }

    const now = new Date();
    const todayMorning = setMinutes(setHours(new Date(now), 9), 0);
    const tonight = setMinutes(setHours(new Date(now), 19), 30);
    const tomorrowMorning = setMinutes(setHours(addDays(new Date(now), 1), 9), 0);
    const nextWeek = setMinutes(setHours(addDays(new Date(now), 5), 15), 0);
    const overdue = setMinutes(setHours(subDays(new Date(now), 1), 16), 0);

    const [defaultListRecord, personalList, workList, studyList] = createdLists;

    const taskSeeds = [
      {
        title: "Lên kế hoạch tuần",
        description: "Chốt 3 ưu tiên lớn cho tuần này và đưa vào My Day.",
        isMyDay: true,
        isStarred: true,
        dueDate: todayMorning,
        reminderAt: setMinutes(setHours(new Date(now), 8), 30),
        listId: defaultListRecord.id,
        subtasks: ["Rà lại backlog", "Chọn 3 việc ưu tiên"],
      },
      {
        title: "Đặt lịch khám sức khỏe",
        description: "Gọi điện và xác nhận khung giờ còn trống.",
        isMyDay: true,
        dueDate: tonight,
        reminderAt: setMinutes(setHours(new Date(now), 17), 30),
        listId: personalList.id,
        subtasks: ["Kiểm tra bảo hiểm", "Lưu lịch vào calendar"],
      },
      {
        title: "Chuẩn bị demo sprint",
        description: "Hoàn thiện các flow chính trước buổi review.",
        isStarred: true,
        dueDate: tomorrowMorning,
        reminderAt: setMinutes(setHours(new Date(now), 18), 0),
        listId: workList.id,
        subtasks: ["Kiểm tra bug blocker", "Cập nhật changelog", "Tập demo 10 phút"],
      },
      {
        title: "Hoàn tất bài đọc React",
        description: "Đọc phần về rendering và ghi chú ngắn.",
        dueDate: nextWeek,
        reminderAt: null,
        listId: studyList.id,
        subtasks: ["Đọc chương 1", "Viết note tóm tắt"],
      },
      {
        title: "Gửi email phản hồi khách hàng",
        description: "Task đang quá hạn để test nhóm Overdue.",
        dueDate: overdue,
        reminderAt: overdue,
        listId: workList.id,
        subtasks: ["Soạn nội dung", "Đính kèm tài liệu cập nhật"],
      },
      {
        title: "Dọn danh sách việc đã xong",
        description: "Minh họa cho completed state.",
        isCompleted: true,
        completedAt: subDays(new Date(now), 1),
        dueDate: subDays(new Date(now), 2),
        reminderAt: null,
        listId: defaultListRecord.id,
        subtasks: ["Đánh dấu task hoàn tất"],
      },
    ];

    let createdTasks = 0;
    let createdSubtasks = 0;

    for (const taskSeed of taskSeeds) {
      const task = await prisma.task.create({
        data: {
          title: taskSeed.title,
          description: taskSeed.description,
          isMyDay: taskSeed.isMyDay ?? false,
          isStarred: taskSeed.isStarred ?? false,
          isCompleted: taskSeed.isCompleted ?? false,
          completedAt: taskSeed.completedAt ?? null,
          dueDate: taskSeed.dueDate ?? null,
          reminderAt: taskSeed.reminderAt ?? null,
          listId: taskSeed.listId,
          userId,
        },
      });
      createdTasks += 1;

      if (taskSeed.subtasks?.length) {
        await prisma.subtask.createMany({
          data: taskSeed.subtasks.map((title) => ({
            title,
            taskId: task.id,
          })),
        });
        createdSubtasks += taskSeed.subtasks.length;
      }
    }

    return apiSuccess(
      {
        createdLists: createdLists.length,
        createdTasks,
        createdSubtasks,
      },
      { status: 201, message: "Đã tạo dữ liệu demo." },
    );
  } catch {
    return apiError(500, "DEMO_SEED_FAILED", "Không thể tạo dữ liệu demo.");
  }
}
