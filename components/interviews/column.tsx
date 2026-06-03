import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InterviewRecord } from "@/types";
import {
  canScheduleNextRound,
  ROUND_SEQUENCE,
  getRoundIndex,
  getRoundLabel,
} from "./interview-utils";

function toneForStatus(status?: string) {
  const tones: Record<string, string> = {
    SCHEDULED: "bg-indigo-100 text-indigo-700",
    RESCHEDULED: "bg-cyan-100 text-cyan-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
    NO_SHOW: "bg-amber-100 text-amber-700",
  };

  return tones[status || ""] || "bg-slate-100 text-slate-700";
}

function toneForRecommendation(recommendation?: string | null) {
  const tones: Record<string, string> = {
    PROCEED_TO_NEXT_ROUND: "bg-cyan-100 text-cyan-700",
    SELECTED: "bg-emerald-500 text-white",
    REJECTED: "bg-rose-500 text-white",
    ON_HOLD: "bg-amber-100 text-amber-700",
  };

  return tones[recommendation || ""] || "bg-slate-100 text-slate-600";
}

function toneForHrAction(action: string) {
  const tones: Record<string, string> = {
    SCHEDULE_NEXT_ROUND: "bg-cyan-100 text-cyan-700",
    FINAL_SELECTION: "bg-emerald-100 text-emerald-700",
    FINAL_REJECTION: "bg-rose-100 text-rose-700",
    AWAITING_FEEDBACK: "bg-amber-100 text-amber-700",
    INTERVIEW_IN_PROGRESS: "bg-blue-100 text-blue-700",
    REVIEW_NO_SHOW: "bg-orange-100 text-orange-700",
    RESCHEDULE_IF_REQUIRED: "bg-slate-100 text-slate-700",
    AWAITING_INTERVIEW: "bg-indigo-100 text-indigo-700",
  };

  return tones[action] || "bg-slate-100 text-slate-700";
}

function getHrNextStep(record: InterviewRecord) {
  if (record.recommendation === "SELECTED") {
    return {
      toneKey: "FINAL_SELECTION",
      label: "Selection Finalized",
      detail: "Close the candidate journey.",
    };
  }

  if (record.recommendation === "REJECTED") {
    return {
      toneKey: "FINAL_REJECTION",
      label: "Rejected",
      detail: "Close the candidate journey.",
    };
  }

  if (record.recommendation === "PROCEED_TO_NEXT_ROUND") {
    if (record.status === "COMPLETED") {
      return {
        toneKey: "SCHEDULE_NEXT_ROUND",
        label: "Schedule Next Round",
        detail: "Open applicant view to continue.",
      };
    }

    return {
      toneKey: "SCHEDULE_NEXT_ROUND",
      label: "Review Feedback",
      detail: "Open applicant view to review notes.",
    };
  }

  if (record.status === "IN_PROGRESS") {
    return {
      toneKey: "INTERVIEW_IN_PROGRESS",
      label: "Interview In Progress",
      detail: "Await interviewer response.",
    };
  }

  if (record.status === "NO_SHOW") {
    return {
      toneKey: "REVIEW_NO_SHOW",
      label: "Review No Show",
      detail: "Decide whether to reschedule.",
    };
  }

  if (record.status === "CANCELLED") {
    return {
      toneKey: "RESCHEDULE_IF_REQUIRED",
      label: "Reschedule If Required",
      detail: "Round cancelled by HR.",
    };
  }

  if (
    record.status === "COMPLETED" &&
    !record.feedback?.trim() &&
    !record.recommendation
  ) {
    return {
      toneKey: "AWAITING_FEEDBACK",
      label: "Awaiting Feedback",
      detail: "Waiting for interviewer feedback.",
    };
  }

  return {
    toneKey: "AWAITING_INTERVIEW",
    label: "Awaiting Interview",
    detail: "Waiting for the round to start.",
  };
}

export function getInterviewColumns({
  canManageAll,
  records,
}: {
  canManageAll: boolean;
  records: InterviewRecord[];
}): ColumnDef<InterviewRecord>[] {
  const recordsByApplicant = records.reduce<Record<string, InterviewRecord[]>>((accumulator, record) => {
    accumulator[record.applicantId] = accumulator[record.applicantId] || [];
    accumulator[record.applicantId].push(record);
    return accumulator;
  }, {});

  const columns: ColumnDef<InterviewRecord>[] = [
    {
      accessorKey: "interviewId",
      header: "Interview ID",
      cell: ({ row }) => row.original.interviewId || "-",
    },
    {
      accessorKey: "applicantName",
      header: "Applicant Name",
    },
    {
      accessorKey: "appliedPosition",
      header: "Position Applied",
    },
    {
      accessorKey: "interviewRound",
      header: "Round",
      cell: ({ row }) => getRoundLabel(row.original.interviewRound),
    },
    {
      accessorKey: "interviewerName",
      header: "Interviewer",
    },
    {
      accessorKey: "scheduledDate",
      header: "Schedule",
      cell: ({ row }) =>
        [row.original.scheduledDate, row.original.scheduledTime]
          .filter(Boolean)
          .join(" "),
    },
    {
      accessorKey: "status",
      header: "Interview Status",
      cell: ({ row }) => (
        <Badge className={toneForStatus(row.original.status)}>
          {row.original.status.replaceAll("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "recommendation",
      header: "Decision",
      cell: ({ row }) => (
        <Badge className={toneForRecommendation(row.original.recommendation)}>
          {(row.original.recommendation || "PENDING").replaceAll("_", " ")}
        </Badge>
      ),
    },
  ];

  if (canManageAll) {
    columns.push(
      {
        id: "journey",
        header: "Journey",
        cell: ({ row }) => {
          const applicantRecords = recordsByApplicant[row.original.applicantId] || [];
          const currentIndex = getRoundIndex(row.original.interviewRound);
          const roundLabel =
            currentIndex >= 0
              ? `Round ${currentIndex + 1} of ${ROUND_SEQUENCE.length}`
              : getRoundLabel(row.original.interviewRound);

          return (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900">{roundLabel}</p>
              <p className="text-xs leading-4 text-slate-500">
                {applicantRecords.length} record
                {applicantRecords.length === 1 ? "" : "s"}
              </p>
            </div>
          );
        },
      },
      {
        id: "hrNextStep",
        header: "Next Step",
        cell: ({ row }) => {
          const nextStep = getHrNextStep(row.original);

          return (
            <div className="space-y-1.5">
              <Badge className={`${toneForHrAction(nextStep.toneKey)} rounded-full`}>
                {nextStep.label}
              </Badge>
              <p className="max-w-[150px] truncate text-xs leading-4 text-slate-500">
                {nextStep.detail}
              </p>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <Link href={`/interviews/view/${row.original.applicantId}`}>
                <Eye size={16} />
                View
              </Link>
            </Button>
            {canScheduleNextRound(row.original) ? (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link href={`/interviews/create?applicantId=${row.original.applicantId}`}>
                  <ArrowRight size={16} />
                  Next Round
                </Link>
              </Button>
            ) : null}
          </div>
        ),
      },
    );

    return columns;
  }

  columns.push({
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <Button
        asChild
        size="sm"
        className="bg-slate-800 hover:bg-slate-900"
      >
        <Link href={`/interviews/edit/${row.original.id}`}>
          <Eye size={16} />
          Open
        </Link>
      </Button>
    ),
  });

  return columns;
}
