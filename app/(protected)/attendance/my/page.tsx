import { redirect } from "next/navigation";

import { AttendanceMarkPanel } from "@/components/attendance/attendance-mark-panel";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import {
  getAttendanceDashboard,
  getAttendanceOptions,
  getMonthlyAttendance,
} from "@/lib/actions/attendance";
import {
  getRoutePermissions,
  getUserPermissions,
  isEmployeeRole,
} from "@/lib/rbac";

export default async function MyAttendancePage() {
  const [permissions, user] = await Promise.all([
    getRoutePermissions("/attendance/my"),
    getUserPermissions(),
  ]);

  if (!permissions.canView) {
    redirect("/404");
  }

  if (!isEmployeeRole(user?.role?.name)) {
    redirect("/attendance");
  }

  const [dashboard, options] = await Promise.all([
    getAttendanceDashboard(),
    getAttendanceOptions(),
  ]);
  const participants = options.employees.map((employee) => ({
    id: employee.id,
    name: employee.employeeName,
    code: employee.employeeCode,
    type: "employee" as const,
  }));
  const participantId =
    dashboard.currentParticipantId || participants.at(0)?.id || "";
  const sheet = await getMonthlyAttendance({
    participantId,
    type: "employees",
  });
  const todayRecord = dashboard.todayRecords.find(
    (record) => record.participantId === participantId && record.type === "employee",
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Self Service
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
              My Attendance
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Check in, check out, and keep an eye on this month&apos;s record
              from one place.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Today
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {todayRecord?.status?.replaceAll("_", " ") || "Not marked"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Check In
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {todayRecord?.checkIn
                  ? new Date(todayRecord.checkIn).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Hours
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {todayRecord?.workingHours?.toFixed(2) ?? "0.00"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AttendanceMarkPanel
        participantId={participantId}
        participants={participants}
        todayRecord={todayRecord}
        canCreate={permissions.canCreate}
      />

      <AttendanceSheet
        initialSheet={sheet}
        employees={options.employees}
        trainees={options.trainees}
        departments={options.departments}
        canFilterEmployees={false}
        title="My Monthly Records"
        compact
      />
    </div>
  );
}
