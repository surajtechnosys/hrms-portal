import { auth } from "@/auth";
import EmployeeDocumentForm from "@/components/employee-documents/employee-document-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSelectedInterviewCandidates } from "@/lib/actions/interviews";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { canAccess } from "@/lib/rbac";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";

const EmployeeDocumentCreatePage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string | string[];
    sourceInterviewApplicantId?: string | string[];
  }>;
}) => {
  const route = "/employee-documents";
  const canCreate = await canAccess(route, "create");

  if (!canCreate) {
    redirect("/404");
  }

  const session = await auth();
  const isHrEmployee = await isCurrentEmployeeHr();
  const isSelfServiceEmployee =
    session?.user?.role?.toLowerCase() === "employee" && !isHrEmployee;

  const [selectedCandidates, params] = await Promise.all([
    getSelectedInterviewCandidates(),
    searchParams,
  ]);
  const { from, sourceInterviewApplicantId } = params;
  const openedFromDashboard = from === "employee-dashboard";
  const backHref = openedFromDashboard ? "/employee-dashboard" : "/employee-documents";
  const selectedInterviewApplicantId =
    typeof sourceInterviewApplicantId === "string"
      ? sourceInterviewApplicantId
      : sourceInterviewApplicantId?.[0] || "";

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <FilePlus2 size={20} />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                {isSelfServiceEmployee ? "Add Employee Document" : "Add Applicant Document"}
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {isSelfServiceEmployee
                  ? "Upload your personal documents for HR review"
                  : "Upload and manage applicant documents before employee creation"}
              </p>
            </div>
          </div>

          {/* Right */}
          <Button
            asChild
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <EmployeeDocumentForm
          update={false}
          redirectTo={backHref}
          mode={isSelfServiceEmployee ? "employee" : "applicant"}
          selectedCandidates={selectedCandidates}
          initialSelectedInterviewApplicantId={selectedInterviewApplicantId}
        />
      </CardContent>
    </Card>
  );
};

export default EmployeeDocumentCreatePage;
