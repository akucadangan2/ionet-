// app/(dashboard)/layout.tsx
import TopNav from "@/components/TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="p-6 flex-1">{children}</main>
    </div>
  );
}