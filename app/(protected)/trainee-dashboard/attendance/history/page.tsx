import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { TraineeAttendanceNav } from "@/components/trainees/trainee-attendance-nav";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";

function statusClass(status: string) {
  if (status === "PRESENT") return "bg-emerald-100 text-emerald-700";
  if (status === "ABSENT") return "bg-rose-100 text-rose-700";
  if (status === "LEAVE") return "bg-amber-100 text-amber-700";
  if (status === "HALF_DAY") return "bg-sky-100 text-sky-700";
  return "bg-violet-100 text-violet-700";
}

export default async function TraineeAttendanceHistoryPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();
  const { trainee, attendance, summary } = workspace;

  return (
    <TraineeSectionShell
      title="Attendance"
      subtitle="Review your attendance history, timestamps, working hours, and remarks."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Dashboard", href: "/trainee-dashboard" },
        { label: "Attendance", href: "/trainee-dashboard/attendance", active: true },
        { label: "Tasks", href: "/trainee-dashboard/tasks" },
        { label: "Assessments", href: "/trainee-dashboard/assessments" },
        { label: "Evaluations", href: "/trainee-dashboard/evaluations" },
        { label: "Training Materials", href: "/trainee-dashboard/materials" },
        { label: "Documents", href: "/trainee-dashboard/documents" },
      ]}
      summaryItems={[
        { label: "Attendance %", value: `${summary.attendancePercentage}%`, tone: "emerald" },
        { label: "Records", value: `${attendance.length}`, tone: "cyan" },
        {
          label: "Present",
          value: `${attendance.filter((item) => item.status === "PRESENT").length}`,
          tone: "amber",
        },
        {
          label: "Leave/Absent",
          value: `${attendance.filter((item) => item.status === "LEAVE" || item.status === "ABSENT").length}`,
          tone: "rose",
        },
      ]}
    >
      <div className="space-y-5">
        <TraineeAttendanceNav active="history" />

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
                    <tr
                      key={record.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    >
                      <td className="px-3 py-3">{record.date}</td>
                      <td className="px-3 py-3">
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-3 py-3">
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-3 py-3">
                        {record.workingHours?.toFixed(2) ?? "0.00"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={statusClass(record.status)}>
                          {record.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {record.remarks || "-"}
                      </td>
                    </tr>
                  ))}
                  {!attendance.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-10 text-center text-slate-500"
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TraineeSectionShell>
  );
}
