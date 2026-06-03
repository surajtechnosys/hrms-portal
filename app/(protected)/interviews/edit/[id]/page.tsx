import Link from "next/link";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import InterviewForm from "@/components/interviews/interview-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { getInterviewById, getInterviewCreateOptions, getInterviewWorkspace } from "@/lib/actions/interviews";

export default async function InterviewEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;
  const [workspace, result, options] = await Promise.all([
    getInterviewWorkspace(),
    getInterviewById(id),
    getInterviewCreateOptions(),
  ]);

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
                {workspace.canManageAll ? "Manage Interview" : "Interview Workspace"}
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {workspace.canManageAll
                  ? "Reschedule rounds, track progress, and review feedback in one place."
                  : "Review candidate context and submit your interview feedback."}
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
          data={result.data}
          update
          canManageAll={workspace.canManageAll}
          isAssignedInterviewer={workspace.currentEmployeeId === result.data.interviewerId}
          applicants={options.applicants}
          interviewers={options.interviewers}
        />
      </CardContent>
    </Card>
  );
}
