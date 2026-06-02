import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDocumentReviewBadgeClass } from "@/lib/document-review";
import { EmployeeDocument } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, EditIcon, Trash, UserPlus } from "lucide-react";
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
      cell: ({ row }) =>
        row.original.ownerName ||
        row.original.employeeName ||
        row.original.candidateName ||
        "-",
    },
    {
      id: "ownerCode",
      header: "Employee / Applicant ID",
      cell: ({ row }) =>
        row.original.ownerCode ||
        row.original.employeeCode ||
        row.original.applicantCode ||
        row.original.applicantId ||
        "-",
    },
    {
      accessorKey: "dateOfBirth",
      header: "DOB",
      cell: ({ row }) => row.original.dateOfBirth || "-",
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile Number",
      cell: ({ row }) => row.original.mobileNumber || "-",
    },
    {
      accessorKey: "qualification",
      header: "Qualification",
      cell: ({ row }) => row.original.qualification || "-",
    },
    {
      accessorKey: "experienceType",
      header: "Experience Type",
      cell: ({ row }) => row.original.experienceType.replaceAll("_", " "),
    },
    {
      accessorKey: "aadhaarNumber",
      header: "Aadhaar Number",
    },
    {
      accessorKey: "panNumber",
      header: "PAN Number",
    },
    {
      accessorKey: "reviewStatus",
      header: "Review",
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
      cell: ({ row }) => row.original.reviewRemark || "-",
    },
  ];

  if (canEdit || canDelete || canReview) {
    columns.push({
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const id = row.original.id as string;

        return (
          <div className="flex flex-wrap gap-2">
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

            {canReview &&
              row.original.reviewStatus === "APPROVED" &&
              !row.original.linkedEmployeeId && (
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link
                    href={`/employee-profiles/create?sourceApplicantDocumentId=${id}`}
                  >
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
                <Link href={`/employee-documents/edit/${id}`}>
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
