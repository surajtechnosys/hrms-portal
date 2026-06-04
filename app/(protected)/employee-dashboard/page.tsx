import { auth } from "@/auth";
import { getAttendanceDashboard } from "@/lib/actions/attendance";
import { getLeaveDashboard } from "@/lib/actions/leave-requests";
import { getEmployeeProfiles } from "@/lib/actions/employee-profiles";
import { getEmployeeDocuments } from "@/lib/actions/employee-documents";
import { getInterviewWorkspace } from "@/lib/actions/interviews";
import { getLeaveRequests } from "@/lib/actions/leave-requests";
import InterviewDataTable from "@/components/interviews/interview-data-table";
import { LeaveRequestReviewTable } from "@/components/leave-requests/leave-request-review-table";
import {
  isCurrentEmployeeHr,
  isCurrentEmployeeManager,
} from "@/lib/employee-job-role";
import { prisma } from "@/lib/prisma";
import {
  ArrowRightLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartHandshake,
  Plus,
  MapPin,
  Phone,
  UserCircle2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const formatDate = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

export default async function EmployeeDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ employeeId?: string }>;
}) {
  const session = await auth();
  const selectedEmployeeId = (await searchParams)?.employeeId;
  const isEmployee = session?.user?.role?.toLowerCase() === "employee";
  const isHrEmployee = isEmployee ? await isCurrentEmployeeHr() : false;
  const isManagerEmployee =
    isEmployee && !isHrEmployee ? await isCurrentEmployeeManager() : false;

  if (!session?.user?.email) {
    redirect("/");
  }

  if (!isEmployee) {
    const [employeeProfiles, selectedEmployeeDetails] = await Promise.all([
      prisma.employeeProfile.findMany({
        orderBy: [{ employeeName: "asc" }, { employeeCode: "asc" }],
        include: {
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
          manager: {
            select: {
              employeeName: true,
            },
          },
        },
      }),
      selectedEmployeeId
        ? prisma.employeeProfile.findUnique({
            where: {
              id: selectedEmployeeId,
            },
            include: {
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
              manager: {
                select: {
                  employeeName: true,
                },
              },
              employeeDocuments: {
                orderBy: {
                  updatedAt: "desc",
                },
                take: 6,
              },
              projectMembers: {
                orderBy: {
                  assignedAt: "desc",
                },
                include: {
                  project: {
                    select: {
                      id: true,
                      name: true,
                      status: true,
                      startDate: true,
                      endDate: true,
                      description: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    const activeEmployees = employeeProfiles.filter(
      (profile) => profile.status === "ACTIVE",
    ).length;
    const selectedEmployee = selectedEmployeeDetails;

    if (selectedEmployee) {
      return (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-700">
                  Employee Dashboard
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                  {selectedEmployee.employeeName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600">
                  Employee-specific details, documents, and active project associations in one place.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
                    {selectedEmployee.employeeCode || "Employee code not assigned"}
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
                    {selectedEmployee.jobRole?.name || "Role not assigned"}
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
                    Joined {formatDate(selectedEmployee.joiningDate)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Quick Actions</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Move between profile records and supporting modules.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {selectedEmployee.status}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/employee-profiles"
                    className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Back to employees
                  </Link>
                  <Link
                    href={`/employee-profiles/edit/${selectedEmployee.id}`}
                    className="inline-flex h-10 items-center rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700"
                  >
                    Edit profile
                  </Link>
                  <Link
                    href="/employee-documents"
                    className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    All documents
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Department</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {selectedEmployee.department?.name || "Not assigned"}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Work Location</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {selectedEmployee.workLocation?.name || "Not assigned"}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Documents</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {selectedEmployee.employeeDocuments.length}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Projects</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {selectedEmployee.projectMembers.length}
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Employment Details
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {selectedEmployee.email || "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {selectedEmployee.phone || "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Manager</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {selectedEmployee.manager?.employeeName || "Not assigned"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Joining Date</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(selectedEmployee.joiningDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-50 p-3 text-cyan-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    HR Snapshot
                  </h2>
                  <p className="text-sm text-slate-500">
                    Quick context for review.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Total Employees</span>
                  <strong className="text-slate-900">{employeeProfiles.length}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Employees</span>
                  <strong className="text-slate-900">{activeEmployees}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Document Reviews</span>
                  <strong className="text-slate-900">
                    {
                      selectedEmployee.employeeDocuments.filter(
                        (document) => document.reviewStatus === "PENDING",
                      ).length
                    }
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Project Assignments</span>
                  <strong className="text-slate-900">{selectedEmployee.projectMembers.length}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-50 p-3 text-cyan-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Employee Documents
                  </h2>
                  <p className="text-sm text-slate-500">
                    Documents attached to this employee profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {selectedEmployee.employeeDocuments.length ? (
                selectedEmployee.employeeDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {document.experienceType.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Updated {formatDate(document.updatedAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {document.reviewStatus}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p>Aadhaar: {document.aadhaarNumber || "-"}</p>
                      <p>PAN: {document.panNumber || "-"}</p>
                      <p>Status: {document.status}</p>
                      <p>Remark: {document.reviewRemark || "-"}</p>
                    </div>

                    <Link
                      href={`/employee-documents/edit/${document.id}`}
                      className="mt-4 inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      Open document
                    </Link>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                  No employee documents added yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-50 p-3 text-cyan-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Project Memberships
                  </h2>
                  <p className="text-sm text-slate-500">
                    Projects where this employee is currently included.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {selectedEmployee.projectMembers.length ? (
                selectedEmployee.projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {member.project.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Assigned {formatDate(member.assignedAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {member.project.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p>Start: {formatDate(member.project.startDate)}</p>
                      <p>End: {formatDate(member.project.endDate)}</p>
                      <p>{member.project.description || "No project description added yet."}</p>
                    </div>

                    <Link
                      href={`/project-members/${member.project.id}`}
                      className="mt-4 inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      View project team
                    </Link>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                  This employee is not assigned to any project yet.
                </div>
              )}
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 p-6 shadow-sm lg:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-700">
            Employee Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">All Employees Overview</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Admin and HR users can review every employee from one place.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-cyan-700">Total Employees</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{employeeProfiles.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-cyan-700">Active Employees</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{activeEmployees}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-cyan-700">View Full Records</p>
              <Link
                href="/employee-profiles"
                className="mt-2 inline-flex text-sm font-medium text-cyan-700 underline underline-offset-4"
              >
                Open employee profiles
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Employee List
              </h2>
              <p className="text-sm text-slate-500">
                Quick visibility into every employee linked to the HRMS.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {employeeProfiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {profile.employeeName}
                    </h3>
                    <p className="text-sm text-slate-500">{profile.employeeCode}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {profile.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Email: {profile.email || "-"}</p>
                  <p>Phone: {profile.phone || "-"}</p>
                  <p>Department: {profile.department?.name || "Not assigned"}</p>
                  <p>Manager: {profile.manager?.employeeName || "Not assigned"}</p>
                  <p>Job Role: {profile.jobRole?.name || "Not assigned"}</p>
                  <p>Location: {profile.workLocation?.name || "Not assigned"}</p>
                  <p>Joining Date: {formatDate(profile.joiningDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (isEmployee && isHrEmployee) {
    const [employeeProfile, employeeProfiles, leaveSummary, attendanceSummary, leaveRequests, documents] =
      await Promise.all([
        prisma.employeeProfile.findFirst({
          where: {
            email: session.user.email,
          },
          include: {
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
            manager: {
              select: {
                employeeName: true,
              },
            },
            workLocation: {
              select: {
                name: true,
              },
            },
          },
        }),
        getEmployeeProfiles(),
        getLeaveDashboard(),
        getAttendanceDashboard(),
        getLeaveRequests(),
        getEmployeeDocuments(),
      ]);

    if (!employeeProfile) {
      return (
        <div className="min-h-screen bg-slate-50 p-3 md:p-5">
          <div className="mx-auto max-w-5xl rounded-lg border bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">
              Employee Dashboard
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Your account is logged in, but no employee profile is linked yet.
              Please contact HR or admin to complete your profile setup.
            </p>
          </div>
        </div>
      );
    }

    const pendingDocs = documents.filter(
      (document) => document.reviewStatus === "PENDING",
    );
    const approvedApplicantDocuments = documents.filter(
      (document) =>
        document.reviewStatus === "APPROVED" && !document.linkedEmployeeId,
    );
    const pendingLeaveRequests = leaveRequests.filter(
      (request) => request.status === "PENDING",
    );

    return (
      <div className="min-h-screen bg-slate-50 p-3 md:p-5">
        <div className="w-full space-y-6">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-700">
                  HR Employee Dashboard
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                  {employeeProfile.employeeName}
                </h1>
                <p className="mt-3 max-w-xl text-sm text-slate-600">
                  Review employee records, approve leave and document uploads,
                  and keep the team moving from one place.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/employee-profiles"
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-cyan-800 shadow-sm"
                  >
                    Employee Profiles
                  </Link>
                  <Link
                    href="/attendance"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Attendance
                  </Link>
                  <Link
                    href="/leave-requests"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Leave Requests
                  </Link>
                  <Link
                    href="/employee-documents"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Document Review
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-700">
                  HR Snapshot
                </p>
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Total Employees</span>
                    <strong className="text-slate-900">{employeeProfiles.length}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending Leaves</span>
                    <strong className="text-slate-900">{leaveSummary.pending}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending Document Reviews</span>
                    <strong className="text-slate-900">{pendingDocs.length}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Today Attendance Records</span>
                    <strong className="text-slate-900">{attendanceSummary.todayRecords.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Employees",
                value: employeeProfiles.length,
              },
              {
                label: "Active",
                value: employeeProfiles.filter((profile) => profile.status === "ACTIVE").length,
              },
              {
                label: "Leave Pending",
                value: leaveSummary.pending,
              },
              {
                label: "Doc Reviews",
                value: pendingDocs.length,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Approved Applicant Documents
                </h2>
                <p className="text-sm text-slate-500">
                  Turn approved applicant documents into employee profiles from here.
                </p>
              </div>
              <Link
                href="/employee-documents"
                className="text-sm font-medium text-cyan-700"
              >
                Open document module
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {approvedApplicantDocuments.slice(0, 6).map((document) => (
                <div
                  key={document.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {document.candidateName || "Applicant"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {document.employeeCode || document.applicantCode || document.applicantId || "-"}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      APPROVED
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    <p>Mobile: {document.mobileNumber || "-"}</p>
                    <p>Aadhaar: {document.aadhaarNumber || "-"}</p>
                    <p>PAN: {document.panNumber || "-"}</p>
                  </div>

                  <Link
                    href={`/employee-profiles/create?sourceApplicantDocumentId=${document.id}`}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Employee
                  </Link>
                </div>
              ))}

              {!approvedApplicantDocuments.length && (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                  No approved applicant documents are ready for employee creation.
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Leave Approvals
                  </h2>
                  <p className="text-sm text-slate-500">
                    Review and approve leave requests from the team.
                  </p>
                </div>
                <Link
                  href="/leave-requests"
                  className="text-sm font-medium text-cyan-700"
                >
                  Open module
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {pendingLeaveRequests.slice(0, 4).map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {request.employeeName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {request.leaveType.replace("_", " ")} - {request.totalDays} days
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{request.reason}</p>
                  </div>
                ))}
                {!pendingLeaveRequests.length && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    No pending leave requests right now.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Document Reviews
                  </h2>
                  <p className="text-sm text-slate-500">
                    Approve or reject employee uploads with remarks.
                  </p>
                </div>
                <Link
                  href="/employee-documents"
                  className="text-sm font-medium text-cyan-700"
                >
                  Open module
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {pendingDocs.slice(0, 4).map((document) => (
                  <div
                    key={document.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {document.employeeName || "Employee"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {document.employeeCode} - {document.experienceType.replaceAll("_", " ")}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        {document.reviewStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {document.reviewRemark || "Awaiting HR review"}
                    </p>
                  </div>
                ))}
                {!pendingDocs.length && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    No pending document reviews right now.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Leave Approval Queue
                </h2>
                <p className="text-sm text-slate-500">
                  Review and resolve pending requests directly inside the HR dashboard.
                </p>
              </div>
              <Link
                href="/leave-requests"
                className="text-sm font-medium text-cyan-700"
              >
                Open full module
              </Link>
            </div>
            <LeaveRequestReviewTable initialRequests={leaveRequests} />
          </section>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Employee Management Modules
                </h2>
                <p className="text-sm text-slate-500">
                  Quick links into the HR tools already built into the portal.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Employee Profiles", href: "/employee-profiles" },
                { label: "Department", href: "/department" },
                { label: "Job Roles", href: "/job-roles" },
                { label: "Work Location", href: "/work-location" },
                { label: "Employee Documents", href: "/employee-documents" },
                { label: "Recruitment", href: "/recruitment-intake" },
                { label: "Pre-Onboarding", href: "/recruitment" },
                { label: "Attendance", href: "/attendance" },
                { label: "Leave Requests", href: "/leave-requests" },
                { label: "Transfer & Promotion", href: "/transfer-promotion" },
                { label: "Document Review Queue", href: "/employee-documents" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isEmployee && isManagerEmployee) {
    const [employeeProfile, interviewWorkspace] = await Promise.all([
      prisma.employeeProfile.findFirst({
        where: {
          email: session.user.email,
          status: "ACTIVE",
        },
        include: {
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
          manager: {
            select: {
              employeeName: true,
            },
          },
          workLocation: {
            select: {
              name: true,
            },
          },
        },
      }),
      getInterviewWorkspace(),
    ]);

    if (!employeeProfile) {
      return (
        <div className="min-h-screen bg-slate-50 p-3 md:p-5">
          <div className="mx-auto max-w-5xl rounded-lg border bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">
              Manager Dashboard
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Your manager login is active, but no active employee profile is
              linked to this email yet.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 p-3 md:p-5">
        <div className="w-full space-y-6">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
              <div>
                <p className="text-sm uppercase text-cyan-700">
                  Manager Interview Workspace
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                  {employeeProfile.employeeName}
                </h1>
                <p className="mt-3 max-w-xl text-sm text-slate-600">
                  This employee dashboard is focused only on interview assignments. HR schedules interviews, and managers or interviewers respond from their assigned queue.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/interviews"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-cyan-800 shadow-sm"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Open Interview Queue
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-700">
                  Interview Access
                </p>
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <span>Portal role</span>
                    <strong className="text-slate-900">Employee</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Job role</span>
                    <strong className="text-slate-900">{employeeProfile.jobRole?.name || "Not assigned"}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Assigned interviews</span>
                    <strong className="text-slate-900">{interviewWorkspace.records.length}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Pending feedback</span>
                    <strong className="text-slate-900">{interviewWorkspace.stats.pendingFeedback}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <InterviewDataTable
            data={interviewWorkspace.records}
            stats={interviewWorkspace.stats}
            canManageAll={false}
            showStats={false}
          />
        </div>
      </div>
    );
  }

  const employeeProfile = await prisma.employeeProfile.findFirst({
    where: {
      email: session.user.email,
    },
    include: {
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
      manager: {
        select: {
          employeeName: true,
        },
      },
      workLocation: {
        select: {
          name: true,
        },
      },
      employeeDocuments: {
        select: {
          id: true,
          aadhaarNumber: true,
          panNumber: true,
          experienceType: true,
          reviewStatus: true,
          reviewRemark: true,
          status: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      },
      transferPromotions: {
        select: {
          id: true,
          movementType: true,
          effectiveDate: true,
        },
        orderBy: {
          effectiveDate: "desc",
        },
        take: 3,
      },
    },
  });

  if (!employeeProfile) {
    return (
      <div className="min-h-screen bg-slate-50 p-3 md:p-5">
        <div className="mx-auto max-w-5xl rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Employee Dashboard
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Your account is logged in, but no employee profile is linked yet.
            Please contact HR or admin to complete your profile setup.
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    employeeProfile.employeeName ||
    [
      session.user.firstName,
      session.user.lastName,
      session.user.name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Employee";
  const leaveSummary = await getLeaveDashboard();

  const quickStats = [
    {
      title: "Employee ID",
      value: employeeProfile.employeeCode,
      icon: BadgeCheck,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      title: "Department",
      value: employeeProfile.department?.name || "Not assigned",
      icon: BriefcaseBusiness,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Location",
      value: employeeProfile.workLocation?.name || "Not assigned",
      icon: MapPin,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      title: "Documents",
      value: String(employeeProfile.employeeDocuments.length),
      icon: FileText,
      tone: "bg-rose-50 text-rose-700",
    },
    {
      title: "Pending Leave",
      value: String(leaveSummary.pending),
      icon: CalendarDays,
      tone: "bg-indigo-50 text-indigo-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-5">
      <div className="w-full space-y-6">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-700">
                Employee Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">{displayName}</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600">
                Your work profile, key details, and latest updates all in one
                place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
                  {employeeProfile.jobRole?.name || "Role not assigned"}
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
                  Joined {formatDate(employeeProfile.joiningDate)}
                </div>
                <Link
                  href="/leave-requests/my"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-cyan-800 shadow-sm transition hover:bg-cyan-50"
                >
                  <Plus className="h-4 w-4" />
                  Apply Leave
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-700">Profile Snapshot</p>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-4 w-4 text-cyan-700" />
                  <span>{displayName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-cyan-700" />
                  <span>{employeeProfile.phone || "Phone not added"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-cyan-700" />
                  <span>{formatDate(employeeProfile.joiningDate)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <HeartHandshake className="h-4 w-4 text-cyan-700" />
                  <span>
                    {employeeProfile.emergencyContactName
                      ? `${employeeProfile.emergencyContactName} (${employeeProfile.emergencyContactPhone || "No number"})`
                      : "Emergency contact not added"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((item) => (
            <div key={item.title} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${item.tone}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Employment Details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 font-medium text-slate-900">
                  {session.user.email || "-"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Job Role</p>
                <p className="mt-1 font-medium text-slate-900">
                  {employeeProfile.jobRole?.name || "Not assigned"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Department</p>
                <p className="mt-1 font-medium text-slate-900">
                  {employeeProfile.department?.name || "Not assigned"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Manager</p>
                <p className="mt-1 font-medium text-slate-900">
                  {employeeProfile.manager?.employeeName || "Not assigned"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Work Location</p>
                <p className="mt-1 font-medium text-slate-900">
                  {employeeProfile.workLocation?.name || "Not assigned"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-50 p-3 text-cyan-700">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Movement
                </h2>
                <p className="text-sm text-slate-500">
                  Latest transfer and promotion activity linked to your profile.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {employeeProfile.transferPromotions.length ? (
                employeeProfile.transferPromotions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <p className="font-medium text-slate-900">
                      {item.movementType.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Effective {formatDate(item.effectiveDate)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No movement history found yet.
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
