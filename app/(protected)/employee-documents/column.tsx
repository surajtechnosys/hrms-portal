import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDocumentReviewBadgeClass } from "@/lib/document-review";
import { EmployeeDocument } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, EditIcon, Trash } from "lucide-react";
import Link from "next/link";

export const getEmployeeDocumentColumns = ({
  canEdit,
  canDelete,
  canReview,
  onDelete,
  onView,
}: {
  canEdit: boolean;
  canDelete: boolean;
  canReview: boolean;
  onDelete: (id: string) => void;
  onView: (document: EmployeeDocument) => void;
}): ColumnDef<EmployeeDocument>[] => {
  const columns: ColumnDef<EmployeeDocument>[] = [
    {
      id: "ownerName",
      header: "Name",
      size: 180,
      cell: ({ row }) => (
        <span
          className="block max-w-[180px] truncate"
          title={
            row.original.ownerName ||
            row.original.employeeName ||
            row.original.candidateName ||
            "-"
          }
        >
          {row.original.ownerName ||
            row.original.employeeName ||
            row.original.candidateName ||
            "-"}
        </span>
      ),
    },
    {
      id: "ownerCode",
      header: "Employee / Applicant ID",
      size: 220,
      cell: ({ row }) => (
        <span
          className="block max-w-[220px] truncate font-mono text-[13px]"
          title={
            row.original.ownerCode ||
            row.original.employeeCode ||
            row.original.applicantCode ||
            row.original.applicantId ||
            "-"
          }
        >
          {row.original.ownerCode ||
            row.original.employeeCode ||
            row.original.applicantCode ||
            row.original.applicantId ||
            "-"}
        </span>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      header: "DOB",
      size: 120,
      cell: ({ row }) => row.original.dateOfBirth || "-",
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile Number",
      size: 150,
      cell: ({ row }) => row.original.mobileNumber || "-",
    },
    {
      accessorKey: "qualification",
      header: "Qualification",
      size: 180,
      cell: ({ row }) => row.original.qualification || "-",
    },
    {
      accessorKey: "experienceType",
      header: "Experience Type",
      size: 160,
      cell: ({ row }) => (
        <span
          className="block max-w-[160px] truncate"
          title={row.original.experienceType?.replaceAll("_", " ") || "-"}
        >
          {row.original.experienceType?.replaceAll("_", " ") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "aadhaarNumber",
      header: "Aadhaar Number",
      size: 180,
      cell: ({ row }) => (
        <span
          className="block max-w-[180px] truncate font-mono text-[13px]"
          title={row.original.aadhaarNumber || "-"}
        >
          {row.original.aadhaarNumber || "-"}
        </span>
      ),
    },
    {
      accessorKey: "panNumber",
      header: "PAN Number",
      size: 160,
      cell: ({ row }) => (
        <span
          className="block max-w-[160px] truncate font-mono text-[13px]"
          title={row.original.panNumber || "-"}
        >
          {row.original.panNumber || "-"}
        </span>
      ),
    },
    {
      accessorKey: "reviewStatus",
      header: "Review",
      size: 140,
      cell: ({ row }) => (
        <Badge
          className={getDocumentReviewBadgeClass(
            row.original.reviewStatus ?? "PENDING",
          )}
        >
          {row.original.reviewStatus ?? "PENDING"}
        </Badge>
      ),
    },
    {
      accessorKey: "reviewRemark",
      header: "Review Remark",
      size: 280,
      cell: ({ row }) => (
        <span
          className="block max-w-[280px] truncate"
          title={row.original.reviewRemark || "-"}
        >
          {row.original.reviewRemark || "-"}
        </span>
      ),
    },
  ];

  if (canEdit || canDelete || canReview) {
    columns.push({
      id: "actions",
      header: "Action",
      size: 270,
      cell: ({ row }) => {
        const id = row.original.id as string;

        return (
          <div className="flex flex-nowrap items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onView(row.original)}
              title="View document"
            >
              <Eye size={16} />
            </Button>

            {canReview && row.original.reviewStatus === "PENDING" && (
              <Badge className="bg-amber-100 text-amber-700">Review open</Badge>
            )}

            {canEdit && (
              <Button
                asChild
                size="icon"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Link href={`/employee-documents/edit/${id}`}>
                  <EditIcon size={16} />
                </Link>
              </Button>
            )}

            {row.original.reviewStatus === "APPROVED" &&
            row.original.linkedEmployeeId ? (
              <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                {row.original.linkedEmployeeCode?.trim()
                  ? `Linked to ${row.original.linkedEmployeeCode.trim()}`
                  : "Employee Created"}
              </Badge>
            ) : row.original.reviewStatus === "APPROVED" ? (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link
                  href={`/employee-profiles/create?applicantDocumentId=${id}`}
                >
                  Create Employee Profile
                </Link>
              </Button>
            ) : null}

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
