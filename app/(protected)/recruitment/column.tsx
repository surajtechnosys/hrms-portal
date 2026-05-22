import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecruitmentApplication } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { EditIcon, Mail, Trash, UserPlus } from "lucide-react";
import Link from "next/link";

function statusBadgeClass(value?: string) {
  if (value === "SELECTED") return "bg-emerald-500";
  if (value === "ON_HOLD") return "bg-amber-500";
  if (value === "BACK_OUT") return "bg-rose-500";
  if (value === "REJECTED") return "bg-slate-500";
  return "bg-cyan-500";
}

export const getRecruitmentColumns = ({
  canEdit,
  canDelete,
  canCreateEmployeeProfile,
  canInviteApplicants,
  onDelete,
  onInvite,
}: {
  canEdit: boolean;
  canDelete: boolean;
  canCreateEmployeeProfile: boolean;
  canInviteApplicants: boolean;
  onDelete: (id: string) => void;
  onInvite: (id: string) => void;
}): ColumnDef<RecruitmentApplication>[] => {
  const isSelectedCandidate = (record: RecruitmentApplication) =>
    record.internalStatus === "SELECTED" || record.clientFinalStatus === "SELECTED";

  const columns: ColumnDef<RecruitmentApplication>[] = [
    {
      accessorKey: "serialNumber",
      header: "Sl. No.",
      cell: ({ row }) => row.original.serialNumber || "-",
    },
    {
      accessorKey: "requestId",
      header: "Request ID",
    },
    {
      accessorKey: "applicantPortalId",
      header: "Applicant ID",
      cell: ({ row }) => row.original.applicantPortalId || "-",
    },
    {
      accessorKey: "clientProjectName",
      header: "Client / Project Name",
    },
    {
      accessorKey: "candidateName",
      header: "Candidate Name",
    },
    {
      accessorKey: "mobileNumber",
      header: "Mob no.",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "currentLocation",
      header: "Current Location",
      cell: ({ row }) => row.original.currentLocation || "-",
    },
    {
      accessorKey: "preferredLocation",
      header: "Preferred Location",
      cell: ({ row }) => row.original.preferredLocation || "-",
    },
    {
      accessorKey: "profilePost",
      header: "Profile / Post",
    },
    {
      accessorKey: "noticePeriod",
      header: "NP",
      cell: ({ row }) => row.original.noticePeriod || "-",
    },
    {
      accessorKey: "totalExperience",
      header: "Exp.",
      cell: ({ row }) => row.original.totalExperience || "-",
    },
    {
      accessorKey: "relevantExperience",
      header: "Relevant Exp",
      cell: ({ row }) => row.original.relevantExperience || "-",
    },
    {
      accessorKey: "currentCompany",
      header: "Current company",
      cell: ({ row }) => row.original.currentCompany || "-",
    },
    {
      accessorKey: "expectedCtc",
      header: "E.CTC",
      cell: ({ row }) => row.original.expectedCtc || "-",
    },
    {
      accessorKey: "internalStatus",
      header: "Internal Status",
      cell: ({ row }) =>
        row.original.internalStatus ? (
          <Badge className={statusBadgeClass(row.original.internalStatus)}>
            {row.original.internalStatus.replaceAll("_", " ")}
          </Badge>
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "clientFinalStatus",
      header: "Client Final Status",
      cell: ({ row }) =>
        row.original.clientFinalStatus ? (
          <Badge className={statusBadgeClass(row.original.clientFinalStatus)}>
            {row.original.clientFinalStatus.replaceAll("_", " ")}
          </Badge>
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "joined",
      header: "Joined",
      cell: ({ row }) => row.original.joined || "-",
    },
    {
      accessorKey: "actualJoiningDate",
      header: "Actual Joining Date",
      cell: ({ row }) => row.original.actualJoiningDate || "-",
    },
    {
      accessorKey: "applicantInvitedAt",
      header: "Portal Invite",
      cell: ({ row }) =>
        row.original.applicantInvitedAt ? (
          <Badge className="bg-emerald-500">SENT</Badge>
        ) : row.original.applicantPortalEnabled ? (
          <Badge className="bg-cyan-500">ACTIVE</Badge>
        ) : (
          <Badge className="bg-slate-500">NOT SENT</Badge>
        ),
    },
    {
      accessorKey: "applicantDocumentsSubmittedAt",
      header: "Documents",
      cell: ({ row }) =>
        row.original.applicantDocumentsSubmittedAt ? (
          <Badge className="bg-emerald-500">SUBMITTED</Badge>
        ) : (
          <Badge className="bg-amber-500">PENDING</Badge>
        ),
    },
  ];

  if (canEdit || canDelete || canCreateEmployeeProfile || canInviteApplicants) {
    columns.push({
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const id = row.original.id as string;
        const canCreateEmployee = canCreateEmployeeProfile && isSelectedCandidate(row.original);
        const canInviteApplicant = canInviteApplicants && isSelectedCandidate(row.original);

        return (
          <div className="flex flex-wrap gap-2">
            {canInviteApplicant && (
              <Button
                type="button"
                className="bg-cyan-600 hover:bg-cyan-700"
                onClick={() => onInvite(id)}
              >
                <Mail size={16} />
                {row.original.applicantInvitedAt ? "Resend Access" : "Send Access"}
              </Button>
            )}

            {canCreateEmployee && (
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Link href={`/employee-profiles/create?recruitmentId=${id}`}>
                  <UserPlus size={16} />
                  Create Employee
                </Link>
              </Button>
            )}

            {canEdit && (
              <Button
                asChild
                size="icon"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Link href={`/recruitment/edit/${id}`}>
                  <EditIcon size={16} />
                </Link>
              </Button>
            )}

            {canDelete && (
              <Button
                size="icon"
                variant="destructive"
                onClick={() => onDelete(id)}
              >
                <Trash size={16} />
              </Button>
            )}
          </div>
        );
      },
    });
  }

  return columns;
};
