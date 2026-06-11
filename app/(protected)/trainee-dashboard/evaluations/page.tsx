import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";

export default async function TraineeEvaluationsPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();
  const { trainee, evaluations } = workspace;

  return (
    <TraineeSectionShell
      title="Evaluations"
      subtitle="Track trainer evaluations, recommendations, and performance notes."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Dashboard", href: "/trainee-dashboard" },
        { label: "Attendance", href: "/trainee-dashboard/attendance" },
        { label: "Tasks", href: "/trainee-dashboard/tasks" },
        { label: "Assessments", href: "/trainee-dashboard/assessments" },
        { label: "Evaluations", href: "/trainee-dashboard/evaluations", active: true },
        { label: "Training Materials", href: "/trainee-dashboard/materials" },
        { label: "Documents", href: "/trainee-dashboard/documents" },
      ]}
      summaryItems={[
        { label: "Evaluations", value: `${evaluations.length}`, tone: "cyan" },
        { label: "Recommendation", value: workspace.summary.recommendation, tone: "emerald" },
        { label: "Training Progress", value: `${workspace.summary.trainingProgress}%`, tone: "amber" },
        { label: "Attendance %", value: `${workspace.summary.attendancePercentage}%`, tone: "rose" },
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
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">
                    Evaluation on {new Date(evaluation.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-sm text-slate-500">{evaluation.trainerRemarks || "No remarks"}</p>
                </div>
                <Badge variant="outline">{evaluation.recommendation}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                <p>Technical: {evaluation.technicalSkills}/10</p>
                <p>Communication: {evaluation.communication}/10</p>
                <p>Teamwork: {evaluation.teamwork}/10</p>
              </div>
            </div>
          ))}
          {!evaluations.length ? (
            <p className="text-sm text-slate-500">No evaluations available yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
