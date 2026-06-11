import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { getUserPermissions, isAdminRole } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";

export default async function TraineeAssessmentsWorkspacePage({
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

  const { trainee, assessments } = workspace;

  return (
    <TraineeSectionShell
      title="Assessments"
      subtitle="Review trainee assessment history and score trends."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Overview", href: `/trainees/${id}` },
        { label: "Attendance", href: `/trainees/${id}/attendance` },
        { label: "Tasks", href: `/trainees/${id}/tasks` },
        { label: "Assessments", href: `/trainees/${id}/assessments`, active: true },
        { label: "Evaluations", href: `/trainees/${id}/evaluations` },
        { label: "Training Materials", href: `/trainees/${id}/materials` },
        { label: "Documents", href: `/trainees/${id}/documents` },
      ]}
      summaryItems={[
        { label: "Assessments", value: `${assessments.length}`, tone: "cyan" },
        { label: "Average", value: `${workspace.summary.averageAssessmentScore}`, tone: "emerald" },
        { label: "Latest", value: assessments[0]?.assessmentName || "-", tone: "amber" },
        { label: "Score", value: `${assessments[0]?.score ?? 0}`, tone: "rose" },
      ]}
    >
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{assessment.assessmentName}</p>
                  <p className="mt-1 text-sm text-slate-500">{assessment.remarks || "No remarks"}</p>
                </div>
                <Badge variant="outline">
                  {assessment.score}/{assessment.maxScore}
                </Badge>
              </div>
            </div>
          ))}
          {!assessments.length ? <p className="text-sm text-slate-500">No assessments yet.</p> : null}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
