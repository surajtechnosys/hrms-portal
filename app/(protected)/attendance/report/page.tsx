import { redirect } from "next/navigation";

import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import {
  getAttendanceOptions,
  getMonthlyAttendance,
} from "@/lib/actions/attendance";
import {
  canManageAllAttendance,
  getRoutePermissions,
  getUserPermissions,
} from "@/lib/rbac";

export default async function AttendanceReportPage() {
  const permissions = await getRoutePermissions("/attendance");

  if (!permissions.canView) {
    redirect("/404");
  }

  const user = await getUserPermissions();
  if (!canManageAllAttendance(user?.role?.name)) {
    redirect("/404");
  }

  const canFilterEmployees = user?.role?.name?.toLowerCase() !== "employee";
  const [sheet, options] = await Promise.all([
    getMonthlyAttendance(),
    getAttendanceOptions(),
  ]);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
        <div className="grid gap-4 p-5 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Reporting
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
              Attendance Report
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Filter attendance data for employees and trainees, then export the current view as CSV.
            </p>
          </div>
        </div>
      </section>
      <AttendanceSheet
        initialSheet={sheet}
        employees={options.employees}
        trainees={options.trainees}
        departments={options.departments}
        canFilterEmployees={canFilterEmployees}
        showExport
      />
    </div>
  );
}
