import { AdminHeader } from "@/components/layout/AdminHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth requiredRole="admin">
      <div className="flex min-h-screen flex-col">
        <AdminHeader />
        <main className="flex-1 w-full">{children}</main>
      </div>
    </RequireAuth>
  );
}
