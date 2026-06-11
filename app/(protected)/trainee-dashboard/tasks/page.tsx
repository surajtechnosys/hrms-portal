import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";

export default async function TraineeTasksPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();
  const { trainee, tasks } = workspace;

  return (
    <TraineeSectionShell
      title="Tasks"
      subtitle="Review your assigned tasks, due dates, and submission status."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Dashboard", href: "/trainee-dashboard" },
        { label: "Attendance", href: "/trainee-dashboard/attendance" },
        { label: "Tasks", href: "/trainee-dashboard/tasks", active: true },
        { label: "Assessments", href: "/trainee-dashboard/assessments" },
        { label: "Evaluations", href: "/trainee-dashboard/evaluations" },
        { label: "Training Materials", href: "/trainee-dashboard/materials" },
        { label: "Documents", href: "/trainee-dashboard/documents" },
      ]}
      summaryItems={[
        { label: "Total Tasks", value: `${tasks.length}`, tone: "cyan" },
        { label: "Open Tasks", value: `${tasks.filter((task) => task.status !== "DONE").length}`, tone: "amber" },
        { label: "Submitted", value: `${tasks.filter((task) => task.status === "DONE").length}`, tone: "emerald" },
        { label: "Submission", value: `${tasks.filter((task) => !!task.submissionUrl).length}`, tone: "rose" },
      ]}
    >
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.description || "No description"}</p>
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                  <p>Due: {task.dueDate || "-"}</p>
                  <p>Priority: {task.priority}</p>
                  <p>Remarks: {task.remarks || "-"}</p>
                </div>
                {task.submissionUrl ? (
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={task.submissionUrl} target="_blank" rel="noreferrer">
                        Open Submission
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
            {!tasks.length ? (
              <p className="text-sm text-slate-500">No tasks assigned yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
