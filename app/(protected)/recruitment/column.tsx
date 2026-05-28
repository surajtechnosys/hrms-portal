import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecruitmentApplication } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { EditIcon, Mail, Trash, UserPlus } from "lucide-react";
import Link from "next/link";

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
      cell: ({ row, table }) => {
        const visibleIndex = table
          .getRowModel()
          .rows.findIndex((visibleRow) => visibleRow.id === row.id);
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;

        return visibleIndex >= 0
          ? visibleIndex + 1 + pageIndex * pageSize
          : row.original.serialNumber || "-";
      },
    },
    {
      accessorKey: "candidateName",
      header: "Candidate Name",
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => row.original.gender || "-",
    },
    {
      accessorKey: "dateOfBirth",
      header: "DOB",
      cell: ({ row }) => row.original.dateOfBirth || "-",
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
      accessorKey: "currentCtc",
      header: "C.CTC",
      cell: ({ row }) => row.original.currentCtc || "-",
    },
    {
      accessorKey: "expectedCtc",
      header: "E.CTC",
      cell: ({ row }) => row.original.expectedCtc || "-",
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
        const canInviteApplicant = canInviteApplicants && !!row.original.email;

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
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link href={`/recruitment/edit/${id}`}>
                  <EditIcon size={16} />
                </Link>
              </Button>
            )}

            {canDelete && (
              <Button
                size="icon"
                className="bg-red-600 hover:bg-red-700"
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
