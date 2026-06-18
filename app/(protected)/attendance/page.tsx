import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  FileSpreadsheet,
  LogIn,
} from "lucide-react";

import { AttendanceHubPanel } from "@/components/attendance/attendance-hub-panel";
import { Button } from "@/components/ui/button";
import {
  getAttendanceDashboard,
  getAttendanceOptions,
} from "@/lib/actions/attendance";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import {
  canManageAllAttendance,
  getRoutePermissions,
  getUserPermissions,
} from "@/lib/rbac";

export default async function AttendancePage() {
  const [permissions, user] = await Promise.all([
    getRoutePermissions("/attendance"),
    getUserPermissions(),
  ]);
  const isHrEmployee = await isCurrentEmployeeHr();

  if (!permissions.canView && !isHrEmployee) {
    redirect("/404");
  }

  if (!canManageAllAttendance(user?.role?.name) && !isHrEmployee) {
    redirect("/attendance/my");
  }

  const [dashboard, options] = await Promise.all([
    getAttendanceDashboard(),
    getAttendanceOptions(),
  ]);

  const participants = [
    ...options.employees.map((employee) => ({
      id: employee.id,
      name: employee.employeeName,
      code: employee.employeeCode,
      departmentId: employee.departmentId,
    })),
  ];

  const actionLinks = [
    permissions.canCreate
      ? {
          href: "/attendance/mark",
          label: "Mark Attendance",
          icon: LogIn,
          primary: true,
        }
      : null,
    {
      href: "/attendance/sheet",
      label: "Monthly Sheet",
      icon: FileSpreadsheet,
      primary: false,
    },
    {
      href: "/attendance/report",
      label: "Reports",
      icon: CalendarDays,
      primary: false,
    },
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: typeof LogIn;
    primary: boolean;
  }[];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Attendance Hub
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
              Attendance
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track daily attendance, review the current day, and move into the
              monthly grid or export reports without leaving the module.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {actionLinks.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={item.primary ? "default" : "outline"}
                  className={
                    item.primary
                      ? "bg-cyan-600 text-white hover:bg-cyan-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }
                >
                  <Link href={item.href}>
                    <item.icon />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Present
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {dashboard.summary.present}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Marked Today
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {dashboard.todayRecords.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Leaves
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {dashboard.summary.leaves}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Exceptions
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {dashboard.summary.absents + dashboard.summary.halfDays}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AttendanceHubPanel
        todayRecords={dashboard.todayRecords}
        departments={options.departments}
        participants={participants}
      />
    </div>
  );
}
