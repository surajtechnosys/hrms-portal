import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Download, EditIcon, Trash } from "lucide-react";
import Link from "next/link";

import { type RecruitmentIntake } from "@/types";

export const getRecruitmentIntakeColumns = ({
  canEdit,
  canDelete,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
}): ColumnDef<RecruitmentIntake>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "skills",
    header: "Skills",
  },
  {
    accessorKey: "experience",
    header: "Experience",
  },
  {
    accessorKey: "appliedPosition",
    header: "Applied Position",
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <Badge className="bg-cyan-500">
        {row.original.source.replaceAll("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "resumeUrl",
    header: "Resume",
    cell: ({ row }) =>
      row.original.resumeUrl ? (
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link href={row.original.resumeUrl} target="_blank" rel="noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Open PDF
          </Link>
        </Button>
      ) : (
        "-"
      ),
  },
  ...(canEdit || canDelete
    ? [
        {
          id: "actions",
          header: "Action",
          cell: ({ row }) => {
            const id = row.original.id as string;

            return (
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <Button
                    asChild
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Link href={`/recruitment-intake/edit/${id}`}>
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
        } as ColumnDef<RecruitmentIntake>,
      ]
    : []),
];
