// app/(dashboard)/layout.tsx
import TopNav from "@/components/TopNav";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthGuard />
      <div id="dashboard-topnav">
        <TopNav />
      </div>
      <main className="p-6 flex-1">{children}</main>
    </div>
  );
}