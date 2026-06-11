import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TraineeSectionShell } from "@/components/trainees/trainee-section-shell";
import { getCurrentTraineeWorkspaceData } from "@/lib/actions/trainee-workspace";

export default async function TraineeMaterialsPage() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee") {
    redirect("/404");
  }

  const workspace = await getCurrentTraineeWorkspaceData();
  const { trainee, materials } = workspace;

  return (
    <TraineeSectionShell
      title="Training Materials"
      subtitle="Access shared PDFs, files, and resource links for your training."
      traineeCode={trainee.traineeCode ?? ""}
      traineeName={trainee.fullName ?? ""}
      tabs={[
        { label: "Dashboard", href: "/trainee-dashboard" },
        { label: "Attendance", href: "/trainee-dashboard/attendance" },
        { label: "Tasks", href: "/trainee-dashboard/tasks" },
        { label: "Assessments", href: "/trainee-dashboard/assessments" },
        { label: "Evaluations", href: "/trainee-dashboard/evaluations" },
        { label: "Training Materials", href: "/trainee-dashboard/materials", active: true },
        { label: "Documents", href: "/trainee-dashboard/documents" },
      ]}
      summaryItems={[
        { label: "Materials", value: `${materials.length}`, tone: "cyan" },
        { label: "PDF/Docs", value: `${materials.filter((item) => item.materialType !== "VIDEO" && item.materialType !== "LINK").length}`, tone: "emerald" },
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
          {!materials.length ? (
            <p className="text-sm text-slate-500">No training materials available yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </TraineeSectionShell>
  );
}
