import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const AUTH_COOKIE_NAME = "focusflow_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function getAuthSecret() {
  return process.env.AUTH_SECRET || "focusflow-dev-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

export function createSessionToken(userId: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function verifySessionToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, expiresAtRaw, signature] = decoded.split(".");
    if (!userId || !expiresAtRaw || !signature) {
      return null;
    }

    const payload = `${userId}.${expiresAtRaw}`;
    const expected = sign(payload);
    const matches = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!matches) {
      return null;
    }

    if (Number(expiresAtRaw) < Date.now()) {
      return null;
    }

    return { userId, expiresAt: Number(expiresAtRaw) };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function setAuthCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
