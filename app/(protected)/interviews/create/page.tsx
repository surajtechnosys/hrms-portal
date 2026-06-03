import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { redirect } from "next/navigation";

import InterviewForm from "@/components/interviews/interview-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { getInterviewCreateOptions, getInterviewWorkspace } from "@/lib/actions/interviews";

export default async function InterviewCreatePage({
  searchParams,
}: {
  searchParams?: Promise<{ applicantId?: string | string[] }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const initialApplicantId =
    typeof params?.applicantId === "string" ? params.applicantId : undefined;

  if (!session?.user?.id) {
    redirect("/");
  }

  const [workspace, options] = await Promise.all([
    getInterviewWorkspace(),
    getInterviewCreateOptions(),
  ]);

  if (!workspace.canManageAll) {
    redirect("/404");
  }

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <CalendarPlus size={20} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Schedule Interview
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Create a new interview round for shortlisted applicants without duplicating recruitment data.
              </p>
            </div>
          </div>

          <Button asChild className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg">
            <Link href="/interviews">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <InterviewForm
          update={false}
          canManageAll
          isAssignedInterviewer={false}
          initialApplicantId={initialApplicantId}
          applicants={options.applicants}
          interviewers={options.interviewers}
        />
      </CardContent>
    </Card>
  );
}
