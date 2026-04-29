# FocusFlow Tasks

FocusFlow Tasks là ứng dụng web quản lý công việc cá nhân lấy cảm hứng từ Microsoft To Do, tập trung vào trải nghiệm `My Day`, thao tác nhanh với task, smart lists và giao diện hiện đại.

## Tổng quan

- Frontend: Next.js 15 App Router, React 19, Tailwind CSS
- Backend: Next.js Route Handlers
- Database: MongoDB + Prisma
- Validation: Zod
- UI feedback: Sonner toast
- Theme: Dark mode / light mode

## Tính năng hiện có

- CRUD task đầy đủ
- Smart lists: `My Day`, `Quan trọng`, `Đã lên kế hoạch`, `Tất cả`, `Đã hoàn thành`
- Custom lists với màu riêng
- Subtasks / công việc con
- Tìm kiếm task theo tiêu đề hoặc ghi chú
- Status filter chips
- Bulk actions cho nhiều task
- Reminder với preset nhanh và polling khi app đang mở
- Seed dữ liệu demo cho workspace trống
- Local session auth theo email
- Keyboard shortcuts cơ bản

## Trạng thái hiện tại

Phần chức năng cốt lõi của ứng dụng đã tương đối đầy đủ. Tuy nhiên repo hiện chưa ở trạng thái hoàn tất kỹ thuật:

- `Recurring tasks` mới được triển khai một phần
- Chưa có automated tests cho API chính
- `npm run build` và `npm run typecheck` hiện đang fail do phần recurring chưa đồng bộ xong giữa schema, Prisma client và route handlers

Nếu mục tiêu của bạn là tiếp tục phát triển, đây là nền tốt. Nếu mục tiêu là release ngay, repo vẫn cần thêm một vòng fix kỹ thuật.

## API hiện có

Tất cả API trả về format thống nhất:

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Auth

- `POST /api/auth/login`
  - Tạo hoặc đăng nhập user theo email, lưu cookie session local
- `GET /api/auth/session`
  - Lấy thông tin user hiện tại
- `DELETE /api/auth/session`
  - Đăng xuất

### Tasks

- `GET /api/tasks`
  - Query hỗ trợ: `filter`, `listId`, `search`, `status`, `sort`, `order`
- `POST /api/tasks`
  - Tạo task mới
- `POST /api/tasks/bulk`
  - Thao tác hàng loạt: `complete`, `uncomplete`, `star`, `unstar`, `myday`, `remove-myday`, `delete`
- `GET /api/tasks/:id`
  - Lấy chi tiết task kèm subtasks
- `PATCH /api/tasks/:id`
  - Cập nhật task
- `DELETE /api/tasks/:id`
  - Xóa task và subtasks liên quan
- `GET /api/tasks/suggestions`
  - Gợi ý task cho `My Day`
- `GET /api/tasks/:id/subtasks`
  - Lấy subtasks của task
- `POST /api/tasks/:id/subtasks`
  - Tạo subtask

### Task Lists

- `GET /api/lists`
  - Lấy danh sách task lists
- `POST /api/lists`
  - Tạo danh sách mới
- `PATCH /api/lists/:id`
  - Cập nhật tên hoặc màu danh sách
- `DELETE /api/lists/:id?mode=move-to-default|delete-tasks`
  - Xóa danh sách

### Subtasks

- `PATCH /api/subtasks/:id`
  - Cập nhật subtask
- `DELETE /api/subtasks/:id`
  - Xóa subtask

### Summary / Reminder / Demo

- `GET /api/summary`
  - Lấy số lượng cho smart lists và trạng thái workspace
- `GET /api/reminders/due`
  - Lấy các reminder đã đến hạn để app poll khi đang mở
- `POST /api/demo/seed`
  - Tạo dữ liệu demo nếu workspace hiện tại đang trống

## Routing chính

- `/`
- `/my-day`
- `/important`
- `/planned`
- `/all`
- `/completed`
- `/lists/:id`

## Hướng dẫn chạy dự án

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo file môi trường

Tạo file `.env` từ `.env.example`:

```env
DATABASE_URL="mongodb://127.0.0.1:27017/focusflow"
AUTH_SECRET="replace-with-a-long-random-secret"
```

### 3. Đồng bộ schema Prisma với MongoDB

```bash
npx prisma generate
npx prisma db push
```

### 4. Chạy dev server

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

## Lệnh kiểm tra hữu ích

```bash
npm run typecheck
npm run build
```

Lưu ý: tại thời điểm cập nhật README này, hai lệnh trên chưa pass do phần recurring tasks còn dở.

## Luồng sử dụng nhanh

1. Mở app và đăng nhập bằng email.
2. Nếu workspace trống, tạo task đầu tiên hoặc bấm `Tạo dữ liệu demo`.
3. Dùng `/` để focus ô tìm kiếm.
4. Dùng `n` để focus ô thêm task nhanh.
5. Click vào task để mở panel chi tiết.
6. Dùng `s` để toggle sao và `m` để toggle `My Day` cho task đang chọn.

## Hạn chế hiện tại

- Recurring tasks chưa hoàn thiện end-to-end
- Chưa có automated tests cho API chính
- Reminder mới hoạt động tốt khi app đang mở
- Vẫn còn một số chỗ tiếng Việt bị lỗi encoding trong codebase cũ
