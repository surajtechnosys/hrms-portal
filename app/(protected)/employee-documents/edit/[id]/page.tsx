import { auth } from "@/auth";
import EmployeeDocumentForm from "@/components/employee-documents/employee-document-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEmployeeDocumentById,
} from "@/lib/actions/employee-documents";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { canAccess } from "@/lib/rbac";
import { EmployeeDocument } from "@/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FilePenLine } from "lucide-react";

const EmployeeDocumentEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const route = "/employee-documents";
  const canEdit = await canAccess(route, "edit");

  if (!canEdit) {
    redirect("/404");
  }

  const session = await auth();
  const isHrEmployee = await isCurrentEmployeeHr();
  const isSelfServiceEmployee =
    session?.user?.role?.toLowerCase() === "employee" && !isHrEmployee;

  const { id } = await params;
  const record = await getEmployeeDocumentById(id);

  if (!record.success || !record.data) {
    notFound();
  }

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <FilePenLine size={20} />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                {isSelfServiceEmployee ? "Edit Employee Document" : "Edit Applicant Document"}
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {isSelfServiceEmployee
                  ? "Update your uploaded document details and files"
                  : "Update applicant document details and files"}
              </p>
            </div>
          </div>

          {/* Right */}
          <Button
            asChild
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            <Link href="/employee-documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <EmployeeDocumentForm
          data={record.data as EmployeeDocument}
          update={true}
          mode={isSelfServiceEmployee ? "employee" : "applicant"}
        />
      </CardContent>
    </Card>
  );
};

export default EmployeeDocumentEditPage;
