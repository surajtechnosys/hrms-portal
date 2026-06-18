import { redirect } from "next/navigation";

import { AttendanceMarkPanel } from "@/components/attendance/attendance-mark-panel";
import {
  getAttendanceOptions,
  getAttendanceDashboard,
} from "@/lib/actions/attendance";
import {
  canManageAllAttendance,
  getRoutePermissions,
  getUserPermissions,
} from "@/lib/rbac";

export default async function MarkAttendancePage() {
  const permissions = await getRoutePermissions("/attendance");

  if (!permissions.canCreate) {
    redirect("/404");
  }

  const user = await getUserPermissions();
  if (!canManageAllAttendance(user?.role?.name)) {
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
    })),
  ];
  const participantId =
    dashboard.currentParticipantId || participants[0]?.id || "";
  const todayRecord = dashboard.todayRecords.find(
    (record) => record.participantId === participantId,
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
        <div className="grid gap-4 p-5 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Attendance Action
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
              Mark Attendance
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Record check-in and check-out for employees from the shared
              attendance hub.
            </p>
          </div>
        </div>
      </section>
      <AttendanceMarkPanel
        participantId={participantId}
        participants={participants}
        todayRecord={todayRecord}
        todayRecords={dashboard.todayRecords}
        canCreate={permissions.canCreate}
        canChooseParticipant
      />
    </div>
  );
}
