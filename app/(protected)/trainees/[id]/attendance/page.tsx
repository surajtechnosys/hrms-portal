import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { getUserPermissions, isAdminRole } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";

export default async function TraineeAttendanceWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, getUserPermissions()]);
  const isHr = await isCurrentEmployeeHr();

  if (!user || (!isHr && !isAdminRole(user.role?.name))) {
    redirect("/404");
  }

  const workspace = await getTraineeWorkspaceData(id);
  if (!workspace) {
    notFound();
  }

  const { trainee, attendance } = workspace;

  return (
    <TraineeSectionShell
      title="Attendance"
      subtitle="Review trainee attendance history, lateness, working hours, and remarks."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Overview", href: `/trainees/${id}` },
        { label: "Attendance", href: `/trainees/${id}/attendance`, active: true },
        { label: "Tasks", href: `/trainees/${id}/tasks` },
        { label: "Assessments", href: `/trainees/${id}/assessments` },
        { label: "Evaluations", href: `/trainees/${id}/evaluations` },
        { label: "Training Materials", href: `/trainees/${id}/materials` },
        { label: "Documents", href: `/trainees/${id}/documents` },
      ]}
      summaryItems={[
        { label: "Records", value: `${attendance.length}`, tone: "cyan" },
        { label: "Present", value: `${attendance.filter((item) => item.status === "PRESENT").length}`, tone: "emerald" },
        { label: "Half Day", value: `${attendance.filter((item) => item.status === "HALF_DAY").length}`, tone: "amber" },
        { label: "Leave/Absent", value: `${attendance.filter((item) => item.status === "LEAVE" || item.status === "ABSENT").length}`, tone: "rose" },
      ]}
    >
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Check In</th>
                  <th className="px-3 py-3">Check Out</th>
                  <th className="px-3 py-3">Hours</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, index) => (
                  <tr key={record.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                    <td className="px-3 py-3">{record.date}</td>
                    <td className="px-3 py-3">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="px-3 py-3">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="px-3 py-3">{record.workingHours?.toFixed(2) ?? "0.00"}</td>
                    <td className="px-3 py-3">
                      <Badge variant="outline">{record.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{record.remarks || "-"}</td>
                  </tr>
                ))}
                {!attendance.length ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                      No attendance records found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
