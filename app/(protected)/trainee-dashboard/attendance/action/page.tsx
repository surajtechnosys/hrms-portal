import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AttendanceMarkPanel } from "@/components/attendance/attendance-mark-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { TraineeAttendanceNav } from "@/components/trainees/trainee-attendance-nav";
import {
  getAttendanceDashboard,
} from "@/lib/actions/attendance";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";

export default async function TraineeAttendanceActionPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const [workspace, dashboard] = await Promise.all([
    getCurrentTraineeWorkspaceData(),
    getAttendanceDashboard(),
  ]);

  const { trainee, summary } = workspace;
  const traineeId = trainee.id ?? "";
  const participant = {
    id: traineeId,
    name: trainee.fullName ?? "",
    code: trainee.traineeCode ?? "",
    type: "trainee" as const,
  };
  const todayRecord = dashboard.todayRecords.find(
    (record) =>
      record.participantId === participant.id && record.type === participant.type,
  );

  return (
    <TraineeSectionShell
      title="Attendance"
      subtitle="Check in, check out, and add attendance remarks directly from your trainee workspace."
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
        { label: "Today", value: todayRecord?.status?.replaceAll("_", " ") || "Ready", tone: "cyan" },
        {
          label: "Check In",
          value: todayRecord?.checkIn
            ? new Date(todayRecord.checkIn).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--:--",
          tone: "amber",
        },
        {
          label: "Hours",
          value: todayRecord?.workingHours?.toFixed(2) ?? "0.00",
          tone: "rose",
        },
      ]}
    >
      <div className="space-y-5">
        <TraineeAttendanceNav active="action" />

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Attendance Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Today</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {todayRecord?.status?.replaceAll("_", " ") || "Not marked"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Check In</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {todayRecord?.checkIn
                    ? new Date(todayRecord.checkIn).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Hours</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {todayRecord?.workingHours?.toFixed(2) ?? "0.00"}
                </p>
              </div>
              <div className="sm:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Remarks</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {todayRecord?.remarks || "No remarks added yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Self-Service Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-sm text-slate-600">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="font-medium text-cyan-900">Unified attendance flow</p>
                <p className="mt-1 leading-6">
                  The same attendance endpoint records your check-in and check-out,
                  just like the employee attendance hub.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">Linked trainee profile</p>
                <p className="mt-1 leading-6">
                  {participant.name} ({participant.code})
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">Records loaded</p>
                <p className="mt-1 leading-6">{dashboard.todayRecords.length} record(s) for today</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">Participant type</p>
                <Badge className="mt-2 bg-cyan-100 text-cyan-700">Trainee</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <AttendanceMarkPanel
          participantId={participant.id}
          participants={[participant]}
          todayRecord={todayRecord}
          todayRecords={dashboard.todayRecords}
          canCreate={true}
          canChooseParticipant={false}
        />
      </div>
    </TraineeSectionShell>
  );
}
