"use server";

import { AttendanceStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getMonthRange,
  resolveAttendanceStatus,
  toDateInput,
  toDateOnly,
} from "@/lib/attendance-utils";
import {
  canManageAllAttendance,
  getRoutePermissions,
} from "@/lib/rbac";
import { isHrJobRoleName } from "@/lib/employee-job-role";
import { formatError } from "@/lib/utils";

const ATTENDANCE_ROUTE = "/attendance";

type ActionResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

type CurrentAttendanceUser = {
  id: string;
  email: string;
  role?: {
    name?: string | null;
  } | null;
  accountType?: string;
  employeeProfile?: {
    id: string;
    employeeName?: string | null;
    departmentId?: string | null;
  } | null;
  traineeProfile?: {
    id: string;
    fullName: string;
    traineeCode: string;
    departmentId?: string | null;
  } | null;
};

export type AttendanceRecord = {
  id: string;
  participantId: string;
  participantName: string;
  participantCode: string;
  departmentName: string;
  departmentId?: string;
  type: "employee" | "trainee";
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: number | null;
  status: AttendanceStatus;
  isLate: boolean;
  isHalfDay: boolean;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceGridRow = {
  participantId: string;
  participantName: string;
  participantCode: string;
  departmentName: string;
  type: "employee" | "trainee";
  days: Record<number, AttendanceStatus | "">;
  totals: {
    present: number;
    leaves: number;
    absents: number;
    halfDays: number;
    holidays: number;
  };
};

export type AttendanceMonthSheet = {
  year: number;
  month: number;
  daysInMonth: number;
  rows: AttendanceGridRow[];
};

export type AttendanceFilters = {
  year?: number;
  month?: number;
  participantId?: string;
  departmentId?: string;
  type?: "employees" | "trainees" | "all";
};

export type MarkAttendanceInput = {
  participantId?: string;
  type?: "employee" | "trainee";
  date?: string;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
};

export type UpdateAttendanceInput = {
  participantId?: string;
  type?: "employee" | "trainee";
  date?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: AttendanceStatus;
  remarks?: string | null;
};

function mapAttendance(record: Prisma.AttendanceGetPayload<{
  include: {
    employee: {
      include: {
        department: true;
      };
    };
  };
}>): AttendanceRecord {
  return {
    id: record.id,
    participantId: record.employeeId,
    participantName: record.employee.employeeName,
    participantCode: record.employee.employeeCode,
    departmentName: record.employee.department?.name ?? "-",
    departmentId: record.employee.department?.id,
    type: "employee",
    date: toDateInput(record.date),
    checkIn: record.checkIn?.toISOString() ?? "",
    checkOut: record.checkOut?.toISOString() ?? "",
    workingHours: record.workingHours,
    status: record.status,
    isLate: record.isLate,
    isHalfDay: record.isHalfDay,
    remarks: record.remarks ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapTraineeAttendance(record: Prisma.TraineeAttendanceGetPayload<{
  include: {
    trainee: {
      select: {
        fullName: true;
        traineeCode: true;
        departmentId: true;
      };
    };
  };
}>): AttendanceRecord {
  // Parse status from trainee attendance (stored as string)
  let status: AttendanceStatus = AttendanceStatus.ABSENT;
  const statusStr = record.status?.toUpperCase();
  if (statusStr === "PRESENT") status = AttendanceStatus.PRESENT;
  else if (statusStr === "LEAVE") status = AttendanceStatus.LEAVE;
  else if (statusStr === "ABSENT") status = AttendanceStatus.ABSENT;
  else if (statusStr === "HALF_DAY") status = AttendanceStatus.HALF_DAY;
  else if (statusStr === "HOLIDAY") status = AttendanceStatus.HOLIDAY;

  return {
    id: record.id,
    participantId: record.traineeId,
    participantName: record.trainee.fullName,
    participantCode: record.trainee.traineeCode,
    departmentName: "-", // Trainees don't have department yet, can be extended if needed
    departmentId: record.trainee.departmentId ?? undefined,
    type: "trainee",
    date: toDateInput(record.date),
    checkIn: record.checkIn?.toISOString() ?? "",
    checkOut: record.checkOut?.toISOString() ?? "",
    workingHours: record.workingHours,
    status,
    isLate: record.isLate ?? false,
    isHalfDay: record.isHalfDay ?? false,
    remarks: record.remarks ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getCurrentUser(): Promise<CurrentAttendanceUser> {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  if (session.user.accountType === "trainee") {
    const traineeProfile = await prisma.trainee.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        traineeCode: true,
        departmentId: true,
      },
    });

    if (!traineeProfile) {
      throw new Error("Trainee profile not found");
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: {
        name: "trainee",
      },
      accountType: "trainee" as const,
      employeeProfile: null,
      traineeProfile,
    };
  }

  if (session.user.role?.toLowerCase() === "employee") {
    const employeeProfile = await prisma.employeeProfile.findFirst({
      where: { email: session.user.email },
      select: {
        id: true,
        employeeName: true,
        departmentId: true,
        jobRole: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!employeeProfile) {
      throw new Error("Employee profile not found for current user");
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: {
        name: isHrJobRoleName(employeeProfile.jobRole?.name)
          ? "HR"
          : "employee",
      },
      accountType: "employee" as const,
      employeeProfile,
      traineeProfile: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  const employeeProfile = await prisma.employeeProfile.findFirst({
    where: { email: user.email },
    select: {
      id: true,
      employeeName: true,
      departmentId: true,
    },
  });

  return {
    ...user,
    accountType: session.user.accountType ?? "user",
    employeeProfile,
    traineeProfile: null,
  };
}

async function requireAttendancePermission(
  action: "view" | "create" | "edit" | "delete",
) {
  const currentUser = await getCurrentUser();
  if (
    currentUser.accountType === "trainee" &&
    (action === "view" || action === "create")
  ) {
    return currentUser;
  }

  const permissions = await getRoutePermissions(ATTENDANCE_ROUTE);
  const canManageFromJobRole = canManageAllAttendance(currentUser.role?.name);
  const allowed =
    action === "view"
      ? permissions.canView || canManageFromJobRole
      : action === "create"
        ? permissions.canCreate || canManageFromJobRole
        : action === "edit"
          ? permissions.canEdit || canManageFromJobRole
          : permissions.canDelete;

  if (!allowed) {
    throw new Error("Forbidden");
  }

  return currentUser;
}

function requireSelfScope(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  employeeId?: string,
  type?: "employee" | "trainee",
) {
  if (canManageAllAttendance(currentUser.role?.name)) {
    return employeeId;
  }

  if (currentUser.accountType === "trainee") {
    const traineeId = currentUser.traineeProfile?.id;

    if (!traineeId) {
      throw new Error("Trainee profile not found for current user");
    }

    if (employeeId && employeeId !== traineeId) {
      throw new Error("Users can access only their own attendance");
    }

    if (type && type !== "trainee") {
      throw new Error("Trainees can only access trainee attendance");
    }

    return traineeId;
  }

  if (!currentUser.employeeProfile?.id) {
    throw new Error("Employee profile not found for current user");
  }

  if (employeeId && employeeId !== currentUser.employeeProfile.id) {
    throw new Error("Users can access only their own attendance");
  }

  return currentUser.employeeProfile.id;
}

export async function getAttendanceOptions() {
  const currentUser = await requireAttendancePermission("view");
  if (currentUser.accountType === "trainee") {
    const trainee = currentUser.traineeProfile;

    return {
      employees: [],
      trainees: trainee
        ? [
            {
              id: trainee.id,
              fullName: trainee.fullName,
              traineeCode: trainee.traineeCode,
              departmentId: trainee.departmentId,
            },
          ]
        : [],
      departments: trainee?.departmentId
        ? [
            {
              id: trainee.departmentId,
              name: "-",
            },
          ]
        : [],
    };
  }

  const employeeScoped = !canManageAllAttendance(currentUser.role?.name);

  if (employeeScoped && !currentUser.employeeProfile?.id) {
    if (currentUser.accountType !== "trainee") {
      throw new Error("Employee profile not found for current user");
    }
  }

  const scopedEmployeeId = employeeScoped
    ? currentUser.employeeProfile?.id
    : undefined;
  const scopedDepartmentId = employeeScoped
    ? currentUser.employeeProfile?.departmentId
    : undefined;

  const [employees, trainees, departments] = await Promise.all([
    prisma.employeeProfile.findMany({
      where: scopedEmployeeId ? { id: scopedEmployeeId } : undefined,
      orderBy: [{ employeeName: "asc" }, { employeeCode: "asc" }],
      select: {
        id: true,
        employeeName: true,
        employeeCode: true,
        departmentId: true,
      },
    }),
    prisma.trainee.findMany({
      where: {
        status: "ACTIVE",
        ...(employeeScoped ? { id: scopedEmployeeId } : {}),
      },
      orderBy: [{ fullName: "asc" }, { traineeCode: "asc" }],
      select: {
        id: true,
        fullName: true,
        traineeCode: true,
        departmentId: true,
      },
    }),
    prisma.department.findMany({
      where: scopedDepartmentId ? { id: scopedDepartmentId } : undefined,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return { employees, trainees, departments };
}

export async function markAttendance(
  input: MarkAttendanceInput,
): Promise<ActionResponse<AttendanceRecord>> {
  try {
  const currentUser = await requireAttendancePermission("create");
  const type =
    input.type ??
    (currentUser.accountType === "trainee" ? "trainee" : "employee");
  const participantId = requireSelfScope(
    currentUser,
    input.participantId,
    type,
  );

  if (!participantId) {
    throw new Error("Participant is required");
  }

    const date = toDateOnly(input.date);
    const now = new Date();

    if (type === "trainee") {
      // Get existing trainee attendance
      const existing = await prisma.traineeAttendance.findUnique({
        where: { traineeId_date: { traineeId: participantId, date } },
      });
      const checkIn = input.checkIn
        ? new Date(input.checkIn)
        : existing?.checkIn ?? now;
      const checkOut = input.checkOut
        ? new Date(input.checkOut)
        : existing?.checkOut ?? (existing?.checkIn ? now : null);
      const calculated = resolveAttendanceStatus(checkIn, checkOut);

      const attendance = await prisma.traineeAttendance.upsert({
        where: { traineeId_date: { traineeId: participantId, date } },
        update: {
          checkIn,
          checkOut,
          workingHours: calculated.workingHours,
          status: calculated.status,
          isLate: calculated.isLate,
          isHalfDay: calculated.isHalfDay,
          remarks: input.remarks || existing?.remarks || null,
        },
        create: {
          traineeId: participantId,
          date,
          checkIn,
          checkOut,
          workingHours: calculated.workingHours,
          status: calculated.status,
          isLate: calculated.isLate,
          isHalfDay: calculated.isHalfDay,
          remarks: input.remarks || null,
        },
        include: {
          trainee: {
            select: {
              fullName: true,
              traineeCode: true,
              departmentId: true,
            },
          },
        },
      });

      revalidatePath(ATTENDANCE_ROUTE);
      revalidatePath("/attendance/my");
      revalidatePath("/attendance/mark");
      revalidatePath("/attendance/sheet");

      return {
        success: true,
        message: attendance.checkOut
          ? "Attendance updated successfully"
          : "Check-in recorded successfully",
        data: mapTraineeAttendance(attendance),
      };
    } else {
      // Employee attendance
      const existing = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: participantId, date } },
      });
      const checkIn = input.checkIn
        ? new Date(input.checkIn)
        : existing?.checkIn ?? now;
      const checkOut = input.checkOut
        ? new Date(input.checkOut)
        : existing?.checkOut ?? (existing?.checkIn ? now : null);
      const calculated = resolveAttendanceStatus(checkIn, checkOut);

      const attendance = await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: participantId, date } },
        update: {
          checkIn,
          checkOut,
          workingHours: calculated.workingHours,
          status: calculated.status,
          isLate: calculated.isLate,
          isHalfDay: calculated.isHalfDay,
          remarks: input.remarks || existing?.remarks || null,
        },
        create: {
          employeeId: participantId,
          date,
          checkIn,
          checkOut,
          workingHours: calculated.workingHours,
          status: calculated.status,
          isLate: calculated.isLate,
          isHalfDay: calculated.isHalfDay,
          remarks: input.remarks || null,
        },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
        },
      });

      revalidatePath(ATTENDANCE_ROUTE);
      revalidatePath("/attendance/my");
      revalidatePath("/attendance/mark");
      revalidatePath("/attendance/sheet");

      return {
        success: true,
        message: attendance.checkOut
          ? "Attendance updated successfully"
          : "Check-in recorded successfully",
        data: mapAttendance(attendance),
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMonthlyAttendance(
  filters: AttendanceFilters = {},
): Promise<AttendanceMonthSheet> {
  const currentUser = await requireAttendancePermission("view");
  const today = new Date();
  const year = filters.year ?? today.getFullYear();
  const month = filters.month ?? today.getMonth() + 1;
  const participantId =
    filters.participantId ??
    (currentUser.accountType === "trainee"
      ? currentUser.traineeProfile?.id
      : undefined);
  const type =
    filters.type ?? (currentUser.accountType === "trainee" ? "trainees" : "all");
  const { start, end, daysInMonth } = getMonthRange(year, month);
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const departmentLookup = new Map(
    departments.map((department) => [department.id, department.name]),
  );

  const rows: AttendanceGridRow[] = [];

  // Fetch employees
  if (type === "all" || type === "employees") {
    const employees = await prisma.employeeProfile.findMany({
      where: {
        ...(participantId ? { id: participantId } : {}),
        ...(filters.departmentId && canManageAllAttendance(currentUser.role?.name)
          ? { departmentId: filters.departmentId }
          : {}),
      },
      orderBy: [{ employeeName: "asc" }, { employeeCode: "asc" }],
      select: {
        id: true,
        employeeName: true,
        employeeCode: true,
        department: {
          select: {
            name: true,
          },
        },
        attendances: {
          where: {
            date: {
              gte: start,
              lt: end,
            },
          },
          select: {
            date: true,
            status: true,
          },
        },
      },
    });

    employees.forEach((employee) => {
      const days: AttendanceGridRow["days"] = {};
      const totals = {
        present: 0,
        leaves: 0,
        absents: 0,
        halfDays: 0,
        holidays: 0,
      };

      for (let day = 1; day <= daysInMonth; day += 1) {
        days[day] = "";
      }

      employee.attendances.forEach((attendance) => {
        const day = attendance.date.getUTCDate();
        days[day] = attendance.status;

        if (attendance.status === AttendanceStatus.PRESENT) totals.present += 1;
        if (attendance.status === AttendanceStatus.LEAVE) totals.leaves += 1;
        if (attendance.status === AttendanceStatus.ABSENT) totals.absents += 1;
        if (attendance.status === AttendanceStatus.HALF_DAY) totals.halfDays += 1;
        if (attendance.status === AttendanceStatus.HOLIDAY) totals.holidays += 1;
      });

      rows.push({
        participantId: employee.id,
        participantName: employee.employeeName,
        participantCode: employee.employeeCode,
        departmentName: employee.department?.name ?? "-",
        type: "employee",
        days,
        totals,
      });
    });
  }

  // Fetch trainees
  if (type === "all" || type === "trainees") {
    const trainees = await prisma.trainee.findMany({
      where: {
        ...(participantId ? { id: participantId } : {}),
        status: "ACTIVE",
        ...(filters.departmentId && canManageAllAttendance(currentUser.role?.name)
          ? { departmentId: filters.departmentId }
          : {}),
      },
      orderBy: [{ fullName: "asc" }, { traineeCode: "asc" }],
      select: {
        id: true,
        fullName: true,
        traineeCode: true,
        departmentId: true,
        attendances: {
          where: {
            date: {
              gte: start,
              lt: end,
            },
          },
          select: {
            date: true,
            status: true,
          },
        },
      },
    });

    trainees.forEach((trainee) => {
      const days: AttendanceGridRow["days"] = {};
      const totals = {
        present: 0,
        leaves: 0,
        absents: 0,
        halfDays: 0,
        holidays: 0,
      };

      for (let day = 1; day <= daysInMonth; day += 1) {
        days[day] = "";
      }

      trainee.attendances.forEach((attendance) => {
        const day = attendance.date.getUTCDate();
        let status: AttendanceStatus = AttendanceStatus.ABSENT;
        const statusStr = attendance.status?.toUpperCase();
        if (statusStr === "PRESENT") status = AttendanceStatus.PRESENT;
        else if (statusStr === "LEAVE") status = AttendanceStatus.LEAVE;
        else if (statusStr === "ABSENT") status = AttendanceStatus.ABSENT;
        else if (statusStr === "HALF_DAY") status = AttendanceStatus.HALF_DAY;
        else if (statusStr === "HOLIDAY") status = AttendanceStatus.HOLIDAY;

        days[day] = status;

        if (status === AttendanceStatus.PRESENT) totals.present += 1;
        if (status === AttendanceStatus.LEAVE) totals.leaves += 1;
        if (status === AttendanceStatus.ABSENT) totals.absents += 1;
        if (status === AttendanceStatus.HALF_DAY) totals.halfDays += 1;
        if (status === AttendanceStatus.HOLIDAY) totals.holidays += 1;
      });

      rows.push({
        participantId: trainee.id,
        participantName: trainee.fullName,
        participantCode: trainee.traineeCode,
        departmentName: trainee.departmentId
          ? departmentLookup.get(trainee.departmentId) ?? "-"
          : "-",
        type: "trainee",
        days,
        totals,
      });
    });
  }

  return {
    year,
    month,
    daysInMonth,
    rows,
  };
}

export async function getEmployeeAttendanceRecords(
  participantId: string,
  type?: "employee" | "trainee",
): Promise<AttendanceRecord[]> {
  const currentUser = await requireAttendancePermission("view");
  const scopedParticipantId = requireSelfScope(currentUser, participantId);

  if (type === "trainee") {
    const records = await prisma.traineeAttendance.findMany({
      where: { traineeId: scopedParticipantId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        trainee: {
          select: {
            fullName: true,
            traineeCode: true,
            departmentId: true,
          },
        },
      },
    });
    return records.map(mapTraineeAttendance);
  }

  // Default to employee
  const records = await prisma.attendance.findMany({
    where: { employeeId: scopedParticipantId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  return records.map(mapAttendance);
}

export async function updateAttendance(
  id: string,
  input: UpdateAttendanceInput,
): Promise<ActionResponse<AttendanceRecord>> {
  try {
    const currentUser = await requireAttendancePermission("edit");
    requireSelfScope(currentUser, input.participantId);

    if (!canManageAllAttendance(currentUser.role?.name)) {
      throw new Error("Only Admin or HR can edit attendance records directly");
    }

    const isTrainee = input.type === "trainee";

    if (isTrainee) {
      const existing = await prisma.traineeAttendance.findUnique({
        where: { id },
        include: {
          trainee: {
            select: {
              fullName: true,
              traineeCode: true,
              departmentId: true,
            },
          },
        },
      });

      if (!existing) {
        throw new Error("Attendance record not found");
      }

      const checkIn =
        input.checkIn === null
          ? null
          : input.checkIn
            ? new Date(input.checkIn)
            : existing.checkIn;
      const checkOut =
        input.checkOut === null
          ? null
          : input.checkOut
            ? new Date(input.checkOut)
            : existing.checkOut;
      const calculated = resolveAttendanceStatus(checkIn, checkOut, input.status);

      const attendance = await prisma.traineeAttendance.update({
        where: { id },
        data: {
          traineeId: input.participantId ?? existing.traineeId,
          date: input.date ? toDateOnly(input.date) : existing.date,
          checkIn,
          checkOut,
          workingHours: calculated.workingHours,
          status: calculated.status,
          isLate: calculated.isLate,
          isHalfDay: calculated.isHalfDay,
          remarks: input.remarks === undefined ? existing.remarks : input.remarks,
        },
        include: {
          trainee: {
            select: {
              fullName: true,
              traineeCode: true,
              departmentId: true,
            },
          },
        },
      });

      revalidatePath(ATTENDANCE_ROUTE);
      revalidatePath("/attendance/my");
      revalidatePath("/attendance/sheet");
      revalidatePath("/attendance/report");
      revalidatePath("/attendance");
      if (input.participantId) {
        revalidatePath(`/trainees/${input.participantId}/attendance`);
        revalidatePath("/trainee-dashboard/attendance");
      }

      return {
        success: true,
        message: "Attendance record updated successfully",
        data: mapTraineeAttendance(attendance),
      };
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Attendance record not found");
    }

    const checkIn =
      input.checkIn === null
        ? null
        : input.checkIn
          ? new Date(input.checkIn)
          : existing.checkIn;
    const checkOut =
      input.checkOut === null
        ? null
        : input.checkOut
          ? new Date(input.checkOut)
          : existing.checkOut;
    const calculated = resolveAttendanceStatus(checkIn, checkOut, input.status);

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        employeeId: input.participantId ?? existing.employeeId,
        date: input.date ? toDateOnly(input.date) : existing.date,
        checkIn,
        checkOut,
        workingHours: calculated.workingHours,
        status: calculated.status,
        isLate: calculated.isLate,
        isHalfDay: calculated.isHalfDay,
        remarks: input.remarks === undefined ? existing.remarks : input.remarks,
      },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    revalidatePath(ATTENDANCE_ROUTE);
    revalidatePath("/attendance/my");
    revalidatePath("/attendance/sheet");
    revalidatePath("/attendance/report");
    revalidatePath("/attendance");

    return {
      success: true,
      message: "Attendance record updated successfully",
      data: mapAttendance(attendance),
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function deleteAttendance(id: string): Promise<ActionResponse> {
  try {
    const currentUser = await requireAttendancePermission("delete");

    if (!currentUser.role?.name?.toLowerCase().includes("admin")) {
      throw new Error("Only admins can delete attendance records");
    }

    const employeeRecord = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });
    const traineeRecord = employeeRecord
      ? null
      : await prisma.traineeAttendance.findUnique({
          where: { id },
        include: {
          trainee: {
            select: {
              fullName: true,
              traineeCode: true,
              departmentId: true,
            },
          },
        },
      });

    if (employeeRecord) {
      await prisma.attendance.delete({
        where: { id },
      });
    } else if (traineeRecord) {
      await prisma.traineeAttendance.delete({
        where: { id },
      });
    } else {
      throw new Error("Attendance record not found");
    }

    revalidatePath(ATTENDANCE_ROUTE);
    revalidatePath("/attendance/my");
    revalidatePath("/attendance/sheet");
    revalidatePath("/attendance/report");
    revalidatePath("/attendance");
    if (traineeRecord) {
      revalidatePath(`/trainees/${traineeRecord.traineeId}/attendance`);
      revalidatePath("/trainee-dashboard/attendance");
    }

    return {
      success: true,
      message: "Attendance record deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getAttendanceDashboard() {
  const currentUser = await requireAttendancePermission("view");
  const today = toDateOnly(new Date());
  const scopedParticipantId = requireSelfScope(currentUser);

  // Fetch employee attendance
  const [employeeRecords, traineeRecords, monthlySheet] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: today,
        ...(scopedParticipantId ? { employeeId: scopedParticipantId } : {}),
      },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.traineeAttendance.findMany({
      where: {
        date: today,
        ...(scopedParticipantId ? { traineeId: scopedParticipantId } : {}),
      },
      include: {
        trainee: {
          select: {
            fullName: true,
            traineeCode: true,
            departmentId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    getMonthlyAttendance({
      year: today.getUTCFullYear(),
      month: today.getUTCMonth() + 1,
      participantId: scopedParticipantId,
    }),
  ]);

  const todayRecords = [
    ...employeeRecords.map(mapAttendance),
    ...traineeRecords.map(mapTraineeAttendance),
  ];

  const summary = monthlySheet.rows.reduce(
    (acc, row) => {
      acc.present += row.totals.present;
      acc.leaves += row.totals.leaves;
      acc.absents += row.totals.absents;
      acc.halfDays += row.totals.halfDays;
      return acc;
    },
    { present: 0, leaves: 0, absents: 0, halfDays: 0 },
  );

  return {
    summary,
    todayRecords,
    currentParticipantId:
      scopedParticipantId ||
      currentUser.employeeProfile?.id ||
      currentUser.traineeProfile?.id ||
      "",
    currentEmployeeId: currentUser.employeeProfile?.id ?? "",
  };
}
