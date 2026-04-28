import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "ID không hợp lệ.");

export const taskFilterSchema = z.enum(["myday", "important", "planned", "completed", "all"]).optional();
export const sortSchema = z.enum(["createdAt", "dueDate", "updatedAt", "completedAt"]).optional();
export const orderSchema = z.enum(["asc", "desc"]).optional();
export const statusSchema = z.enum(["active", "completed"]).optional();

const optionalDate = z
  .union([z.string().datetime(), z.null()])
  .optional()
  .transform((value) => (value ? new Date(value) : value === null ? null : undefined));

export const taskQuerySchema = z.object({
  filter: taskFilterSchema,
  listId: objectIdSchema.optional(),
  search: z.string().trim().optional(),
  status: statusSchema,
  sort: sortSchema,
  order: orderSchema,
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề task là bắt buộc."),
  description: z.string().trim().optional().nullable(),
  listId: objectIdSchema.optional(),
  isMyDay: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  dueDate: optionalDate,
  reminderAt: optionalDate,
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    isCompleted: z.boolean().optional(),
    isStarred: z.boolean().optional(),
    isMyDay: z.boolean().optional(),
    dueDate: optionalDate,
    reminderAt: optionalDate,
    listId: objectIdSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Ít nhất một trường cần được cập nhật.",
  });

export const createListSchema = z.object({
  name: z.string().trim().min(1, "Tên danh sách là bắt buộc."),
  color: z.string().trim().optional().nullable(),
});

export const updateListSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    color: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Ít nhất một trường cần được cập nhật.",
  });

export const deleteListModeSchema = z.enum(["move-to-default", "delete-tasks"]).optional();

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề subtask là bắt buộc."),
});

export const updateSubtaskSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    isCompleted: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Ít nhất một trường cần được cập nhật.",
  });
