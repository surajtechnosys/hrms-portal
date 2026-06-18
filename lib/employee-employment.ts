import { EmployeeType } from "@prisma/client";

export const EMPLOYEE_TYPE_OPTIONS = [
  { value: EmployeeType.EMPLOYEE, label: "Employee" },
  { value: EmployeeType.PROBATIONER, label: "Probationer" },
  { value: EmployeeType.TRAINEE, label: "Trainee" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export type EmployeeEmploymentRecord = {
  id?: string;
  employeeName: string;
  employeeCode: string;
  employeeType?: EmployeeType | string | null;
  probationStartDate?: string | Date | null;
  probationEndDate?: string | Date | null;
  trainingStartDate?: string | Date | null;
  trainingEndDate?: string | Date | null;
  managerId?: string | null;
  managerName?: string | null;
};

export type EmploymentPeriodKind = "PROBATION" | "TRAINING";

export type EmploymentReminder = {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeType: EmployeeType;
  kind: EmploymentPeriodKind;
  endDate: string;
  remainingDays: number;
  audience: "HR" | "MANAGER";
  managerId?: string | null;
  managerName?: string | null;
  message: string;
  isEndingSoon: boolean;
};

function normalizeDate(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateOnly(value = new Date()) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}

export function getEmployeeTypeLabel(employeeType?: string | null) {
  const normalized = employeeType?.toUpperCase();

  if (normalized === EmployeeType.PROBATIONER) return "Probationer";
  if (normalized === EmployeeType.TRAINEE) return "Trainee";
  return "Employee";
}

export function getEmployeeTypeTone(employeeType?: string | null) {
  const normalized = employeeType?.toUpperCase();

  if (normalized === EmployeeType.PROBATIONER) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (normalized === EmployeeType.TRAINEE) {
    return "bg-violet-50 text-violet-700 ring-violet-200";
  }

  return "bg-cyan-50 text-cyan-700 ring-cyan-200";
}

export function getEmploymentPeriodKind(employeeType?: string | null) {
  const normalized = employeeType?.toUpperCase();
  if (normalized === EmployeeType.PROBATIONER) return "PROBATION";
  if (normalized === EmployeeType.TRAINEE) return "TRAINING";
  return null;
}

export function getEmploymentPeriodDates(record: EmployeeEmploymentRecord) {
  const employeeType = getEmploymentPeriodKind(record.employeeType);

  if (employeeType === "PROBATION") {
    return {
      kind: employeeType,
      startDate: normalizeDate(record.probationStartDate),
      endDate: normalizeDate(record.probationEndDate),
    };
  }

  if (employeeType === "TRAINING") {
    return {
      kind: employeeType,
      startDate: normalizeDate(record.trainingStartDate),
      endDate: normalizeDate(record.trainingEndDate),
    };
  }

  return {
    kind: null,
    startDate: null,
    endDate: null,
  };
}

export function getRemainingDays(endDate?: Date | null, today = new Date()) {
  if (!endDate) return null;

  const diff = toDateOnly(endDate).getTime() - toDateOnly(today).getTime();
  return Math.ceil(diff / DAY_MS);
}

export function getEmploymentTrackingState(
  record: EmployeeEmploymentRecord,
  today = new Date(),
) {
  const period = getEmploymentPeriodDates(record);
  const remainingDays = getRemainingDays(period.endDate, today);
  const isTracked = !!period.kind && !!period.endDate;
  const isActive = isTracked && (remainingDays ?? -1) >= 0;
  const isEndingSoon =
    isTracked && (remainingDays ?? Number.POSITIVE_INFINITY) >= 0 && (remainingDays ?? Number.POSITIVE_INFINITY) <= 15;
  const periodLabel =
    period.kind === "PROBATION"
      ? "Probation"
      : period.kind === "TRAINING"
        ? "Training"
        : "Employee";

  return {
    ...period,
    remainingDays,
    isTracked,
    isActive,
    isEndingSoon,
    periodLabel,
  };
}

export function formatRemainingDays(days?: number | null) {
  if (days === null || days === undefined) {
    return "-";
  }

  if (days < 0) {
    return `Ended ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  }

  if (days === 0) {
    return "Ends today";
  }

  return `${days} day${days === 1 ? "" : "s"} left`;
}

export function buildEmploymentReminderMessages(
  records: EmployeeEmploymentRecord[],
  audience: "HR" | "MANAGER",
  today = new Date(),
) {
  const reminderOffsets = [15, 7, 3, 1, 0];

  return records.flatMap((record) => {
    const state = getEmploymentTrackingState(record, today);
    if (!state.endDate || !state.kind || state.remainingDays === null) {
      return [];
    }

    if (!reminderOffsets.includes(state.remainingDays)) {
      return [];
    }

    const dateLabel = state.endDate.toLocaleDateString("en-GB");
    const subject =
      state.kind === "PROBATION"
        ? "Probation period"
        : "Training period";
    const message =
      state.kind === "PROBATION"
        ? `Probation period for ${record.employeeName} will end on ${dateLabel}. Please review and take necessary action.`
        : `Training period for ${record.employeeName} will end on ${dateLabel}. Please review and take necessary action.`;

    return [
      {
        employeeId: record.id ?? "",
        employeeName: record.employeeName,
        employeeCode: record.employeeCode,
        employeeType: (record.employeeType?.toUpperCase() as EmployeeType) || EmployeeType.EMPLOYEE,
        kind: state.kind,
        endDate: dateLabel,
        remainingDays: state.remainingDays,
        audience,
        managerId: record.managerId,
        managerName: record.managerName,
        message: `${subject} for ${record.employeeName} will end on ${dateLabel}. Please review and take necessary action.`,
        isEndingSoon: state.remainingDays <= 15,
      },
    ];
  });
}
