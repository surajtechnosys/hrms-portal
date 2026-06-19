"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatRemainingDays,
  getEmployeeTypeLabel,
  getEmploymentTrackingState,
  getEmploymentTrackingTone,
} from "@/lib/employee-employment";
import {
  convertEmployeeToPermanent,
  extendProbation,
  extendTraining,
} from "@/lib/actions/employee-employment";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock3, FileClock, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type EmploymentManagementEmployee = Parameters<typeof getEmploymentTrackingState>[0];

function formatDate(value?: Date | string | null) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
}

function getNextAllowedDate(value?: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

export function EmploymentManagementCard({
  employee,
  canManage,
  historyHref,
  viewLabel = "View",
  title = "Employment Management",
  className,
}: {
  employee: EmploymentManagementEmployee;
  canManage: boolean;
  historyHref: string;
  viewLabel?: string;
  title?: string;
  className?: string;
}) {
  const tracking = getEmploymentTrackingState(employee);
  const tone = getEmploymentTrackingTone(tracking.remainingDays);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const extendAction =
    tracking.kind === "PROBATION" ? extendProbation : extendTraining;
  const currentEndDate = formatDate(tracking.endDate);
  const currentEndDateMin = getNextAllowedDate(tracking.endDate);
  const employeeCode = employee.employeeCode ?? employee.id ?? "";
  const handleConvertToEmployee = async (formData: FormData) => {
    await convertEmployeeToPermanent(formData);
  };
  const handleExtendEmployment = async (formData: FormData) => {
    await extendAction(formData);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-sm",
        className,
      )}
    >
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
        <CardDescription className="text-slate-500">
          Review the current employment stage, update end dates, and keep the
          timeline current.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", tone.accentClassName)}>
                Current Employee
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {employee.employeeName}
              </p>
              <p className={cn("mt-1 text-sm", tone.accentClassName)}>
                {employeeCode}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", tone.badgeClassName)}>
                {getEmployeeTypeLabel(employee.employeeType)}
              </Badge>
              {tracking.kind && (
                <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", tone.badgeClassName)}>
                  {tracking.periodLabel}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Current Type
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {getEmployeeTypeLabel(employee.employeeType)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Remaining Days
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatRemainingDays(tracking.remainingDays)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Current End Date
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {currentEndDate}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
            <Clock3 className="size-4" />
            {tracking.kind ? `${tracking.periodLabel} tracking` : "Permanent employee"}
          </span>
          {tracking.remainingDays !== null && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
              <FileClock className="size-4" />
              {formatRemainingDays(tracking.remainingDays)}
            </span>
          )}
        </div>

        {canManage && tracking.kind ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <form action={handleConvertToEmployee}>
                <input type="hidden" name="employeeId" value={employee.id ?? ""} />
                <Button
                  type="submit"
                  className="h-10 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 text-white shadow-md hover:from-cyan-700 hover:to-sky-600"
                >
                  <UserCheck className="size-4" />
                  Convert To Employee
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => setIsExtendOpen((value) => !value)}
              >
                <ArrowRight className="size-4" />
                {isExtendOpen ? "Cancel Extension" : tracking.kind === "PROBATION" ? "Extend Probation" : "Extend Training"}
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-10 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Link href={historyHref}>{viewLabel}</Link>
              </Button>
            </div>

            {isExtendOpen && (
              <form
                action={handleExtendEmployment}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <input type="hidden" name="employeeId" value={employee.id ?? ""} />
                <div className="grid gap-4 md:grid-cols-[0.75fr_1.25fr]">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      New End Date
                    </span>
                    <Input
                      type="date"
                      name="newEndDate"
                      min={currentEndDateMin}
                      defaultValue={currentEndDateMin}
                      className="h-10 rounded-2xl border-slate-200 bg-white"
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Remarks
                    </span>
                    <Textarea
                      name="remarks"
                      placeholder="Optional remarks for the employment review"
                      className="min-h-24 rounded-2xl border-slate-200 bg-white"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    className="h-10 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {tracking.kind === "PROBATION" ? "Save Probation Extension" : "Save Training Extension"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 rounded-2xl text-slate-600 hover:bg-white hover:text-slate-900"
                    onClick={() => setIsExtendOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Link href={historyHref}>{viewLabel}</Link>
            </Button>
          </div>
        )}

        {canManage && !tracking.kind && (
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Link href={historyHref}>{viewLabel}</Link>
            </Button>
          </div>
        )}

        {tracking.kind === null && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            This employee is marked as permanent. Use history to review past
            employment actions.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
