"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { EmployeeProfile } from "@/types";
import { DataTable } from "@/components/datatable/DataTable";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditIcon, Trash } from "lucide-react";

interface EmployeeListProps {
  employees: EmployeeProfile[];
  isLoading?: boolean;
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const getStatusBadge = (status?: string) => {
  const normalized = status?.toUpperCase();

  const statusMap: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-red-100 text-red-800",
    "ON LEAVE": "bg-yellow-100 text-yellow-800",
    RESIGNED: "bg-gray-100 text-gray-800",
  };

  return statusMap[normalized ?? ""] ?? "bg-blue-100 text-blue-800";
};

const columns: ColumnDef<EmployeeProfile>[] = [
  {
    id: "employee",
    accessorFn: (row) => `${row.employeeName} ${row.employeeCode}`,
    header: "Employee",
    cell: ({ row }) => {
      const employeeCode = row.original.employeeCode || "";
      return (
        <div className="min-w-[210px]">
          <p className="font-semibold text-slate-900">
            {row.original.employeeName}
          </p>
          <Link
            href={`/employee-profiles/${employeeCode}`}
            className="text-xs font-medium uppercase tracking-wide text-sky-700 hover:underline"
          >
            {employeeCode}
          </Link>
        </div>
      );
    },
  },
  {
    id: "contact",
    accessorFn: (row) => `${row.phone} ${row.email ?? ""}`,
    header: "Contact",
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <p className="font-medium text-slate-800">
          {row.original.phone || "-"}
        </p>
        <p className="text-xs text-slate-500">
          {row.original.email || "No email"}
        </p>
      </div>
    ),
  },
  {
    id: "organization",
    accessorFn: (row) => `${row.departmentName ?? ""} ${row.jobRoleName ?? ""}`,
    header: "Organization",
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <p className="font-medium text-slate-800">
          {row.original.departmentName || "-"}
        </p>
        <p className="text-xs text-slate-500">
          {row.original.jobRoleName || "No job role"}
        </p>
      </div>
    ),
  },
  {
    id: "workplace",
    accessorFn: (row) =>
      `${row.companyName ?? ""} ${row.workLocationName ?? ""}`,
    header: "Company / Location",
    cell: ({ row }) => (
      <div className="min-w-[200px]">
        <p className="font-medium text-slate-800">
          {row.original.companyName || "-"}
        </p>
        <p className="text-xs text-slate-500">
          {row.original.workLocationName || "No work location"}
        </p>
      </div>
    ),
  },
  {
    id: "reporting",
    accessorFn: (row) => `${row.managerName ?? ""} ${row.joiningDate ?? ""}`,
    header: "Manager / Joining",
    cell: ({ row }) => (
      <div className="min-w-[170px]">
        <p className="font-medium text-slate-800">
          {row.original.managerName || "-"}
        </p>
        <p className="text-xs text-slate-500">
          Joined {formatDate(row.original.joiningDate)}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "projectNames",
    header: "Projects",
    cell: ({ row }) => {
      const projectNames = row.original.projectNames ?? [];

      if (!projectNames.length) {
        return "-";
      }

      return (
        <div className="flex max-w-64 flex-wrap gap-1">
          {projectNames.map((projectName) => (
            <Badge
              key={projectName}
              variant="secondary"
              className="bg-sky-50 text-sky-700"
            >
              {projectName}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = String(getValue() || "");

      return <Badge className={getStatusBadge(status)}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          asChild
          size="icon"
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Link href={`/employee-profiles/edit/${row.original.id}`}>
            <EditIcon size={16} />
          </Link>
        </Button>

        <Button
          size="icon"
          variant="destructive"
          onClick={() => {
            console.log("Delete", row.original.id);
          }}
        >
          <Trash size={16} />
        </Button>
      </div>
    ),
  },
];

export default function EmployeeList({
  employees,
  isLoading = false,
}: EmployeeListProps) {
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-[24px] border border-slate-200 bg-white">
        <p className="text-gray-500">Loading employees...</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white">
        <p className="text-gray-500">No employees found.</p>
      </div>
    );
  }

  return (
    <DataTable
      title="Employee Directory"
      columns={columns}
      data={employees}
      tableClassName="min-w-[980px]"
      headCellClassName="whitespace-normal align-top leading-5"
      bodyCellClassName="whitespace-normal break-words align-top leading-5"
    />
  );
}
