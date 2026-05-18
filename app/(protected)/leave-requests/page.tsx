import { redirect } from "next/navigation";

import { LeaveRequestReviewTable } from "@/components/leave-requests/leave-request-review-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  getLeaveDashboard,
  getLeaveRequests,
} from "@/lib/actions/leave-requests";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import {
  canManageAllAttendance,
  getRoutePermissions,
  getUserPermissions,
} from "@/lib/rbac";

export default async function LeaveRequestsPage() {
  const [permissions, user] = await Promise.all([
    getRoutePermissions("/leave-requests"),
    getUserPermissions(),
  ]);
  const isHrEmployee = await isCurrentEmployeeHr();

  if (
    (!permissions.canView || !canManageAllAttendance(user?.role?.name)) &&
    !isHrEmployee
  ) {
    redirect("/404");
  }

  const [requests, summary] = await Promise.all([
    getLeaveRequests(),
    getLeaveDashboard(),
  ]);
  const totalRequests = requests.length;
  const resolvedRequests = summary.approved + summary.rejected;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.35)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0))]" />
        <div className="relative grid gap-6 p-5 md:p-7 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Review Queue
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Leave Requests
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
                Review employee leave requests, capture remarks, and resolve the
                approval queue with the live attendance sync already in place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
                {summary.pending} pending decisions
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {resolvedRequests} reviewed requests
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                Attendance sync stays aligned after approval
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[26px] border border-slate-200/80 bg-white/95 p-4 text-sm text-slate-700 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)] backdrop-blur sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Pending
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.pending}</p>
              <p className="mt-1 text-xs text-slate-500">Waiting for reviewer action</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Total
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{totalRequests}</p>
              <p className="mt-1 text-xs text-slate-500">Requests in the current queue</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Approved
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{summary.approved}</p>
              <p className="mt-1 text-xs text-slate-500">Processed successfully</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Rejected
              </p>
              <p className="mt-2 text-3xl font-semibold text-rose-600">{summary.rejected}</p>
              <p className="mt-1 text-xs text-slate-500">Closed with reviewer feedback</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[24px] border-slate-200 bg-white shadow-[0_20px_48px_-42px_rgba(245,158,11,0.65)]">
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">
              {summary.pending}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              Needs action now
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-slate-200 bg-white shadow-[0_20px_48px_-42px_rgba(16,185,129,0.65)]">
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-slate-500">Approved</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">
              {summary.approved}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              Synced to attendance
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-slate-200 bg-white shadow-[0_20px_48px_-42px_rgba(244,63,94,0.65)]">
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-slate-500">Rejected</p>
            <p className="mt-2 text-3xl font-semibold text-rose-600">
              {summary.rejected}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              Closed with remarks
            </p>
          </CardContent>
        </Card>
      </div>

      <LeaveRequestReviewTable initialRequests={requests} />
    </div>
  );
}
