import { ReactNode } from "react";
import { Home, Inbox, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { NavLink } from "@/components/ui/nav-link";
import { auth } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";
import { BatchAnalyzeButton } from "@/components/feedback/batch-analyze-button";

export default async function DashboardShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const role = (session?.user as { role?: string } | undefined)?.role ?? "MEMBER";

  return (
    <div className="min-h-screen flex bg-muted dark:bg-[#020817]">
      {/* Sidebar */}
      <aside className="w-64 bg-background dark:bg-[#020817] border-r border-border p-6 space-y-4">
        <h2 className="text-xl font-bold tracking-tight">FeedbackFlow</h2>

        <nav className="space-y-2 text-sm font-medium">
          <NavLink href="/dashboard" icon={<Home size={16} />}>
            Dashboard
          </NavLink>

          <NavLink href="/feedback" icon={<Inbox size={16} />}>
            Feedback
          </NavLink>

          <NavLink href="/account" icon={<User size={16} />}>
            Account
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 flex justify-end items-center gap-4 px-6 border-b bg-background/80 backdrop-blur-sm dark:border-gray-800">
          {/* Left: current user info */}
          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            {email && (
              <>
                <span className="font-medium text-foreground">
                  {email}
                </span>
                <span
                  className={
                    role === "ADMIN"
                      ? "px-2 py-0.5 rounded-full bg-purple-600/15 text-purple-500 text-[10px] font-semibold uppercase tracking-wide"
                      : "px-2 py-0.5 rounded-full bg-slate-600/10 text-slate-500 text-[10px] font-semibold uppercase tracking-wide"
                  }
                >
                  {role}
                </span>
              </>
            )}
          </div>

          {/* Right: theme + logout */}
          <div className="flex items-center gap-4">
            {session?.user?.role === "ADMIN" && <BatchAnalyzeButton />}
            <ModeToggle />
            <LogoutButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 bg-background/70 dark:bg-background">{children}</main>
      </div>
    </div>
  );
}
