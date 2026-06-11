import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { getUserPermissions, isAdminRole } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";

export default async function TraineeTasksWorkspacePage({
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

  const { trainee, tasks } = workspace;

  return (
    <TraineeSectionShell
      title="Tasks"
      subtitle="Review the trainee task queue and submission status."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Overview", href: `/trainees/${id}` },
        { label: "Attendance", href: `/trainees/${id}/attendance` },
        { label: "Tasks", href: `/trainees/${id}/tasks`, active: true },
        { label: "Assessments", href: `/trainees/${id}/assessments` },
        { label: "Evaluations", href: `/trainees/${id}/evaluations` },
        { label: "Training Materials", href: `/trainees/${id}/materials` },
        { label: "Documents", href: `/trainees/${id}/documents` },
      ]}
      summaryItems={[
        { label: "Tasks", value: `${tasks.length}`, tone: "cyan" },
        { label: "Open", value: `${tasks.filter((item) => item.status !== "DONE").length}`, tone: "amber" },
        { label: "Done", value: `${tasks.filter((item) => item.status === "DONE").length}`, tone: "emerald" },
        { label: "Submission", value: `${tasks.filter((item) => !!item.submissionUrl).length}`, tone: "rose" },
      ]}
    >
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
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
            </div>
          ))}
          {!tasks.length ? (
            <p className="text-sm text-slate-500">No tasks assigned yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
