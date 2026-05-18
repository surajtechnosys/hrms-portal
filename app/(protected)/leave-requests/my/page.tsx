import { redirect } from "next/navigation";

import { LeaveRequestForm } from "@/components/leave-requests/leave-request-form";
import { Card, CardContent } from "@/components/ui/card";
import {
  getLeaveDashboard,
  getLeaveRequests,
} from "@/lib/actions/leave-requests";
import {
  getRoutePermissions,
  getUserPermissions,
  isEmployeeRole,
} from "@/lib/rbac";

export default async function MyLeaveRequestsPage() {
  const [permissions, user] = await Promise.all([
    getRoutePermissions("/leave-requests/my"),
    getUserPermissions(),
  ]);

  if (!permissions.canView || !isEmployeeRole(user?.role?.name)) {
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_45%),linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0))]" />
        <div className="relative grid gap-6 p-5 md:p-7 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Self Service
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                My Leave Requests
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
                Apply for leave, keep your dates organized, and follow the review
                status from HR or admin.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
                {summary.pending} requests are in review
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {resolvedRequests} already resolved
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                Submit once and track remarks here
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[26px] border border-slate-200/80 bg-white/95 p-4 text-sm text-slate-700 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)] backdrop-blur sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Pending
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.pending}</p>
              <p className="mt-1 text-xs text-slate-500">Still waiting for review</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Total
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{totalRequests}</p>
              <p className="mt-1 text-xs text-slate-500">Requests submitted so far</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Approved
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{summary.approved}</p>
              <p className="mt-1 text-xs text-slate-500">Accepted and recorded</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">
                Rejected
              </p>
              <p className="mt-2 text-3xl font-semibold text-rose-600">{summary.rejected}</p>
              <p className="mt-1 text-xs text-slate-500">Check review remarks below</p>
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
              Under review
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
              Confirmed leave
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
              Review remarks available
            </p>
          </CardContent>
        </Card>
      </div>

      <LeaveRequestForm initialRequests={requests} />
    </div>
  );
}
