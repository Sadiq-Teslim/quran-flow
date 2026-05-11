import { BottomNav } from "@/components/nav/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col pb-20">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
