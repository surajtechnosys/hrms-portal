"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Sparkles,
  UserRound,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import type { LeaveRequestRecord } from "@/lib/actions/leave-requests";

type LeaveRequestReviewTableProps = {
  initialRequests: LeaveRequestRecord[];
};

const statusClasses: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-700",
};

const surfaceClass =
  "rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_55px_-45px_rgba(15,23,42,0.45)]";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`h-7 rounded-full border px-3 text-[11px] font-semibold tracking-[0.14em] ${statusClasses[status]}`}>
      {status}
    </Badge>
  );
}

export function LeaveRequestReviewTable({
  initialRequests,
}: LeaveRequestReviewTableProps) {
  const [requests, setRequests] = React.useState(initialRequests);
  const [remarks, setRemarks] = React.useState<Record<string, string>>({});
  const [pendingId, setPendingId] = React.useState("");
  const pendingCount = requests.filter((request) => request.status === "PENDING").length;
  const approvedCount = requests.filter((request) => request.status === "APPROVED").length;
  const rejectedCount = requests.filter((request) => request.status === "REJECTED").length;

  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    setPendingId(id);
    const response = await fetch(`/api/leave-requests/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        reviewRemark: remarks[id] || "",
      }),
    });
    const result = await response.json();
    setPendingId("");

    if (!result.success) {
      toast.error("Leave Request", { description: result.message });
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === id ? result.data : request,
      ),
    );
    toast.success("Leave Request", { description: result.message });
  };

  return (
    <Card className={`relative overflow-hidden ${surfaceClass}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0))]" />
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles className="size-3.5" />
              Review Desk
            </div>
            <CardTitle className="mt-4 text-xl text-slate-950">Leave Requests</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pending rows stay editable until a review decision is saved.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              <Clock3 className="size-3.5" />
              {pendingCount} pending
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              {approvedCount} approved
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
              <XCircle className="size-3.5" />
              {rejectedCount} rejected
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-4 lg:hidden">
          {requests.map((request) => {
            const isPending = request.status === "PENDING";

            return (
              <div
                key={request.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request.employeeName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {request.employeeCode} - {request.departmentName}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Type
                      </p>
                      <p className="mt-1 text-slate-900">
                        {request.leaveType.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Days
                      </p>
                      <p className="mt-1 text-slate-900">{request.totalDays}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Dates
                    </p>
                    <p className="mt-1 text-slate-600">
                      {formatDate(request.startDate)} to {formatDate(request.endDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Reason
                    </p>
                    <p className="mt-1 leading-6 text-slate-600">{request.reason}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Review Remark
                    </p>
                    {isPending ? (
                      <Textarea
                        value={remarks[request.id] || ""}
                        onChange={(event) =>
                          setRemarks((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-24 rounded-[20px] border-slate-200 bg-white px-3 py-2"
                        placeholder="Optional remark"
                        disabled={pendingId === request.id}
                      />
                    ) : (
                      <div className="mt-2 inline-flex items-start gap-2 leading-6 text-slate-600">
                        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-cyan-700" />
                        <span>{request.reviewRemark || "-"}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Action
                    </p>
                    {isPending ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          disabled={!!pendingId}
                          onClick={() => review(request.id, "APPROVED")}
                        >
                          <Check />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-slate-300 bg-white"
                          disabled={!!pendingId}
                          onClick={() => review(request.id, "REJECTED")}
                        >
                          <X />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                        <UserRound className="size-4 text-cyan-700" />
                        Reviewed by {request.reviewedByName || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!requests.length && (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-slate-500">
              No leave requests found.
            </div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 lg:block">
          <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <th className="px-4 py-4">Employee</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Dates</th>
                <th className="px-4 py-4">Days</th>
                <th className="px-4 py-4">Reason</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Review Remark</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => {
                const isPending = request.status === "PENDING";

                return (
                  <tr
                    key={request.id}
                    className={`border-b border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {request.employeeName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {request.employeeCode} - {request.departmentName}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {request.leaveType.replace("_", " ")}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(request.startDate)} to{" "}
                      {formatDate(request.endDate)}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">{request.totalDays}</td>
                    <td className="max-w-[240px] px-4 py-4">
                      <span className="line-clamp-2 text-slate-600">{request.reason}</span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-4">
                      {isPending ? (
                        <Textarea
                          value={remarks[request.id] || ""}
                          onChange={(event) =>
                            setRemarks((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          className="min-h-20 min-w-52 rounded-[20px] border-slate-200 bg-white px-3 py-2"
                          placeholder="Optional remark"
                          disabled={pendingId === request.id}
                        />
                      ) : (
                        <span className="inline-flex items-start gap-2 text-slate-600">
                          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-cyan-700" />
                          {request.reviewRemark || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isPending ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                            disabled={!!pendingId}
                            onClick={() => review(request.id, "APPROVED")}
                          >
                            <Check />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-slate-300 bg-white"
                            disabled={!!pendingId}
                            onClick={() => review(request.id, "REJECTED")}
                          >
                            <X />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Reviewed by {request.reviewedByName || "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!requests.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

