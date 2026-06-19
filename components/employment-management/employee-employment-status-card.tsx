import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatRemainingDays,
  getEmployeeTypeLabel,
  getEmploymentReviewActionLabel,
  getEmploymentTrackingState,
} from "@/lib/employee-employment";
import { cn } from "@/lib/utils";
import type { EmployeeProfile, EmploymentReview } from "@prisma/client";

const formatDate = (value?: Date | null) =>
  value ? value.toLocaleDateString("en-GB") : "-";

export function EmployeeEmploymentStatusCard({
  employee,
  latestReview,
}: {
  employee: Pick<
    EmployeeProfile,
    | "employeeName"
    | "employeeCode"
    | "employeeType"
    | "probationStartDate"
    | "probationEndDate"
    | "trainingStartDate"
    | "trainingEndDate"
  >;
  latestReview: Pick<
    EmploymentReview,
    "action" | "reviewedByName" | "createdAt"
  > | null;
}) {
  const tracking = getEmploymentTrackingState(employee);
  const tone = tracking.tone;
  const currentEmployeeType = getEmployeeTypeLabel(employee.employeeType);
  const startDate = formatDate(tracking.startDate);
  const endDate = formatDate(tracking.endDate);
  const remainingDays = formatRemainingDays(tracking.remainingDays);
  const lastActionLabel = latestReview
    ? getEmploymentReviewActionLabel(latestReview.action)
    : "No employment action recorded yet";
  const lastActionBy = latestReview?.reviewedByName || "Unknown";
  const lastActionDate = latestReview
    ? formatDate(latestReview.createdAt)
    : "-";
  const lastActionSummary = latestReview
    ? `${lastActionLabel} by ${lastActionBy}`
    : lastActionLabel;

  return (
    <Card
      id="employment-status"
      className={cn("overflow-hidden rounded-[28px] border shadow-sm", tone.cardClassName)}
    >
      <CardHeader className="border-b border-white/60 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">
          Employment Status
        </CardTitle>
        <CardDescription className="text-slate-600">
          Current employment details and the latest HR action.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", tone.accentClassName)}>
              Current Employee Type
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {currentEmployeeType}
            </p>
            <p className="mt-1 text-sm text-slate-600">{employee.employeeCode}</p>
          </div>
          <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", tone.badgeClassName)}>
            {tracking.periodLabel}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Start Date
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {startDate}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              End Date
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {endDate}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Remaining Days
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {remainingDays}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Last Employment Action
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {lastActionSummary}
          </p>
          <p className="mt-1 text-xs text-slate-500">Date: {lastActionDate}</p>
        </div>
      </CardContent>
    </Card>
  );
}
