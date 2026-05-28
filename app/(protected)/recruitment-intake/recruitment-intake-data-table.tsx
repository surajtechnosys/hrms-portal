"use client";

import * as React from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/datatable/DataTable";
import {
  deleteRecruitmentIntake,
} from "@/lib/actions/recruitment-intake";
import { type RecruitmentIntake } from "@/types";
import { getRecruitmentIntakeColumns } from "./column";

export default function RecruitmentIntakeDataTable({
  data,
  canEdit,
  canDelete,
  title,
  actions,
}: {
  data: RecruitmentIntake[];
  canEdit: boolean;
  canDelete: boolean;
  title: string;
  actions?: React.ReactNode;
}) {
  const [tableData, setTableData] = React.useState<RecruitmentIntake[]>(data);

  const deleteHandler = async (id: string) => {
    const res = await deleteRecruitmentIntake(id);

    if (!res.success) {
      toast.error("Error", { description: res.message });
      return;
    }

    toast.success("Success", { description: res.message });
    setTableData((prev) => prev.filter((record) => record.id !== id));
  };

  const columns = getRecruitmentIntakeColumns({
    canEdit,
    canDelete,
    onDelete: deleteHandler,
  });

  return (
    <DataTable
      data={tableData}
      columns={columns}
      title={title}
      actions={actions}
      tableClassName="min-w-[1720px]"
      headCellClassName="whitespace-normal align-top leading-5"
      bodyCellClassName="whitespace-normal break-words align-top leading-5"
    />
  );
}
