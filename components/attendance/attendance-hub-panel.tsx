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
  type: "employee" | "trainee";
  departmentId?: string | null;
};

type AttendanceHubPanelProps = {
  todayRecords: AttendanceRecord[];
  departments: DepartmentOption[];
  participants: ParticipantOption[];
};

type ParticipantTypeFilter = "all" | "employees" | "trainees";

function statusBadgeClass(status: string) {
  if (status === "PRESENT") return "bg-emerald-100 text-emerald-700";
  if (status === "ABSENT") return "bg-rose-100 text-rose-700";
  if (status === "LEAVE") return "bg-amber-100 text-amber-700";
  if (status === "HALF_DAY") return "bg-sky-100 text-sky-700";
  return "bg-violet-100 text-violet-700";
}

function typeBadgeClass(type: AttendanceRecord["type"]) {
  return type === "trainee"
    ? "bg-cyan-100 text-cyan-700"
    : "bg-slate-100 text-slate-700";
}

export function AttendanceHubPanel({
  todayRecords,
  departments,
  participants,
}: AttendanceHubPanelProps) {
  const [participantType, setParticipantType] =
    React.useState<ParticipantTypeFilter>("all");
  const [departmentId, setDepartmentId] = React.useState("all");
  const [participantKey, setParticipantKey] = React.useState("all");

  const departmentLookup = React.useMemo(() => {
    return new Map(departments.map((department) => [department.id, department.name]));
  }, [departments]);

  const participantOptions = React.useMemo(() => {
    return participants.filter((participant) => {
      if (participantType === "employees" && participant.type !== "employee") {
        return false;
      }
      if (participantType === "trainees" && participant.type !== "trainee") {
        return false;
      }
      if (departmentId !== "all" && participant.departmentId !== departmentId) {
        return false;
      }
      return true;
    });
  }, [departmentId, participantType, participants]);

  React.useEffect(() => {
    setParticipantKey("all");
  }, [participantType, departmentId]);

  const visibleRecords = React.useMemo(() => {
    return todayRecords.filter((record) => {
      if (participantType === "employees" && record.type !== "employee") {
        return false;
      }
      if (participantType === "trainees" && record.type !== "trainee") {
        return false;
      }
      if (departmentId !== "all" && record.departmentId !== departmentId) {
        return false;
      }
      if (
        participantKey !== "all" &&
        `${record.type}:${record.participantId}` !== participantKey
      ) {
        return false;
      }
      return true;
    });
  }, [departmentId, participantKey, participantType, todayRecords]);

  const visibleSummary = React.useMemo(() => {
    const counts = visibleRecords.reduce(
      (acc, record) => {
        if (record.status === "PRESENT") acc.present += 1;
        if (record.status === "LEAVE") acc.leaves += 1;
        if (record.status === "ABSENT") acc.absents += 1;
        if (record.status === "HALF_DAY") acc.halfDays += 1;
        if (record.type === "employee") acc.employees += 1;
        if (record.type === "trainee") acc.trainees += 1;
        return acc;
      },
      {
        present: 0,
        leaves: 0,
        absents: 0,
        halfDays: 0,
        employees: 0,
        trainees: 0,
      },
    );

    return {
      ...counts,
      exceptions: counts.absents + counts.halfDays,
    };
  }, [visibleRecords]);

  const typeLabel =
    participantType === "employees"
      ? "Employees Only"
      : participantType === "trainees"
        ? "Trainees Only"
        : "All Participants";
  const departmentLabel =
    departmentId === "all"
      ? "All Departments"
      : departmentLookup.get(departmentId) ?? "Selected Department";
  const selectedParticipant = participantOptions.find(
    (participant) => `${participant.type}:${participant.id}` === participantKey,
  );
  const selectedParticipantLabel =
    participantKey === "all"
      ? "All Participants"
      : selectedParticipant
        ? `${selectedParticipant.name} (${selectedParticipant.code})`
        : "Selected Participant";

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
                Filter today&apos;s attendance by participant type, department, or
                individual participant.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <Filter className="size-4 text-cyan-700" />
              {typeLabel} · {departmentLabel} · {selectedParticipantLabel}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Participant Type
              </label>
              <select
                value={participantType}
                onChange={(event) =>
                  setParticipantType(event.target.value as ParticipantTypeFilter)
                }
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="all">All Participants</option>
                <option value="employees">Employees Only</option>
                <option value="trainees">Trainees Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
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
                Participant
              </label>
              <select
                value={participantKey}
                onChange={(event) => setParticipantKey(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="all">All Participants</option>
                {participantOptions.map((participant) => (
                  <option
                    key={`${participant.type}:${participant.id}`}
                    value={`${participant.type}:${participant.id}`}
                  >
                    {participant.name} ({participant.code}) -{" "}
                    {participant.type === "trainee" ? "Trainee" : "Employee"}
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
              Trainees
            </p>
            <p className="mt-2 text-3xl font-semibold text-sky-700">
              {visibleSummary.trainees}
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
                  <th className="px-3 py-3">Participant</th>
                  <th className="px-3 py-3">Type</th>
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
                      <Badge className={typeBadgeClass(record.type)}>
                        {record.type === "trainee" ? "Trainee" : "Employee"}
                      </Badge>
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
                      colSpan={6}
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
