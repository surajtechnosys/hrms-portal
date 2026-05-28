import Link from "next/link";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import RecruitmentIntakeForm from "@/components/recruitment-intake/recruitment-intake-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecruitmentIntakeById } from "@/lib/actions/recruitment-intake";
import { canAccess } from "@/lib/rbac";

const RecruitmentIntakeEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const canEdit = await canAccess("/recruitment-intake", "edit");

  if (!canEdit) {
    redirect("/404");
  }

  const result = await getRecruitmentIntakeById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <FilePenLine size={20} />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Edit Recruitment
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Update the applicant details and resume PDF.
              </p>
            </div>
          </div>

          <Button
            asChild
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            <Link href="/recruitment-intake">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <RecruitmentIntakeForm data={result.data} update />
      </CardContent>
    </Card>
  );
};

export default RecruitmentIntakeEditPage;
