"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, UserCheck, UsersRound, XCircle } from "lucide-react";

import { DataTable } from "@/components/datatable/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { getInterviewColumns } from "./column";
import { groupInterviewRecordsByApplicant } from "./interview-utils";
import type { InterviewRecord } from "@/types";

type Stats = {
  totalScheduled: number;
  interviewsToday: number;
  pendingFeedback: number;
  completed: number;
  selectedCandidates: number;
  rejectedCandidates: number;
  upcoming: number;
};

const statCards = [
  { key: "totalScheduled", label: "Total Interviews Scheduled", icon: CalendarDays },
  { key: "interviewsToday", label: "Interviews Today", icon: Clock3 },
  { key: "pendingFeedback", label: "Pending Feedback", icon: UsersRound },
  { key: "completed", label: "Completed Interviews", icon: CheckCircle2 },
  { key: "selectedCandidates", label: "Selected Candidates", icon: UserCheck },
  { key: "rejectedCandidates", label: "Rejected Candidates", icon: XCircle },
  { key: "upcoming", label: "Upcoming Interviews", icon: CalendarDays },
] as const;

export default function InterviewDataTable({
  data,
  stats,
  canManageAll,
  showStats = true,
}: {
  data: InterviewRecord[];
  stats: Stats;
  canManageAll: boolean;
  showStats?: boolean;
}) {
  const tableData = React.useMemo(() => {
    if (!canManageAll) {
      return data;
    }

    return groupInterviewRecordsByApplicant(data).map((group) => group.latestRecord);
  }, [canManageAll, data]);

  const columns = getInterviewColumns({ canManageAll, records: data });

  return (
    <div className="space-y-5">
      {showStats ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {stats[item.key]}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <DataTable
        data={tableData}
        columns={columns}
        title="Interview Management"
        actions={
          canManageAll ? (
            <Link
              href="/interviews/create"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Schedule Interview / Next Round
            </Link>
          ) : undefined
        }
        rowHref={canManageAll ? undefined : (row) => `/interviews/edit/${row.id}`}
        tableClassName={canManageAll ? "min-w-[1360px]" : "min-w-[1200px]"}
        bodyCellClassName="align-top"
      />
    </div>
  );
}
