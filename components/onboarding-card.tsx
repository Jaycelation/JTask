import { Sparkles, Target, WandSparkles } from "lucide-react";

type OnboardingCardProps = {
  onStart: () => void;
  onSeedDemo: () => void;
  seeding?: boolean;
};

export function OnboardingCard({ onStart, onSeedDemo, seeding }: OnboardingCardProps) {
  return (
    <div className="glass rounded-[2rem] p-6">
      <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-2xl font-semibold">Bắt đầu hệ thống công việc của bạn</h3>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        FocusFlow đã sẵn sàng. Hãy tạo task đầu tiên, gom việc vào My Day và dùng smart lists để giữ nhịp làm việc gọn hơn.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-background/40 p-4">
          <Target className="mb-3 h-5 w-5 text-primary" />
          <h4 className="font-medium">My Day</h4>
          <p className="mt-1 text-sm text-muted-foreground">Kéo những việc cần tập trung hôm nay vào một chỗ.</p>
        </div>
        <div className="rounded-2xl border bg-background/40 p-4">
          <WandSparkles className="mb-3 h-5 w-5 text-primary" />
          <h4 className="font-medium">Quick Capture</h4>
          <p className="mt-1 text-sm text-muted-foreground">Nhập nhanh bằng Enter để không bị ngắt mạch suy nghĩ.</p>
        </div>
        <div className="rounded-2xl border bg-background/40 p-4">
          <Sparkles className="mb-3 h-5 w-5 text-primary" />
          <h4 className="font-medium">Smart Lists</h4>
          <p className="mt-1 text-sm text-muted-foreground">Quan trọng, Đã lên kế hoạch và Đã hoàn thành luôn tự gom đúng ngữ cảnh.</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStart}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-95"
        >
          Tạo task đầu tiên
        </button>
        <button
          type="button"
          onClick={onSeedDemo}
          disabled={seeding}
          className="rounded-2xl border border-input bg-background/70 px-5 py-3 text-sm font-medium transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {seeding ? "Đang tạo demo..." : "Tạo dữ liệu demo"}
        </button>
      </div>
    </div>
  );
}
