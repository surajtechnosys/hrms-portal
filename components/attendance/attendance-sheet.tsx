"use client";

import * as React from "react";
import { CalendarRange, Download, Filter, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceMonthSheet } from "@/lib/actions/attendance";

type Participant = {
  id: string;
  name?: string;
  fullName?: string;
  employeeName?: string;
  code?: string;
  employeeCode?: string;
  traineeCode?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  type?: "employee" | "trainee";
};

type Option = {
  id: string;
  name: string;
};

type AttendanceSheetProps = {
  initialSheet: AttendanceMonthSheet;
  employees?: Participant[];
  trainees?: Participant[];
  departments: Option[];
  canFilterEmployees: boolean;
  showExport?: boolean;
  title?: string;
  compact?: boolean;
};

const statusLabels: Record<string, string> = {
  PRESENT: "P",
  ABSENT: "A",
  LEAVE: "L",
  HALF_DAY: "HD",
  HOLIDAY: "H",
  "": "",
};

const statusClasses: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-rose-100 text-rose-700",
  LEAVE: "bg-amber-100 text-amber-700",
  HALF_DAY: "bg-sky-100 text-sky-700",
  HOLIDAY: "bg-violet-100 text-violet-700",
  "": "bg-slate-100 text-slate-400",
};

const statusTextClasses: Record<string, string> = {
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ABSENT: "border-rose-200 bg-rose-50 text-rose-700",
  LEAVE: "border-amber-200 bg-amber-50 text-amber-700",
  HALF_DAY: "border-sky-200 bg-sky-50 text-sky-700",
  HOLIDAY: "border-violet-200 bg-violet-50 text-violet-700",
  "": "border-slate-200 bg-slate-50 text-slate-400",
};

function formatParticipantLabel(participant: Participant) {
  const name = participant.employeeName || participant.fullName || participant.name || "";
  const code = participant.employeeCode || participant.traineeCode || participant.code || "";
  return {
    name,
    code,
    typeLabel: participant.type === "trainee" ? "Trainee" : "Employee",
  };
}

