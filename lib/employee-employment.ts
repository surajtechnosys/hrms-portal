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

type EmploymentTrackingRecord = {
  id?: string;
  employeeName?: string | null;
  employeeCode?: string | null;
  employeeType?: EmployeeType | string | null;
  probationStartDate?: Date | string | null;
  probationEndDate?: Date | string | null;
  trainingStartDate?: Date | string | null;
  trainingEndDate?: Date | string | null;
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

export const EMPLOYMENT_REVIEW_ACTIONS = {
  CONVERT_TO_EMPLOYEE: "CONVERT_TO_EMPLOYEE",
  EXTEND_PROBATION: "EXTEND_PROBATION",
  EXTEND_TRAINING: "EXTEND_TRAINING",
} as const;

export type EmploymentReviewAction =
  (typeof EMPLOYMENT_REVIEW_ACTIONS)[keyof typeof EMPLOYMENT_REVIEW_ACTIONS];

export type EmploymentReviewTimelineItem = {
  id: string;
  action: EmploymentReviewAction | string;
  actionLabel: string;
  oldEmployeeType: EmployeeType | string;
  newEmployeeType: EmployeeType | string;
  oldEndDate: string | null;
  newEndDate: string | null;
  remarks: string;
  reviewedByName: string;
  createdAt: string;
};

export function normalizeDate(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoDateString(value?: string | Date | null) {
  const date = normalizeDate(value);
  return date ? date.toISOString() : null;
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

export function getEmploymentReviewActionLabel(action?: string | null) {
  const normalized = action?.toUpperCase();

  if (normalized === EMPLOYMENT_REVIEW_ACTIONS.CONVERT_TO_EMPLOYEE) {
    return "Convert To Employee";
  }

  if (normalized === EMPLOYMENT_REVIEW_ACTIONS.EXTEND_PROBATION) {
    return "Extend Probation";
  }

  if (normalized === EMPLOYMENT_REVIEW_ACTIONS.EXTEND_TRAINING) {
    return "Extend Training";
  }

  return action ? action.replaceAll("_", " ") : "-";
}

export function getEmploymentTrackingTone(remainingDays?: number | null) {
  if (remainingDays === null || remainingDays === undefined) {
    return {
      name: "neutral" as const,
      cardClassName: "border-slate-200 bg-white",
      accentClassName: "text-slate-600",
      badgeClassName: "bg-slate-50 text-slate-700 ring-slate-200",
    };
  }

  if (remainingDays < 0) {
    return {
      name: "expired" as const,
      cardClassName: "border-red-950 bg-red-950 text-red-50",
      accentClassName: "text-red-100",
      badgeClassName: "bg-red-900/60 text-red-50 ring-red-900/40",
    };
  }

  if (remainingDays <= 2) {
    return {
      name: "critical" as const,
      cardClassName: "border-rose-200 bg-rose-50",
      accentClassName: "text-rose-700",
      badgeClassName: "bg-rose-100 text-rose-700 ring-rose-200",
    };
  }

  if (remainingDays <= 6) {
    return {
      name: "urgent" as const,
      cardClassName: "border-orange-200 bg-orange-50",
      accentClassName: "text-orange-700",
      badgeClassName: "bg-orange-100 text-orange-700 ring-orange-200",
    };
  }

  if (remainingDays <= 14) {
    return {
      name: "warning" as const,
      cardClassName: "border-yellow-200 bg-yellow-50",
      accentClassName: "text-yellow-700",
      badgeClassName: "bg-yellow-100 text-yellow-700 ring-yellow-200",
    };
  }

  return {
    name: "healthy" as const,
    cardClassName: "border-sky-200 bg-sky-50",
    accentClassName: "text-sky-700",
    badgeClassName: "bg-sky-100 text-sky-700 ring-sky-200",
  };
}

export function getEmploymentPeriodDates(record: EmploymentTrackingRecord) {
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
  record: EmploymentTrackingRecord,
  today = new Date(),
) {
  const period = getEmploymentPeriodDates(record);
  const remainingDays = getRemainingDays(period.endDate, today);
  const isTracked = !!period.kind && !!period.endDate;
  const isActive = isTracked && (remainingDays ?? -1) >= 0;
  const isEndingSoon =
    isTracked && (remainingDays ?? Number.POSITIVE_INFINITY) >= 0 && (remainingDays ?? Number.POSITIVE_INFINITY) <= 15;
  const tone = getEmploymentTrackingTone(remainingDays);
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
    tone,
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
  records: EmploymentTrackingRecord[],
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
    return [
      {
        employeeId: record.id ?? "",
        employeeName: record.employeeName,
        employeeCode: record.employeeCode,
        employeeType:
          record.employeeType?.toUpperCase() === EmployeeType.PROBATIONER
            ? EmployeeType.PROBATIONER
            : record.employeeType?.toUpperCase() === EmployeeType.TRAINEE
              ? EmployeeType.TRAINEE
              : EmployeeType.EMPLOYEE,
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

export function mapEmploymentReviewTimelineItem(record: {
  id: string;
  action: string;
  oldEmployeeType: EmployeeType | string;
  newEmployeeType: EmployeeType | string;
  oldEndDate: string | Date | null;
  newEndDate: string | Date | null;
  remarks: string | null;
  reviewedByUserId: string | null;
  reviewedByName: string | null;
  createdAt: string | Date;
}) {
  return {
    id: record.id,
    action: record.action,
    actionLabel: getEmploymentReviewActionLabel(record.action),
    oldEmployeeType: record.oldEmployeeType,
    newEmployeeType: record.newEmployeeType,
    oldEndDate: toIsoDateString(record.oldEndDate),
    newEndDate: toIsoDateString(record.newEndDate),
    remarks: record.remarks ?? "",
    reviewedByName: record.reviewedByName ?? record.reviewedByUserId ?? "Unknown",
    createdAt: toIsoDateString(record.createdAt) ?? new Date().toISOString(),
  };
}
