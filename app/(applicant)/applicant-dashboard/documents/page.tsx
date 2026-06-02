import { signOut } from "@/auth";
import EmployeeDocumentForm from "@/components/employee-documents/employee-document-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEmployeeDocuments } from "@/lib/actions/employee-documents";
import { getCurrentApplicantApplication } from "@/lib/actions/recruitment";
import { employeeDocumentDefaultValues } from "@/lib/constants";
import { EmployeeDocument } from "@/types";
import { ArrowLeft, FilePlus2, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const ApplicantDocumentsPage = async () => {
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
  const reuploadRequested =
    existingDocument?.reviewStatus === "REUPLOAD_REQUESTED";

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <FilePlus2 size={20} />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Applicant Document Upload
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Upload your onboarding documents for HR review
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/applicant-dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                variant="outline"
                className="rounded-2xl bg-white/90"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {reuploadRequested ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-100 text-amber-700">
                REUPLOAD REQUESTED
              </Badge>
              <span className="font-medium">
                HR has requested changes on one or more documents.
              </span>
            </div>
            <p className="mt-2">
              Please edit the affected documents and save the form again to
              resubmit your application for review.
            </p>
            {existingDocument?.reviewRemark ? (
              <p className="mt-2">
                <span className="font-medium">Remark:</span>{" "}
                {existingDocument.reviewRemark}
              </p>
            ) : null}
          </div>
        ) : null}

        <EmployeeDocumentForm
          data={formData}
          update={Boolean(existingDocument?.id)}
          redirectTo="/applicant-dashboard"
          mode="applicant"
          showApplicantSelection={false}
        />
      </CardContent>
    </Card>
  );
};

export default ApplicantDocumentsPage;