function exportCsv(sheet: AttendanceMonthSheet) {
  const dayHeaders = Array.from({ length: sheet.daysInMonth }, (_, index) => `${index + 1}`);
  const rows = [
    [
      "Type",
      "Participant Code",
      "Participant Name",
      "Department",
      ...dayHeaders,
      "Present",
      "Leaves",
      "Absents",
      "Half Days",
      "Holidays",
    ],
    ...sheet.rows.map((row) => [
      row.type === "trainee" ? "Trainee" : "Employee",
      row.participantCode,
      row.participantName,
      row.departmentName,
      ...dayHeaders.map((day) => statusLabels[row.days[Number(day)]]),
      row.totals.present,
      row.totals.leaves,
      row.totals.absents,
      row.totals.halfDays,
      row.totals.holidays,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-${sheet.year}-${String(sheet.month).padStart(2, "0")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AttendanceSheet({
  initialSheet,
  employees = [],
  trainees = [],
  departments,
  canFilterEmployees,
  showExport = false,
  title = "Monthly Attendance Sheet",
  compact = false,
}: AttendanceSheetProps) {
  const [sheet, setSheet] = React.useState(initialSheet);
  const [year, setYear] = React.useState(String(initialSheet.year));
  const [month, setMonth] = React.useState(String(initialSheet.month));
  const [participantType, setParticipantType] = React.useState<
    "employees" | "trainees" | "all"
  >("all");
  const [participantKey, setParticipantKey] = React.useState("all");
  const [departmentId, setDepartmentId] = React.useState("all");
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setSheet(initialSheet);
    setYear(String(initialSheet.year));
    setMonth(String(initialSheet.month));
  }, [initialSheet]);

  const days = React.useMemo(
    () => Array.from({ length: sheet.daysInMonth }, (_, index) => index + 1),
    [sheet.daysInMonth],
  );

  const compactRow = sheet.rows[0];
  const firstWeekday = new Date(sheet.year, sheet.month - 1, 1).getDay();
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({
      key: `blank-${index}`,
      day: 0,
      status: "" as const,
    })),
    ...days.map((day) => ({
      key: `day-${day}`,
      day,
      status: compactRow?.days[day] ?? "",
    })),
  ];

  const filteredParticipants = React.useMemo(() => {
    const pool = [
      ...employees.map((employee) => ({
        ...employee,
        type: "employee" as const,
      })),
      ...trainees.map((trainee) => ({
        ...trainee,
        type: "trainee" as const,
      })),
    ];

    return pool.filter((participant) => {
      if (participantType === "employees" && participant.type !== "employee") {
        return false;
      }
      if (participantType === "trainees" && participant.type !== "trainee") {
        return false;
      }
      if (
        departmentId !== "all" &&
        (participant.departmentId ?? null) !== departmentId
      ) {
        return false;
      }
      return true;
    });
  }, [departmentId, employees, participantType, trainees]);

  const selectedParticipant = React.useMemo(() => {
    if (participantKey === "all") {
      return null;
    }

    const [type, id] = participantKey.split(":");
    return filteredParticipants.find(
      (participant) => participant.id === id && participant.type === type,
    );
  }, [filteredParticipants, participantKey]);

  const applyFilters = () => {
    startTransition(async () => {
      const selectedType =
        participantKey === "all" && participantType !== "all"
          ? participantType
          : participantKey === "all"
            ? "all"
            : selectedParticipant?.type === "trainee"
              ? "trainees"
              : "employees";

      const params = new URLSearchParams({
        year,
        month,
        type: selectedType,
      });

      if (participantKey !== "all") {
        params.set("participantId", participantKey.split(":")[1]);
      }

      if (departmentId !== "all") {
        params.set("departmentId", departmentId);
      }

      const response = await fetch(`/api/attendance/month?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        toast.error("Attendance", { description: result.message });
        return;
      }

      setSheet(result.data);
    });
  };

  const participantLabel =
    participantKey === "all"
      ? "All participants"
      : selectedParticipant
        ? `${formatParticipantLabel(selectedParticipant).name} (${formatParticipantLabel(selectedParticipant).code})`
        : "Selected participant";

  return (
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarRange className="size-5 text-cyan-700" />
              {title}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {sheet.rows.length} participant record(s) loaded for {sheet.month}/{sheet.year}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="h-10 w-24 rounded-lg border border-slate-200 px-3 text-sm"
              type="number"
              min="2020"
            />
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2026, index, 1).toLocaleString("en-IN", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            {canFilterEmployees ? (
              <>
                <select
                  value={participantType}
                  onChange={(event) => {
                    setParticipantType(event.target.value as "employees" | "trainees" | "all");
                    setParticipantKey("all");
                  }}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                >
                  <option value="all">All participants</option>
                  <option value="employees">Employees only</option>
                  <option value="trainees">Trainees only</option>
                </select>

                <select
                  value={departmentId}
                  onChange={(event) => {
                    setDepartmentId(event.target.value);
                    setParticipantKey("all");
                  }}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                >
                  <option value="all">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>

                <select
                  value={participantKey}
                  onChange={(event) => setParticipantKey(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                >
                  <option value="all">All participants</option>
                  {filteredParticipants.map((participant) => {
                    const meta = formatParticipantLabel(participant);
                    return (
                      <option key={`${participant.type}:${participant.id}`} value={`${participant.type}:${participant.id}`}>
                        {meta.name} ({meta.code}) - {meta.typeLabel}
                      </option>
                    );
                  })}
                </select>
              </>
            ) : null}

            <Button
              onClick={applyFilters}
              disabled={isPending}
              variant="outline"
              className="h-10"
            >
              <Filter />
              Apply
            </Button>

            {showExport ? (
              <Button
                onClick={() => exportCsv(sheet)}
                className="h-10 bg-cyan-600 hover:bg-cyan-700"
              >
                <Download />
                Export CSV
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {compact ? (
          <div className="space-y-5">
            {compactRow ? (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Users className="size-4 text-cyan-700" />
                    Monthly summary
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A calendar view of your current month with day-by-day attendance markers.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-5">
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs font-medium uppercase text-emerald-700">
                      Present
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-700">
                      {compactRow.totals.present}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs font-medium uppercase text-amber-700">
                      Leave
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-amber-700">
                      {compactRow.totals.leaves}
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                    <p className="text-xs font-medium uppercase text-rose-700">
                      Absent
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-rose-700">
                      {compactRow.totals.absents}
                    </p>
                  </div>
                  <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
                    <p className="text-xs font-medium uppercase text-sky-700">
                      Half Day
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-sky-700">
                      {compactRow.totals.halfDays}
                    </p>
                  </div>
                  <div className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                    <p className="text-xs font-medium uppercase text-violet-700">
                      Holiday
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-violet-700">
                      {compactRow.totals.holidays}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
                    <div
                      key={weekday}
                      className="text-center text-xs font-semibold uppercase text-slate-500"
                    >
                      {weekday}
                    </div>
                  ))}
                  {calendarCells.map((cell) =>
                    cell.day ? (
                      <div
                        key={cell.key}
                        className={`min-h-20 rounded-lg border p-2 ${statusTextClasses[cell.status]}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold">{cell.day}</span>
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
                            {statusLabels[cell.status] || "-"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div key={cell.key} className="min-h-20" />
                    ),
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-10 text-center text-sm text-slate-500">
                No attendance records found.
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-[1100px] w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left">
                    Participant
                  </th>
                  {days.map((day) => (
                    <th key={day} className="px-2 py-3 text-center">
                      {day}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center">P</th>
                  <th className="px-3 py-3 text-center">L</th>
                  <th className="px-3 py-3 text-center">A</th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={`${row.type}-${row.participantId}`} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-3">
                      <div className="font-medium text-slate-900">
                        {row.participantName}
                        <span
                          className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.type === "trainee"
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.type === "trainee" ? "Trainee" : "Employee"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {[row.participantCode, row.departmentName].filter(Boolean).join(" - ")}
                      </div>
                    </td>
                    {days.map((day) => {
                      const status = row.days[day];
                      return (
                        <td key={day} className="px-2 py-2 text-center">
                          <Badge className={statusClasses[status]}>
                            {statusLabels[status] || "-"}
                          </Badge>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center font-semibold">{row.totals.present}</td>
                    <td className="px-3 py-3 text-center font-semibold">{row.totals.leaves}</td>
                    <td className="px-3 py-3 text-center font-semibold">{row.totals.absents}</td>
                  </tr>
                ))}
                {!sheet.rows.length ? (
                  <tr>
                    <td
                      colSpan={sheet.daysInMonth + 4}
                      className="px-3 py-10 text-center text-slate-500"
                    >
                      No attendance records found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
