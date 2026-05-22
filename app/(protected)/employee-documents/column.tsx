import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      cell: ({ row }) =>
        row.original.ownerName ||
        row.original.employeeName ||
        row.original.candidateName ||
        "-",
    },
    {
      id: "ownerCode",
      header: "Code / Request ID",
      cell: ({ row }) =>
        row.original.ownerCode ||
        row.original.employeeCode ||
        row.original.applicantCode ||
        "-",
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
      cell: ({ row }) =>
        row.original.reviewStatus === "APPROVED" ? (
          <Badge className="bg-emerald-500">APPROVED</Badge>
        ) : row.original.reviewStatus === "REJECTED" ? (
          <Badge variant="destructive">REJECTED</Badge>
        ) : (
          <Badge className="bg-amber-500">PENDING</Badge>
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
