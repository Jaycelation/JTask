import { NextResponse } from "next/server";

import type { ApiError, ApiSuccess } from "@/lib/types";

export function apiSuccess<T>(data: T, init?: { status?: number; message?: string; total?: number }) {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    ...(init?.message ? { message: init.message } : {}),
    ...(typeof init?.total === "number" ? { total: init.total } : {}),
  };

  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function apiError(status: number, code: string, message: string) {
  const body: ApiError = {
    success: false,
    error: {
      code,
      message,
    },
  };

  return NextResponse.json(body, { status });
}
