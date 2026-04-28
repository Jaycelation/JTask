"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthScreenProps = {
  loading?: boolean;
  onSubmit: (payload: { email: string; name?: string }) => Promise<void>;
};

export function AuthScreen({ loading, onSubmit }: AuthScreenProps) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");

  async function handleSubmit() {
    if (!email.trim()) return;
    await onSubmit({ email: email.trim(), name: name.trim() || undefined });
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center justify-center">
        <div className="glass w-full max-w-xl rounded-[2rem] p-8">
          <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold">Đăng nhập vào FocusFlow Tasks</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tạo hoặc mở workspace cá nhân bằng email. Phiên đăng nhập sẽ được lưu trong trình duyệt hiện tại.
          </p>
          <div className="mt-6 space-y-4">
            <Input
              type="email"
              placeholder="email@cuaban.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
            />
            <Input
              placeholder="Tên hiển thị (tùy chọn)"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
            />
            <Button className="w-full" onClick={() => void handleSubmit()} disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Tiếp tục"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
