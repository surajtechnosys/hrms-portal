import Link from "next/link";
import { ArrowLeft, CalendarPlus, FileText, UsersRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getInterviewWorkspace } from "@/lib/actions/interviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  canScheduleNextRound,
  getRoundIndex,
  getRoundLabel,
} from "@/components/interviews/interview-utils";

function statusTone(status: string) {
  const tones: Record<string, string> = {
    SCHEDULED: "bg-indigo-100 text-indigo-700",
    RESCHEDULED: "bg-cyan-100 text-cyan-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
    NO_SHOW: "bg-amber-100 text-amber-700",
  };

  return tones[status] || "bg-slate-100 text-slate-700";
}

function decisionTone(decision?: string | null) {
  const tones: Record<string, string> = {
    PROCEED_TO_NEXT_ROUND: "bg-cyan-100 text-cyan-700",
    SELECTED: "bg-emerald-500 text-white",
    REJECTED: "bg-rose-500 text-white",
    ON_HOLD: "bg-amber-100 text-amber-700",
  };

  return tones[decision || ""] || "bg-slate-100 text-slate-600";
}

function formatSchedule(date?: string, time?: string) {
  return [date, time].filter(Boolean).join(" ");
}

export default async function ApplicantInterviewViewPage({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const workspace = await getInterviewWorkspace();

  if (!workspace.canManageAll) {
    redirect("/interviews");
  }

  const { applicantId } = await params;
  const applicantRecords = workspace.records
    .filter((record) => record.applicantId === applicantId)
    .sort((left, right) =>
      (left.updatedAt || left.createdAt || "").localeCompare(
        right.updatedAt || right.createdAt || "",
      ),
    );

  if (!applicantRecords.length) {
    notFound();
  }

  const latestRecord = [...applicantRecords].sort((left, right) =>
    (right.updatedAt || right.createdAt || "").localeCompare(
      left.updatedAt || left.createdAt || "",
    ),
  )[0];

  const latestRoundIndex = getRoundIndex(latestRecord.interviewRound);

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              <UsersRound className="size-3.5" />
              Applicant Interview View
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {latestRecord.applicantName}
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Review the full interview trail, interviewer feedback, and the next round path.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-2xl border-slate-200">
              <Link href="/interviews">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>

            <Button asChild variant="outline" className="rounded-2xl border-cyan-200 text-cyan-700 hover:bg-cyan-50">
              <Link href={`/interviews/edit/${latestRecord.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Open Latest Round
              </Link>
            </Button>

            {canScheduleNextRound(latestRecord) ? (
              <Button asChild className="rounded-2xl bg-blue-600 px-5 text-white shadow-md transition-all hover:bg-blue-700">
                <Link href={`/interviews/create?applicantId=${latestRecord.applicantId}`}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Schedule Next Round
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Latest Round
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {latestRoundIndex >= 0
                ? `Round ${latestRoundIndex + 1} of 5`
                : getRoundLabel(latestRecord.interviewRound)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {latestRecord.interviewRound.replaceAll("_", " ")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Latest Status
            </p>
            <Badge className={`mt-2 ${statusTone(latestRecord.status)}`}>
              {latestRecord.status.replaceAll("_", " ")}
            </Badge>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Latest Decision
            </p>
            <Badge className={`mt-2 ${decisionTone(latestRecord.recommendation)}`}>
              {(latestRecord.recommendation || "Pending").replaceAll("_", " ")}
            </Badge>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Total Records
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {applicantRecords.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Round-by-round interview history
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-3xl border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Interview Timeline
              </CardTitle>
              <p className="text-sm text-slate-500">
                Feedback is shown in chronological order so HR can review the candidate journey quickly.
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              {applicantRecords.map((record) => {
                const roundIndex = getRoundIndex(record.interviewRound);

                return (
                  <div
                    key={record.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {roundIndex >= 0
                              ? `Round ${roundIndex + 1}`
                              : getRoundLabel(record.interviewRound)}
                          </h3>
                          <Badge className={`rounded-full ${statusTone(record.status)}`}>
                            {record.status.replaceAll("_", " ")}
                          </Badge>
                          <Badge className={`rounded-full ${decisionTone(record.recommendation)}`}>
                            {(record.recommendation || "Pending").replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {record.interviewId} · {record.interviewerName}
                          {record.interviewerJobRole ? ` · ${record.interviewerJobRole}` : ""}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">
                          {formatSchedule(record.scheduledDate, record.scheduledTime)}
                        </p>
                        <p>{record.interviewMode.replaceAll("_", " ")}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Feedback
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {record.feedback?.trim() || "No feedback captured yet."}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Strengths
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {record.strengths?.trim() || "No strengths noted yet."}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Weaknesses
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {record.weaknesses?.trim() || "No weaknesses noted yet."}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Interviewer Note
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {record.statusNote?.trim() || "No additional note shared."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Latest Round Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5 text-sm text-slate-600">
                <p>
                  Use this applicant-level view to review every interviewer comment before deciding on the next round.
                </p>
                <p>
                  If the latest completed round recommends{" "}
                  <span className="font-semibold text-slate-900">Proceed to Next Round</span>, the schedule button opens a prefilled interview form for the same applicant.
                </p>
                <p>
                  The current round remains editable from the latest interview record if you need to adjust schedule details.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Quick Facts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Latest Interviewer
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {latestRecord.interviewerName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Latest Feedback Score
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {typeof latestRecord.ratingScore === "number"
                      ? `${latestRecord.ratingScore}/10`
                      : "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Last Updated
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {latestRecord.updatedAt || latestRecord.createdAt || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
