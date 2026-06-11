import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";

export default async function TraineeAssessmentsPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();
  const { trainee, assessments } = workspace;

  return (
    <TraineeSectionShell
      title="Assessments"
      subtitle="View your assessment history and trainer remarks."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Dashboard", href: "/trainee-dashboard" },
        { label: "Attendance", href: "/trainee-dashboard/attendance" },
        { label: "Tasks", href: "/trainee-dashboard/tasks" },
        { label: "Assessments", href: "/trainee-dashboard/assessments", active: true },
        { label: "Evaluations", href: "/trainee-dashboard/evaluations" },
        { label: "Training Materials", href: "/trainee-dashboard/materials" },
        { label: "Documents", href: "/trainee-dashboard/documents" },
      ]}
      summaryItems={[
        { label: "Assessments", value: `${assessments.length}`, tone: "cyan" },
        { label: "Average Score", value: `${workspace.summary.averageAssessmentScore}`, tone: "emerald" },
        { label: "Max Score", value: `${assessments[0]?.maxScore ?? 0}`, tone: "amber" },
        { label: "Latest", value: assessments[0]?.assessmentName || "-", tone: "rose" },
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
          {!assessments.length ? (
            <p className="text-sm text-slate-500">No assessments have been recorded yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
