import { ModeratorHeader } from "@/components/layout/ModeratorHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth requiredRole="moderator">
      <div className="flex min-h-screen flex-col">
        <ModeratorHeader />
        <main className="flex-1 w-full">{children}</main>
      </div>
    </RequireAuth>
  );
}
