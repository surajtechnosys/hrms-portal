import { notFound, redirect } from "next/navigation";

import { Eye, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getApplicantDocumentById } from "@/lib/actions/employee-documents";
import { getTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { getUserPermissions, isAdminRole } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { buildTraineeDocumentSummary } from "@/lib/trainee-documents";

export default async function TraineeDocumentsWorkspacePage({
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

  const applicantDocument = workspace.trainee.applicantDocumentId
    ? await getApplicantDocumentById(workspace.trainee.applicantDocumentId)
    : null;
  const documentSummary = buildTraineeDocumentSummary(applicantDocument ?? {});

  return (
    <TraineeSectionShell
      title="Documents"
      subtitle="Audit the applicant documents linked to this trainee and reuse them safely during conversion."
      traineeCode={workspace.trainee.traineeCode ?? ""}
      traineeName={workspace.trainee.fullName ?? ""}
      tabs={[
        { label: "Overview", href: `/trainees/${id}` },
        { label: "Attendance", href: `/trainees/${id}/attendance` },
        { label: "Tasks", href: `/trainees/${id}/tasks` },
        { label: "Assessments", href: `/trainees/${id}/assessments` },
        { label: "Evaluations", href: `/trainees/${id}/evaluations` },
        { label: "Training Materials", href: `/trainees/${id}/materials` },
        { label: "Documents", href: `/trainees/${id}/documents`, active: true },
      ]}
      summaryItems={[
        { label: "Available", value: `${documentSummary.filter((item) => item.urls.length > 0).length}`, tone: "emerald" },
        { label: "Tracked", value: `${documentSummary.length}`, tone: "cyan" },
        { label: "Linked", value: workspace.trainee.applicantDocumentId ? "Yes" : "No", tone: "amber" },
        { label: "Conversion", value: workspace.trainee.employeeCode || "Pending", tone: "rose" },
      ]}
    >
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Document Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-3">
          {documentSummary.map((item) => {
            const hasFiles = item.urls.length > 0;

            return (
              <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <Badge variant={hasFiles ? "default" : "outline"}>
                    {hasFiles ? "Available" : "Missing"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {hasFiles ? `${item.urls.length} file(s)` : "No file uploaded"}
                </p>
                {hasFiles ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.urls.map((url, index) => (
                      <div key={`${item.key}-${index}`} className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={url} target="_blank" rel="noreferrer">
                            <Eye className="size-4" />
                            Preview
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <a href={url} download>
                            <Download className="size-4" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
