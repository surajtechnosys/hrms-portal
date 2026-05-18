"use client";

import * as React from "react";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  FileText,
  Hourglass,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LeaveRequestRecord } from "@/lib/actions/leave-requests";

type LeaveRequestFormProps = {
  initialRequests: LeaveRequestRecord[];
};

const leaveTypes = [
  { value: "CASUAL", label: "Casual Leave" },
  { value: "SICK", label: "Sick Leave" },
  { value: "EARNED", label: "Earned Leave" },
  { value: "UNPAID", label: "Unpaid Leave" },
  { value: "OTHER", label: "Other" },
];

const statusClasses: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-700",
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus-visible:border-cyan-400 focus-visible:ring-4 focus-visible:ring-cyan-100";
const selectFieldClass = `${fieldClass} data-[size=default]:h-12`;
const surfaceClass =
  "rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_55px_-45px_rgba(15,23,42,0.45)]";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInclusiveDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function getLeaveTypeLabel(value: string) {
  return leaveTypes.find((type) => type.value === value)?.label ?? value;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`h-7 rounded-full border px-3 text-[11px] font-semibold tracking-[0.14em] ${statusClasses[status]}`}>
      {status}
    </Badge>
  );
}

export function LeaveRequestForm({
  initialRequests,
}: LeaveRequestFormProps) {
  const [requests, setRequests] = React.useState(initialRequests);
  const [leaveType, setLeaveType] = React.useState("CASUAL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const upcomingRequest = requests[0];
  const requestedDays = React.useMemo(
    () => getInclusiveDays(startDate, endDate),
    [startDate, endDate],
  );

  const submit = () => {
    startTransition(async () => {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error("Leave Request", { description: result.message });
        return;
      }

      setRequests((current) => [result.data, ...current]);
      setLeaveType("CASUAL");
      setStartDate("");
      setEndDate("");
      setReason("");
      toast.success("Leave Request", { description: result.message });
    });
  };

  return (
    <div className="space-y-5">
      <Card className={`relative overflow-hidden ${surfaceClass}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(236,254,255,0.92),rgba(255,255,255,0))]" />
        <CardHeader className="relative border-b border-slate-100 pb-5">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                <Sparkles className="size-3.5" />
                Leave Planner
              </div>
              <CardTitle className="mt-4 flex items-center gap-3 text-[1.55rem] font-semibold text-slate-950">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                  <CalendarPlus className="size-5" />
                </span>
                Apply for Leave
              </CardTitle>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Choose leave type, set the date range, and add clear context for
                the reviewer. Everything you already submit and track stays in
                the same workflow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock3 className="size-4 text-cyan-700" />
                  Latest status
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {upcomingRequest
                    ? `${upcomingRequest.status} for ${formatDate(upcomingRequest.startDate)}`
                    : "No requests submitted yet"}
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Request Length
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {requestedDays || "--"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {requestedDays ? "days selected" : "Choose dates to preview"}
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Leave Type
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {getLeaveTypeLabel(leaveType)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Update anytime before submitting
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-5 pt-6">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Leave Type
                  </label>
                  <Select
                    value={leaveType}
                    onValueChange={setLeaveType}
                    disabled={isPending}
                  >
                    <SelectTrigger className={selectFieldClass}>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Start Date
                  </label>
                  <Input
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className={fieldClass}
                    type="date"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    End Date
                  </label>
                  <Input
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className={fieldClass}
                    type="date"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Reason
                </label>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Add the reason, handoff context, or any details HR should know"
                  className="min-h-32 rounded-[24px] border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-inner shadow-slate-100/80 transition-all duration-200 hover:border-cyan-300 focus-visible:border-cyan-400 focus-visible:ring-4 focus-visible:ring-cyan-100"
                  disabled={isPending}
                />
              </div>

              <Button
                onClick={submit}
                disabled={isPending}
                className="h-12 rounded-2xl bg-cyan-700 px-5 text-sm font-semibold shadow-[0_18px_32px_-20px_rgba(8,145,178,0.85)] hover:bg-cyan-800"
              >
                <Send />
                Submit Request
              </Button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarDays className="size-4 text-cyan-700" />
                Request preview
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Selected Type
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {getLeaveTypeLabel(leaveType)}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Date Window
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {startDate ? formatDate(startDate) : "Start date"}{" "}
                    <span className="text-slate-400">to</span>{" "}
                    {endDate ? formatDate(endDate) : "End date"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Total Days
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {requestedDays ? `${requestedDays} day${requestedDays > 1 ? "s" : ""}` : "Will appear here"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Review Tip
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mention handoff coverage, urgency, or any supporting context
                    to help HR review faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={surfaceClass}>
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-950">My Leave Requests</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Every request, decision, and review remark in one timeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                <Hourglass className="size-3.5" />
                {requests.filter((request) => request.status === "PENDING").length} pending
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                {requests.filter((request) => request.status === "APPROVED").length} approved
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                <XCircle className="size-3.5" />
                {requests.filter((request) => request.status === "REJECTED").length} rejected
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4 md:hidden">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request.leaveType.replace("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(request.startDate)} to {formatDate(request.endDate)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Total Days
                    </p>
                    <p className="mt-1 text-slate-900">{request.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Reason
                    </p>
                    <p className="mt-1 leading-6 text-slate-600">{request.reason}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Review
                    </p>
                    <p className="mt-1 leading-6 text-slate-600">
                      {request.reviewRemark || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {!requests.length && (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-slate-500">
                No leave requests submitted yet.
              </div>
            )}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 md:block">
            <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Dates</th>
                  <th className="px-4 py-4">Days</th>
                  <th className="px-4 py-4">Reason</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Review</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr
                    key={request.id}
                    className={`border-b border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {request.leaveType.replace("_", " ")}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(request.startDate)} to{" "}
                      {formatDate(request.endDate)}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">{request.totalDays}</td>
                    <td className="max-w-[280px] px-4 py-4">
                      <span className="line-clamp-2 text-slate-600">{request.reason}</span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="max-w-[260px] px-4 py-4 text-slate-600">
                      <div className="inline-flex items-start gap-2 leading-6">
                        <FileText className="mt-0.5 size-4 shrink-0 text-cyan-700" />
                        <span>{request.reviewRemark || "-"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!requests.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No leave requests submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
