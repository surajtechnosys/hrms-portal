import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { auth } from "@/auth";

export default async function TraineeDashboardPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();

  const { trainee, summary, attendance, tasks, assessments, materials, evaluations } =
    workspace;

  return (
    <TraineeSectionShell
      title="Trainee Dashboard"
      subtitle="Track your training progress, work items, attendance, and learning materials in one place."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Dashboard", href: "/trainee-dashboard", active: true },
        { label: "Attendance", href: "/trainee-dashboard/attendance" },
        { label: "Tasks", href: "/trainee-dashboard/tasks" },
        { label: "Assessments", href: "/trainee-dashboard/assessments" },
        { label: "Evaluations", href: "/trainee-dashboard/evaluations" },
        { label: "Training Materials", href: "/trainee-dashboard/materials" },
        { label: "Documents", href: "/trainee-dashboard/documents" },
      ]}
      summaryItems={[
        { label: "Training Progress", value: `${summary.trainingProgress}%`, tone: "cyan" },
        { label: "Attendance %", value: `${summary.attendancePercentage}%`, tone: "emerald" },
        { label: "Pending Tasks", value: `${summary.pendingTasks}`, tone: "amber" },
        { label: "Assessment Avg", value: `${summary.averageAssessmentScore}`, tone: "rose" },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Progress Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Training End Date</p>
              <p className="mt-2 font-medium text-slate-900">
                {summary.trainingEndDate || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Trainer Feedback</p>
              <p className="mt-2 font-medium text-slate-900">
                {summary.trainerRemarks}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Attendance Records</p>
              <p className="mt-2 font-medium text-slate-900">{attendance.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Training Materials</p>
              <p className="mt-2 font-medium text-slate-900">{materials.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700">
              <Link href="/trainee-dashboard/attendance">Attendance Overview</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/trainee-dashboard/attendance/action">
                Check In / Check Out
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/trainee-dashboard/tasks">Open Tasks</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/trainee-dashboard/materials">Training Materials</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {task.status} · Due {task.dueDate || "-"}
                </p>
              </div>
            ))}
            {!tasks.length ? (
              <p className="text-sm text-slate-500">No tasks assigned yet.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Latest Assessment & Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-900">Assessments</p>
              <p className="mt-1">{assessments[0]?.assessmentName || "No assessment yet"}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Evaluation</p>
              <p className="mt-1">{evaluations[0]?.recommendation || "No evaluation yet"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TraineeSectionShell>
  );
}
