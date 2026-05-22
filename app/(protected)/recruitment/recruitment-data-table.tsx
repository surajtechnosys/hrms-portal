"use client";

import * as React from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/datatable/DataTable";
import {
  deleteRecruitmentApplication,
  sendApplicantPortalInvite,
} from "@/lib/actions/recruitment";
import { RecruitmentApplication } from "@/types";
import { getRecruitmentColumns } from "./column";

export default function RecruitmentDataTable({
  data,
  canEdit,
  canDelete,
  canCreateEmployeeProfile,
  canInviteApplicants,
  title,
  actions,
}: {
  data: RecruitmentApplication[];
  canEdit: boolean;
  canDelete: boolean;
  canCreateEmployeeProfile: boolean;
  canInviteApplicants: boolean;
  title: string;
  actions?: React.ReactNode;
}) {
  const [tableData, setTableData] =
    React.useState<RecruitmentApplication[]>(data);

  const deleteHandler = async (id: string) => {
    const res = await deleteRecruitmentApplication(id);

    if (!res?.success) {
      toast.error("Error", { description: res?.message });
      return;
    }

    toast.success("Success", { description: res?.message });
    setTableData((prev) => prev.filter((record) => record.id !== id));
  };

  const inviteHandler = async (id: string) => {
    const res = await sendApplicantPortalInvite(id);

    if (!res?.success) {
      toast.error("Error", { description: res?.message });
      return;
    }

    toast.success("Success", { description: res.message });

    if (res.data) {
      setTableData((prev) =>
        prev.map((record) => (record.id === id ? res.data! : record)),
      );
    }
  };

  const columns = getRecruitmentColumns({
    canEdit,
    canDelete,
    canCreateEmployeeProfile,
    canInviteApplicants,
    onDelete: deleteHandler,
    onInvite: inviteHandler,
  });

  return (
    <DataTable
      data={tableData}
      columns={columns}
      title={title}
      actions={actions}
      tableClassName="min-w-[1920px]"
      headCellClassName="whitespace-normal align-top leading-5"
      bodyCellClassName="whitespace-normal break-words align-top leading-5"
    />
  );
}
