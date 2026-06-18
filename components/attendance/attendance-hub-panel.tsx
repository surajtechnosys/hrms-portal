"use client";

import * as React from "react";
import { Filter, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceRecord } from "@/lib/actions/attendance";

type DepartmentOption = {
  id: string;
  name: string;
};

type ParticipantOption = {
  id: string;
  name: string;
  code: string;
  departmentId?: string | null;
};

type AttendanceHubPanelProps = {
  todayRecords: AttendanceRecord[];
  departments: DepartmentOption[];
  participants: ParticipantOption[];
};

function statusBadgeClass(status: string) {
  if (status === "PRESENT") return "bg-emerald-100 text-emerald-700";
  if (status === "ABSENT") return "bg-rose-100 text-rose-700";
  if (status === "LEAVE") return "bg-amber-100 text-amber-700";
  if (status === "HALF_DAY") return "bg-sky-100 text-sky-700";
  return "bg-violet-100 text-violet-700";
}

export function AttendanceHubPanel({
  todayRecords,
  departments,
  participants,
}: AttendanceHubPanelProps) {
  const [departmentId, setDepartmentId] = React.useState("all");
  const [participantKey, setParticipantKey] = React.useState("all");

  const departmentLookup = React.useMemo(() => {
    return new Map(departments.map((department) => [department.id, department.name]));
  }, [departments]);

  const participantOptions = React.useMemo(() => {
    return participants.filter((participant) => {
      if (departmentId !== "all" && participant.departmentId !== departmentId) {
        return false;
      }
      return true;
    });
  }, [departmentId, participants]);

  const visibleRecords = React.useMemo(() => {
    return todayRecords.filter((record) => {
      if (departmentId !== "all" && record.departmentId !== departmentId) {
        return false;
      }
      if (
        participantKey !== "all" &&
        record.participantId !== participantKey
      ) {
        return false;
      }
      return true;
    });
  }, [departmentId, participantKey, todayRecords]);

  const visibleSummary = React.useMemo(() => {
    const counts = visibleRecords.reduce(
      (acc, record) => {
        if (record.status === "PRESENT") acc.present += 1;
        if (record.status === "LEAVE") acc.leaves += 1;
        if (record.status === "ABSENT") acc.absents += 1;
        if (record.status === "HALF_DAY") acc.halfDays += 1;
        acc.employees += 1;
        return acc;
      },
      {
        present: 0,
        leaves: 0,
        absents: 0,
        halfDays: 0,
        employees: 0,
      },
    );

    return {
      ...counts,
      exceptions: counts.absents + counts.halfDays,
    };
  }, [visibleRecords]);

  const departmentLabel =
    departmentId === "all"
      ? "All Departments"
      : departmentLookup.get(departmentId) ?? "Selected Department";
  const selectedParticipant = participantOptions.find(
    (participant) => participant.id === participantKey,
  );
  const selectedParticipantLabel =
    participantKey === "all"
      ? "All Employees"
      : selectedParticipant
        ? `${selectedParticipant.name} (${selectedParticipant.code})`
        : "Selected Employee";

  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="size-5 text-cyan-700" />
                Today Status
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Filter today&apos;s attendance by department or individual
                employee.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <Filter className="size-4 text-cyan-700" />
              All Employees · {departmentLabel} · {selectedParticipantLabel}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setParticipantKey("all");
                }}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Employee
              </label>
              <select
                value={participantKey}
                onChange={(event) => setParticipantKey(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="all">All Employees</option>
                {participantOptions.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name} ({participant.code}) - Employee
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Present
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">
              {visibleSummary.present}
            </p>
          </div>
          <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
              Employees
            </p>
            <p className="mt-2 text-3xl font-semibold text-cyan-700">
              {visibleSummary.employees}
            </p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
              Half Days
            </p>
            <p className="mt-2 text-3xl font-semibold text-sky-700">
              {visibleSummary.halfDays}
            </p>
          </div>
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-700">
              Exceptions
            </p>
            <p className="mt-2 text-3xl font-semibold text-rose-700">
              {visibleSummary.exceptions}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-600">
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Check In</th>
                  <th className="px-3 py-3">Check Out</th>
                  <th className="px-3 py-3">Hours</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className={`border-b border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">
                        {record.participantName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {record.participantCode}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {record.checkIn
                        ? new Date(record.checkIn).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-3 py-3">
                      {record.checkOut
                        ? new Date(record.checkOut).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-3 py-3">
                      {record.workingHours?.toFixed(2) ?? "0.00"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={statusBadgeClass(record.status)}>
                        {record.status.replaceAll("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!visibleRecords.length ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-slate-500"
                    >
                      No attendance records are marked for the selected filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
