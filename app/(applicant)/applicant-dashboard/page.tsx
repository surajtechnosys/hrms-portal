import { signOut } from "@/auth";
import EmployeeDocumentForm from "@/components/employee-documents/employee-document-form";
import { Button } from "@/components/ui/button";
import { getEmployeeDocuments } from "@/lib/actions/employee-documents";
import { getCurrentApplicantApplication } from "@/lib/actions/recruitment";
import { employeeDocumentDefaultValues } from "@/lib/constants";
import { EmployeeDocument } from "@/types";
import { FileText, LogOut, UserRoundCheck } from "lucide-react";
import { redirect } from "next/navigation";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "-";
}

export default async function ApplicantDashboardPage() {
  const applicantResult = await getCurrentApplicantApplication();

  if (!applicantResult.success || !applicantResult.data) {
    redirect("/");
  }

  const applicant = applicantResult.data;
  const documents = await getEmployeeDocuments();
  const existingDocument = documents.at(0);
  const formData = (existingDocument ?? {
    ...employeeDocumentDefaultValues,
    documentOwnerType: "APPLICANT",
    applicantId: applicant.id ?? "",
    applicantCode: applicant.requestId,
    candidateName: applicant.candidateName,
  }) as EmployeeDocument;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-6">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-cyan-50 p-3 text-cyan-700">
            <UserRoundCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Applicant Portal
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              {applicant.candidateName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {applicant.profilePost} - Request {applicant.requestId}
            </p>
          </div>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" className="rounded-lg">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Applicant ID</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {applicant.applicantPortalId || "-"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Username</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {applicant.applicantUsername || "-"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Documents Submitted</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatDate(applicant.applicantDocumentsSubmittedAt)}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-cyan-50 p-3 text-cyan-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Document Upload
            </h2>
            <p className="text-sm text-slate-500">
              Submit identity, education, and experience documents for HR review.
            </p>
          </div>
        </div>

        <EmployeeDocumentForm
          data={formData}
          update={Boolean(existingDocument?.id)}
          redirectTo="/applicant-dashboard"
          mode="applicant-self"
        />
      </section>
    </div>
  );
}
