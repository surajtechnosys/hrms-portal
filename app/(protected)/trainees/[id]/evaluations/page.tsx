import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { getUserPermissions, isAdminRole } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";

export default async function TraineeEvaluationsWorkspacePage({
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

  const { trainee, evaluations } = workspace;

  return (
    <TraineeSectionShell
      title="Evaluations"
      subtitle="Review trainer evaluation history and recommendations."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Overview", href: `/trainees/${id}` },
        { label: "Attendance", href: `/trainees/${id}/attendance` },
        { label: "Tasks", href: `/trainees/${id}/tasks` },
        { label: "Assessments", href: `/trainees/${id}/assessments` },
        { label: "Evaluations", href: `/trainees/${id}/evaluations`, active: true },
        { label: "Training Materials", href: `/trainees/${id}/materials` },
        { label: "Documents", href: `/trainees/${id}/documents` },
      ]}
      summaryItems={[
        { label: "Evaluations", value: `${evaluations.length}`, tone: "cyan" },
        { label: "Recommendation", value: workspace.summary.recommendation, tone: "emerald" },
        { label: "Trainer Notes", value: workspace.summary.trainerRemarks, tone: "amber" },
        { label: "Progress", value: `${workspace.summary.trainingProgress}%`, tone: "rose" },
      ]}
    >
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Evaluation History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(evaluation.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{evaluation.trainerRemarks || "No remarks"}</p>
                </div>
                <Badge variant="outline">{evaluation.recommendation}</Badge>
              </div>
            </div>
          ))}
          {!evaluations.length ? <p className="text-sm text-slate-500">No evaluations yet.</p> : null}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
