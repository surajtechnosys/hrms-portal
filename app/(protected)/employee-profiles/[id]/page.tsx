import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { prisma } from "@/lib/prisma";
import { getRoutePermissions } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import {
  formatRemainingDays,
  getEmployeeTypeLabel,
  getEmployeeTypeTone,
  getEmploymentTrackingState,
} from "@/lib/employee-employment";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCircle2,
  UserPen,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const formatDate = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const getInitials = (name?: string | null) =>
  name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EP";

function InfoTile({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className={cn("mt-1 break-words text-sm font-semibold text-slate-900", valueClassName)}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-3xl border border-white/70 bg-white/90 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function EmployeeProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const route = "/employee-profiles";
  const [routePermissions, isHrEmployee, resolvedParams] = await Promise.all([
    getRoutePermissions(route),
    isCurrentEmployeeHr(),
    params,
  ]);
  const permissions = isHrEmployee
    ? {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
      }
    : routePermissions;

  if (!permissions.canView) {
    redirect("/404");
  }

  const employeeProfile = await prisma.employeeProfile.findUnique({
    where: { employeeCode: resolvedParams.id },
    include: {
      manager: {
        select: {
          id: true,
          employeeName: true,
          employeeCode: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      jobRole: {
        select: {
          name: true,
        },
      },
      workLocation: {
        select: {
          name: true,
        },
      },
      company: {
        select: {
          companyName: true,
        },
      },
      projectMembers: {
        take: 4,
        orderBy: {
          assignedAt: "desc",
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
      _count: {
        select: {
          employeeDocuments: true,
          projectMembers: true,
          directReports: true,
        },
      },
    },
  });

  if (!employeeProfile) {
    notFound();
  }

  const statusTone =
    employeeProfile.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-rose-50 text-rose-700 ring-rose-200";
  const employmentTracking = getEmploymentTrackingState(employeeProfile);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_42%,#f0f9ff_100%)] shadow-xl shadow-cyan-100/40">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Link
                href="/employee-profiles"
                className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 font-medium text-slate-600 shadow-sm transition hover:text-cyan-700"
              >
                <ArrowLeft className="size-4" />
                Back to profiles
              </Link>
              <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Employee Detail
              </span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-cyan-600 via-sky-500 to-indigo-500 text-2xl font-bold text-white shadow-lg shadow-cyan-200">
                {getInitials(employeeProfile.employeeName)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
                    {employeeProfile.employeeName}
                  </h1>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      statusTone,
                    )}
                  >
                    {employeeProfile.status}
                  </Badge>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      getEmployeeTypeTone(employeeProfile.employeeType),
                    )}
                  >
                    {getEmployeeTypeLabel(employeeProfile.employeeType)}
                  </Badge>
                </div>
                <p className="mt-2 text-base font-medium text-slate-600">
                  {employeeProfile.jobRole?.name || "Role not assigned"} in{" "}
                  {employeeProfile.department?.name || "No department assigned"}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  A polished overview of identity, reporting line, workplace,
                  emergency contacts, and notes for employee code{" "}
                  <span className="font-semibold text-slate-700">
                    {employeeProfile.employeeCode}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                Company: {employeeProfile.company?.companyName || "Not assigned"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                Joined {formatDate(employeeProfile.joiningDate)}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                Location: {employeeProfile.workLocation?.name || "Not assigned"}
              </span>
              {employmentTracking.isTracked && (
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  {employmentTracking.periodLabel} ends in{" "}
                  {formatRemainingDays(employmentTracking.remainingDays)}
                </span>
              )}
            </div>
          </div>

          <Card className="rounded-[28px] border border-white/80 bg-white/90 shadow-lg backdrop-blur">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-slate-500">
                Jump to the most useful workflows connected to this employee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <Button
                asChild
                className="h-11 w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 text-white shadow-md hover:from-cyan-700 hover:to-sky-600"
              >
                <Link href={`/employee-dashboard?employeeId=${employeeProfile.id}`}>
                  <UserCircle2 className="size-4" />
                  Open dashboard view
                </Link>
              </Button>

              {permissions.canEdit && (
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <Link href={`/employee-profiles/edit/${employeeProfile.id}`}>
                    <UserPen className="size-4" />
                    Edit profile
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Link href="/employee-documents">
                  <FileText className="size-4" />
                  View applicant documents
                </Link>
              </Button>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Reporting Manager
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {employeeProfile.manager?.employeeName || "Not assigned"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {employeeProfile.manager?.employeeCode || "No manager code available"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Documents"
          value={employeeProfile._count.employeeDocuments}
          hint="Records attached to this profile"
          icon={FileText}
        />
        <StatCard
          label="Projects"
          value={employeeProfile._count.projectMembers}
          hint="Assignments currently linked"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Direct Reports"
          value={employeeProfile._count.directReports}
          hint="Employees reporting here"
          icon={Users}
        />
        <StatCard
          label="Employee Code"
          value={employeeProfile.employeeCode}
          hint="Primary identity reference"
          icon={BadgeCheck}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border border-white/70 bg-white/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">
                Profile Overview
              </CardTitle>
              <CardDescription className="text-slate-500">
                Core identity for this employee.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
              <InfoTile
                label="Email Address"
                value={employeeProfile.email || "-"}
                icon={Mail}
              />
              <InfoTile
                label="Phone Number"
                value={employeeProfile.phone || "-"}
                icon={Phone}
              />
              <InfoTile
                label="Alternate Phone"
                value={employeeProfile.alternatePhone || "-"}
                icon={Phone}
              />
              <InfoTile
                label="Gender"
                value={employeeProfile.gender || "-"}
                icon={UserCircle2}
              />
              <InfoTile
                label="Date of Birth"
                value={formatDate(employeeProfile.dateOfBirth)}
                icon={CalendarDays}
              />
              <InfoTile
                label="Joining Date"
                value={formatDate(employeeProfile.joiningDate)}
                icon={CalendarDays}
              />
              <InfoTile
                label="Employee Type"
                value={getEmployeeTypeLabel(employeeProfile.employeeType)}
                icon={BadgeCheck}
              />
              {employmentTracking.isTracked && (
                <>
                  <InfoTile
                    label={`${employmentTracking.periodLabel} Start`}
                    value={formatDate(employmentTracking.startDate)}
                    icon={CalendarDays}
                  />
                  <InfoTile
                    label={`${employmentTracking.periodLabel} End`}
                    value={formatDate(employmentTracking.endDate)}
                    icon={CalendarDays}
                  />
                  <InfoTile
                    label="Remaining Days"
                    value={formatRemainingDays(employmentTracking.remainingDays)}
                    icon={CalendarDays}
                  />
                </>
              )}
              <InfoTile
                label="Company"
                value={employeeProfile.company?.companyName || "-"}
                icon={Building2}
              />
              <InfoTile
                label="Department"
                value={employeeProfile.department?.name || "-"}
                icon={Building2}
              />
              <InfoTile
                label="Job Role"
                value={employeeProfile.jobRole?.name || "-"}
                icon={BriefcaseBusiness}
              />
              <InfoTile
                label="Work Location"
                value={employeeProfile.workLocation?.name || "-"}
                icon={MapPin}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/70 bg-white/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">
                Address and Notes
              </CardTitle>
              <CardDescription className="text-slate-500">
                Supporting information shared by HR for this employee profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Address
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {employeeProfile.address || "No address recorded for this employee."}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Remarks
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {employeeProfile.remark || "No additional remarks have been added yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] border border-white/70 bg-white/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">
                Reporting and Emergency
              </CardTitle>
              <CardDescription className="text-slate-500">
                Contact chain and emergency details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <InfoTile
                label="Manager"
                value={employeeProfile.manager?.employeeName || "Not assigned"}
                icon={ShieldCheck}
              />
              <InfoTile
                label="Manager Code"
                value={employeeProfile.manager?.employeeCode || "-"}
                icon={BadgeCheck}
              />
              <InfoTile
                label="Emergency Contact"
                value={employeeProfile.emergencyContactName || "-"}
                icon={HeartHandshake}
              />
              <InfoTile
                label="Emergency Phone"
                value={employeeProfile.emergencyContactPhone || "-"}
                icon={Phone}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/70 bg-white/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">
                Recent Project Links
              </CardTitle>
              <CardDescription className="text-slate-500">
                Latest project assignments connected to this employee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {employeeProfile.projectMembers.length > 0 ? (
                employeeProfile.projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {member.project.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Assigned {formatDate(member.assignedAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-100">
                      {member.project.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No projects linked yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    This employee has not been assigned to any project records.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
