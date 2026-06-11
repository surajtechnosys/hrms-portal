import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { getUserPermissions, isAdminRole } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";

export default async function TraineeMaterialsWorkspacePage({
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

  const { trainee, materials } = workspace;

  return (
    <TraineeSectionShell
      title="Training Materials"
      subtitle="Manage PDFs, documents, videos, and resource links attached to the trainee."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Overview", href: `/trainees/${id}` },
        { label: "Attendance", href: `/trainees/${id}/attendance` },
        { label: "Tasks", href: `/trainees/${id}/tasks` },
        { label: "Assessments", href: `/trainees/${id}/assessments` },
        { label: "Evaluations", href: `/trainees/${id}/evaluations` },
        { label: "Training Materials", href: `/trainees/${id}/materials`, active: true },
        { label: "Documents", href: `/trainees/${id}/documents` },
      ]}
      summaryItems={[
        { label: "Materials", value: `${materials.length}`, tone: "cyan" },
        { label: "Files", value: `${materials.filter((item) => item.materialType !== "LINK").length}`, tone: "emerald" },
        { label: "Videos", value: `${materials.filter((item) => item.materialType === "VIDEO").length}`, tone: "amber" },
        { label: "Links", value: `${materials.filter((item) => item.materialType === "LINK").length}`, tone: "rose" },
      ]}
    >
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Material Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {materials.map((material) => (
            <div key={material.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{material.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{material.description || "No description"}</p>
                </div>
                <Badge variant="outline">{material.materialType}</Badge>
              </div>
              {material.url ? (
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={material.url} target="_blank" rel="noreferrer">
                      Open Resource
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {!materials.length ? <p className="text-sm text-slate-500">No materials yet.</p> : null}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
