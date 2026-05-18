import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { getConfiguration } from "@/lib/actions/configuration";
import {
  getCurrentEmployeeProfileForPortal,
  isCurrentEmployeeManager,
} from "@/lib/employee-job-role";
import { getAccessibleRoutes } from "@/lib/rbac";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const config = await getConfiguration();
  const accessibleRoutes = await getAccessibleRoutes();
  const employeeProfile = await getCurrentEmployeeProfileForPortal();
  const isManager = await isCurrentEmployeeManager();

  const sidebarUser = {
    name:
      session.user.firstName ||
      session.user.username ||
      session.user.name ||
      "User",
    email: session.user.email || "user@example.com",
    avatar: "",
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar
        user={sidebarUser}
        role={session.user.role}
        jobRole={employeeProfile?.jobRole?.name || session.user.jobRole}
        isManager={isManager}
        config={config || undefined}
        accessibleRoutes={accessibleRoutes}
      />

      <SidebarInset className="flex h-screen flex-col overflow-hidden bg-transparent">
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,252,0.9))] px-4 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="glass-chip rounded-xl p-1.5 text-slate-700 shadow-sm">
                <SidebarTrigger />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-700/90">
                  HRMS Workspace
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  Clean navigation, faster access, better focus
                </p>
              </div>
            </div>

            
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-w-0 max-w-[1600px] flex-col gap-4 px-2 py-4 md:px-3">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
