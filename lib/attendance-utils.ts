import { AttendanceStatus } from "@prisma/client";

const LATE_AFTER_HOUR = 9;
const LATE_AFTER_MINUTE = 30;
const HALF_DAY_HOURS = 4;

export type AttendanceCalculation = {
  status: AttendanceStatus;
  workingHours: number | null;
  isLate: boolean;
  isHalfDay: boolean;
};

export function toDateOnly(value?: string | Date | null) {
  const source = value ? new Date(value) : new Date();
  return new Date(
    Date.UTC(source.getFullYear(), source.getMonth(), source.getDate()),
  );
}

export function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return { start, end, daysInMonth };
}

export function calculateWorkingHours(
  checkIn?: Date | null,
  checkOut?: Date | null,
) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return null;
  return Number(((checkOut.getTime() - checkIn.getTime()) / 36e5).toFixed(2));
}

export function isLateCheckIn(checkIn?: Date | null) {
  if (!checkIn) return false;

  const threshold = new Date(checkIn);
  threshold.setHours(LATE_AFTER_HOUR, LATE_AFTER_MINUTE, 0, 0);

  return checkIn > threshold;
}

export function resolveAttendanceStatus(
  checkIn?: Date | null,
  checkOut?: Date | null,
  requestedStatus?: AttendanceStatus,
): AttendanceCalculation {
  const workingHours = calculateWorkingHours(checkIn, checkOut);

  if (requestedStatus === AttendanceStatus.HALF_DAY) {
    return {
      status: AttendanceStatus.HALF_DAY,
      workingHours,
      isLate: isLateCheckIn(checkIn),
      isHalfDay: true,
    };
  }

  if (requestedStatus && requestedStatus !== AttendanceStatus.PRESENT) {
    return {
      status: requestedStatus,
      workingHours,
      isLate: false,
      isHalfDay: false,
    };
  }

  const isHalfDay = workingHours !== null && workingHours < HALF_DAY_HOURS;

  return {
    status: isHalfDay ? AttendanceStatus.HALF_DAY : AttendanceStatus.PRESENT,
    workingHours,
    isLate: isLateCheckIn(checkIn),
    isHalfDay,
  };
}
