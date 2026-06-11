import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { TraineeAttendanceNav } from "@/components/trainees/trainee-attendance-nav";
import {
  getMonthlyAttendance,
} from "@/lib/actions/attendance";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";

export default async function TraineeAttendanceSheetPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();
  const { trainee, summary } = workspace;

  const sheet = await getMonthlyAttendance({
    participantId: trainee.id,
    type: "trainees",
  });
  const row = sheet.rows[0];
  const traineeId = trainee.id ?? "";

  return (
    <TraineeSectionShell
      title="Attendance"
      subtitle="Review your monthly attendance sheet with the same layout used across the attendance module."
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
        { label: "Present", value: `${row?.totals.present ?? 0}`, tone: "cyan" },
        { label: "Leave", value: `${row?.totals.leaves ?? 0}`, tone: "amber" },
        { label: "Absent", value: `${row?.totals.absents ?? 0}`, tone: "rose" },
      ]}
    >
      <div className="space-y-5">
        <TraineeAttendanceNav active="sheet" />

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Monthly Sheet</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <AttendanceSheet
              initialSheet={sheet}
              employees={[]}
              trainees={[
                {
                  id: traineeId,
                  fullName: trainee.fullName ?? "",
                  traineeCode: trainee.traineeCode ?? "",
                  type: "trainee",
                  departmentId: trainee.departmentId || "",
                },
              ]}
              departments={
                trainee.departmentId
                  ? [{ id: trainee.departmentId, name: "-" }]
                  : []
              }
              canFilterEmployees={false}
              showExport
              title="My Monthly Attendance Sheet"
            />
          </CardContent>
        </Card>
      </div>
    </TraineeSectionShell>
  );
}
