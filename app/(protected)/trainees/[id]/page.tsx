import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { isAdminRole, getUserPermissions } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";

export default async function TraineeWorkspacePage({
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

  const { trainee, summary, attendance, tasks, assessments, evaluations, materials } =
    workspace;

  return (
    <TraineeSectionShell
      title="Trainee Overview"
      subtitle="Manage the trainee lifecycle, activity tracking, and conversion readiness from one workspace."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Overview", href: `/trainees/${id}`, active: true },
        { label: "Attendance", href: `/trainees/${id}/attendance` },
        { label: "Tasks", href: `/trainees/${id}/tasks` },
        { label: "Assessments", href: `/trainees/${id}/assessments` },
        { label: "Evaluations", href: `/trainees/${id}/evaluations` },
        { label: "Training Materials", href: `/trainees/${id}/materials` },
        { label: "Documents", href: `/trainees/${id}/documents` },
      ]}
      summaryItems={[
        { label: "Training Progress", value: `${summary.trainingProgress}%`, tone: "cyan" },
        { label: "Attendance %", value: `${summary.attendancePercentage}%`, tone: "emerald" },
        { label: "Pending Tasks", value: `${summary.pendingTasks}`, tone: "amber" },
        { label: "Assessment Avg", value: `${summary.averageAssessmentScore}`, tone: "rose" },
      ]}
      actions={
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {!trainee.employeeId &&
          trainee.traineeStatus === "COMPLETED" &&
          trainee.evaluationRecommendation === "RECOMMENDED" ? (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href={`/employee-profiles/create?traineeId=${trainee.id}`}>
                Convert To Employee
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/employee-documents?applicantId=${trainee.applicantId}`}>
              Open Applicant Documents
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Training Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Batch</p>
              <p className="mt-2 font-medium text-slate-900">
                {trainee.trainingBatch || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Trainer</p>
              <p className="mt-2 font-medium text-slate-900">
                {trainee.trainerName || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Training End Date</p>
              <p className="mt-2 font-medium text-slate-900">
                {summary.trainingEndDate || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Recommendation</p>
              <p className="mt-2 font-medium text-slate-900">
                {summary.recommendation}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5 text-sm text-slate-600">
            <p>Status: {trainee.traineeStatus}</p>
            <p>Employee Link: {trainee.employeeCode || "Not converted"}</p>
            <p>Documents: {materials.length + assessments.length + attendance.length + tasks.length + evaluations.length} records tracked</p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/trainees/${id}/documents`}>Review Documents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </TraineeSectionShell>
  );
}
