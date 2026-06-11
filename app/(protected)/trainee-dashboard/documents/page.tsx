import { redirect } from "next/navigation";
import { Eye, Download } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";
import { getApplicantDocumentById } from "@/lib/actions/employee-documents";
import { buildTraineeDocumentSummary } from "@/lib/trainee-documents";

export default async function TraineeDocumentsPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();
  const applicantDocument = workspace.trainee.applicantDocumentId
    ? await getApplicantDocumentById(workspace.trainee.applicantDocumentId)
    : null;
  const documentSummary = buildTraineeDocumentSummary(applicantDocument ?? {});

  return (
    <TraineeSectionShell
      title="Documents"
      subtitle="View the applicant documents that were carried into the trainee record."
      traineeCode={workspace.trainee.traineeCode ?? ""}
      traineeName={workspace.trainee.fullName ?? ""}
      tabs={[
        { label: "Dashboard", href: "/trainee-dashboard" },
        { label: "Attendance", href: "/trainee-dashboard/attendance" },
        { label: "Tasks", href: "/trainee-dashboard/tasks" },
        { label: "Assessments", href: "/trainee-dashboard/assessments" },
        { label: "Evaluations", href: "/trainee-dashboard/evaluations" },
        { label: "Training Materials", href: "/trainee-dashboard/materials" },
        { label: "Documents", href: "/trainee-dashboard/documents", active: true },
      ]}
      summaryItems={[
        { label: "Available", value: `${documentSummary.filter((item) => item.urls.length > 0).length}`, tone: "emerald" },
        { label: "Tracked", value: `${documentSummary.length}`, tone: "cyan" },
        { label: "Linked", value: workspace.trainee.applicantDocumentId ? "Yes" : "No", tone: "amber" },
        { label: "Trainee ID", value: workspace.trainee.traineeCode ?? "", tone: "rose" },
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
