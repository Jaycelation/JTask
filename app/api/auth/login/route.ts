import { NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { apiError, apiSuccess } from "@/lib/api";
import { ensureUserWithDefaultList } from "@/lib/task-service";
import { prisma } from "@/lib/prisma";
import { setAuthCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = loginSchema.parse(json);

    const user = await prisma.user.upsert({
      where: { email: body.email.toLowerCase() },
      update: {
        ...(body.name ? { name: body.name } : {}),
      },
      create: {
        email: body.email.toLowerCase(),
        name: body.name || body.email.split("@")[0],
      },
    });

    await ensureUserWithDefaultList(user.id);
    await setAuthCookie(user.id);

    return apiSuccess(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { message: "Đăng nhập thành công." },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
    }

    return apiError(500, "LOGIN_FAILED", "Không thể đăng nhập.");
  }
}
