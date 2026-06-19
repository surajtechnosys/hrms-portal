"use server";

import {
  AttendanceRequestStatus,
  AttendanceRequestType,
  AttendanceStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { getPrismaClient } from "@/lib/prisma";
import { toDateInput, toDateOnly } from "@/lib/attendance-utils";
import { canManageAllAttendance, getRoutePermissions } from "@/lib/rbac";
import { isHrJobRoleName, isManagerJobRoleName } from "@/lib/employee-job-role";
import { formatError } from "@/lib/utils";

const ATTENDANCE_ROUTE = "/attendance";
const ATTENDANCE_REQUESTS_ROUTE = "/attendance/requests";
const ATTENDANCE_MY_ROUTE = "/attendance/my";

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
    managerId?: string | null;
    jobRole?: {
      name?: string | null;
    } | null;
  } | null;
};

export type AttendanceRequestRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  attendanceDate: string;
  requestType: AttendanceRequestType;
  reason: string;
  notes: string;
  status: AttendanceRequestStatus;
  approvedByName: string;
  approvedAt: string;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
};

type AttendanceRequestRawRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string | null;
  attendanceDate: Date | string | null;
  requestType: AttendanceRequestType;
  reason: string;
  notes: string | null;
  status: AttendanceRequestStatus;
  approvedByName: string | null;
  approvedAt: Date | string | null;
  rejectionReason: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function mapAttendanceRequestRaw(
  row: AttendanceRequestRawRow,
): AttendanceRequestRecord {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    employeeCode: row.employeeCode,
    departmentName: row.departmentName ?? "-",
    attendanceDate: toDateInput(
      row.attendanceDate
        ? new Date(row.attendanceDate)
        : toDateOnly(row.createdAt),
    ),
    requestType: row.requestType,
    reason: row.reason,
    notes: row.notes ?? "",
    status: row.status,
    approvedByName: row.approvedByName ?? "",
    approvedAt: row.approvedAt ? new Date(row.approvedAt).toISOString() : "",
    rejectionReason: row.rejectionReason ?? "",
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function attendanceRequestQueryBase() {
  return Prisma.sql`
    SELECT
      ar."id",
      ar."employeeId",
      ep."employeeName",
      ep."employeeCode",
      d."name" AS "departmentName",
      COALESCE(a."date", ar."createdAt") AS "attendanceDate",
      ar."requestType",
      ar."reason",
      ar."notes",
      ar."status",
      TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "approvedByName",
      ar."approvedAt",
      ar."rejectionReason",
      ar."createdAt",
      ar."updatedAt"
    FROM "AttendanceRequest" ar
    JOIN "EmployeeProfile" ep ON ep."id" = ar."employeeId"
    LEFT JOIN "Department" d ON d."id" = ep."departmentId"
    LEFT JOIN "Attendance" a ON a."id" = ar."attendanceId"
    LEFT JOIN "User" u ON u."id" = ar."approvedById"
  `;
}

function attendanceRequestScopeCondition(employeeIds: string[] | null) {
  if (employeeIds === null) {
    return Prisma.empty;
  }

  if (!employeeIds.length) {
    return Prisma.sql`WHERE 1 = 0`;
  }

  return Prisma.sql`WHERE ar."employeeId" IN (${Prisma.join(employeeIds)})`;
}

async function getCurrentUser(): Promise<CurrentAttendanceUser> {
  const prisma = getPrismaClient();
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  if (session.user.role?.toLowerCase() === "employee") {
    const employeeProfile = await prisma.employeeProfile.findFirst({
      where: { email: session.user.email },
      select: {
        id: true,
        employeeName: true,
        departmentId: true,
        managerId: true,
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
      accountType: "employee",
      employeeProfile,
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
      managerId: true,
      jobRole: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...user,
    accountType: session.user.accountType ?? "user",
    employeeProfile,
  };
}

function isManagerReviewer(currentUser: CurrentAttendanceUser) {
  return !!currentUser.employeeProfile?.jobRole?.name
    ? isManagerJobRoleName(currentUser.employeeProfile.jobRole.name)
    : false;
}

async function requireAttendanceRequestPermission(
  action: "view" | "create" | "edit",
) {
  const currentUser = await getCurrentUser();
  const permissions =
    action === "create"
      ? await getRoutePermissions(ATTENDANCE_MY_ROUTE)
      : await getRoutePermissions(ATTENDANCE_REQUESTS_ROUTE);

  const canManageFromRole = canManageAllAttendance(currentUser.role?.name);
  const canManageFromManager = isManagerReviewer(currentUser);
  const allowed =
    action === "create"
      ? permissions.canCreate || canManageFromRole || canManageFromManager
      : permissions.canView || canManageFromRole || canManageFromManager;

  if (!allowed) {
    throw new Error("Forbidden");
  }

  return currentUser;
}

async function getManagedEmployeeIds(currentUser: CurrentAttendanceUser) {
  const prisma = getPrismaClient();

  if (canManageAllAttendance(currentUser.role?.name)) {
    return [] as string[];
  }

  const managerId = currentUser.employeeProfile?.id;
  if (!managerId) {
    return [] as string[];
  }

  const reports = await prisma.employeeProfile.findMany({
    where: {
      managerId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  return reports.map((report) => report.id);
}

function getAttendanceStatusForRequest(
  requestType: AttendanceRequestType,
): AttendanceStatus {
  if (requestType === AttendanceRequestType.HALF_DAY) {
    return AttendanceStatus.HALF_DAY;
  }

  if (requestType === AttendanceRequestType.WFH) {
    return AttendanceStatus.WFH;
  }

  if (requestType === AttendanceRequestType.OD) {
    return AttendanceStatus.OD;
  }

  return AttendanceStatus.OUT_OF_STATION;
}

function revalidateAttendanceRequestPaths() {
  revalidatePath(ATTENDANCE_ROUTE);
  revalidatePath(ATTENDANCE_MY_ROUTE);
  revalidatePath(ATTENDANCE_REQUESTS_ROUTE);
  revalidatePath("/attendance/sheet");
  revalidatePath("/attendance/report");
  revalidatePath("/employee-dashboard");
  revalidatePath("/dashboard");
}

export async function createAttendanceRequest(input: {
  requestType?: AttendanceRequestType;
  reason?: string;
  notes?: string;
  attendanceId?: string;
}): Promise<ActionResponse<AttendanceRequestRecord>> {
  try {
    const prisma = getPrismaClient();
    const currentUser = await requireAttendanceRequestPermission("create");
    const employeeId = currentUser.employeeProfile?.id;

    if (!employeeId) {
      throw new Error("Employee profile not found for current user");
    }

    if (
      !input.requestType ||
      !Object.values(AttendanceRequestType).includes(input.requestType)
    ) {
      throw new Error("Attendance type is required");
    }

    const reason = input.reason?.trim();
    if (!reason) {
      throw new Error("Reason is required");
    }

    const notes = input.notes?.trim() || null;
    const attendanceId = input.attendanceId?.trim() || null;

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "AttendanceRequest"
      WHERE "employeeId" = ${employeeId}
        AND "status" = ${AttendanceRequestStatus.PENDING}
      LIMIT 1
    `;

    if (existing.length) {
      throw new Error("A pending attendance request already exists");
    }

    const attendance = attendanceId
      ? await prisma.attendance.findFirst({
          where: {
            id: attendanceId,
            employeeId,
          },
        })
      : null;

    const [request] = await prisma.$queryRaw<AttendanceRequestRawRow[]>`
  WITH inserted AS (
    INSERT INTO "AttendanceRequest" (
      "employeeId",
      "attendanceId",
      "requestType",
      "reason",
      "notes",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${employeeId},
      ${attendance?.id ?? null},
      ${input.requestType},
      ${reason},
      ${notes},
      NOW(),
      NOW()
    )
    RETURNING *
  )
  SELECT
    ar."id",
    ar."employeeId",
    ep."employeeName",
    ep."employeeCode",
    d."name" AS "departmentName",
    COALESCE(a."date", ar."createdAt") AS "attendanceDate",
    ar."requestType",
    ar."reason",
    ar."notes",
    ar."status",
    TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "approvedByName",
    ar."approvedAt",
    ar."rejectionReason",
    ar."createdAt",
    ar."updatedAt"
  FROM inserted ar
  JOIN "EmployeeProfile" ep ON ep."id" = ar."employeeId"
  LEFT JOIN "Department" d ON d."id" = ep."departmentId"
  LEFT JOIN "Attendance" a ON a."id" = ar."attendanceId"
  LEFT JOIN "User" u ON u."id" = ar."approvedById"
`;

    if (!request) {
      throw new Error("Failed to create attendance request");
    }

    revalidateAttendanceRequestPaths();

    return {
      success: true,
      message: "Attendance request submitted successfully",
      data: mapAttendanceRequestRaw(request),
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getAttendanceRequests(): Promise<
  AttendanceRequestRecord[]
> {
  const prisma = getPrismaClient();
  const currentUser = await requireAttendanceRequestPermission("view");
  const isHrOrAdmin = canManageAllAttendance(currentUser.role?.name);

  const managedEmployeeIds = isHrOrAdmin
    ? []
    : await getManagedEmployeeIds(currentUser);
  const employeeIds = isHrOrAdmin ? null : managedEmployeeIds;

  if (!isHrOrAdmin && !managedEmployeeIds.length) {
    return [];
  }

  const rows = await prisma.$queryRaw<AttendanceRequestRawRow[]>(
    Prisma.sql`
      ${attendanceRequestQueryBase()}
      ${attendanceRequestScopeCondition(employeeIds)}
      ORDER BY ar."createdAt" DESC
    `,
  );

  return rows.map(mapAttendanceRequestRaw);
}

export async function getAttendanceRequestDashboard() {
  const requests = await getAttendanceRequests();

  return requests.reduce(
    (acc, request) => {
      if (request.status === AttendanceRequestStatus.PENDING) acc.pending += 1;
      if (request.status === AttendanceRequestStatus.APPROVED)
        acc.approved += 1;
      if (request.status === AttendanceRequestStatus.REJECTED)
        acc.rejected += 1;

      return acc;
    },
    {
      pending: 0,
      approved: 0,
      rejected: 0,
    },
  );
}

export async function reviewAttendanceRequest(
  id: string,
  input: {
    status?: AttendanceRequestStatus;
    rejectionReason?: string;
  },
): Promise<ActionResponse<AttendanceRequestRecord>> {
  try {
    const prisma = getPrismaClient();
    const currentUser = await requireAttendanceRequestPermission("edit");
    const isHrOrAdmin = canManageAllAttendance(currentUser.role?.name);
    const managedEmployeeIds = isHrOrAdmin
      ? []
      : await getManagedEmployeeIds(currentUser);

    if (
      input.status !== AttendanceRequestStatus.APPROVED &&
      input.status !== AttendanceRequestStatus.REJECTED
    ) {
      throw new Error("Review status must be approved or rejected");
    }

    const [existing] = await prisma.$queryRaw<AttendanceRequestRawRow[]>`
      ${attendanceRequestQueryBase()}
      WHERE ar."id" = ${id}
      LIMIT 1
    `;

    if (!existing) {
      throw new Error("Attendance request not found");
    }

    if (!isHrOrAdmin && !managedEmployeeIds.length) {
      throw new Error(
        "You can only review requests from your reporting employees",
      );
    }

    if (
      !isHrOrAdmin &&
      managedEmployeeIds.length &&
      !managedEmployeeIds.includes(existing.employeeId)
    ) {
      throw new Error(
        "You can only review requests from your reporting employees",
      );
    }

    if (existing.status !== AttendanceRequestStatus.PENDING) {
      throw new Error("Only pending attendance requests can be reviewed");
    }

    const requestDate = toDateOnly(
      existing.attendanceDate ?? existing.createdAt,
    );
    const attendanceStatus = getAttendanceStatusForRequest(
      existing.requestType,
    );
    const reviewerId = currentUser.id || null;

    const request = await prisma.$transaction(async (transaction) => {
      const [updatedRequest] = await transaction.$queryRaw<
        AttendanceRequestRawRow[]
      >`
        WITH updated AS (
          UPDATE "AttendanceRequest"
          SET
            "status" = ${input.status},
            "approvedById" = ${
              input.status === AttendanceRequestStatus.APPROVED
                ? reviewerId
                : null
            },
            "approvedAt" = ${
              input.status === AttendanceRequestStatus.APPROVED
                ? new Date()
                : null
            },
            "rejectionReason" = ${
              input.status === AttendanceRequestStatus.REJECTED
                ? input.rejectionReason?.trim() || null
                : null
            }
          WHERE "id" = ${id}
          RETURNING *
        )
        SELECT
          ar."id",
          ar."employeeId",
          ep."employeeName",
          ep."employeeCode",
          d."name" AS "departmentName",
          COALESCE(a."date", ar."createdAt") AS "attendanceDate",
          ar."requestType",
          ar."reason",
          ar."notes",
          ar."status",
          TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "approvedByName",
          ar."approvedAt",
          ar."rejectionReason",
          ar."createdAt",
          ar."updatedAt"
        FROM updated ar
        JOIN "EmployeeProfile" ep ON ep."id" = ar."employeeId"
        LEFT JOIN "Department" d ON d."id" = ep."departmentId"
        LEFT JOIN "Attendance" a ON a."id" = ar."attendanceId"
        LEFT JOIN "User" u ON u."id" = ar."approvedById"
      `;

      if (!updatedRequest) {
        throw new Error("Attendance request not found");
      }

      const attendanceData =
        input.status === AttendanceRequestStatus.APPROVED
          ? {
              status: attendanceStatus,
              isHalfDay:
                existing.requestType === AttendanceRequestType.HALF_DAY,
              isLate: false,
              remarks: [
                `Attendance request approved: ${existing.requestType.replaceAll("_", " ")}`,
                existing.reason,
                existing.notes ? `Notes: ${existing.notes}` : "",
              ]
                .filter(Boolean)
                .join(" | "),
            }
          : {
              status: AttendanceStatus.ABSENT,
              checkIn: null,
              checkOut: null,
              workingHours: null,
              isLate: false,
              isHalfDay: false,
              remarks: null,
            };

      await transaction.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: updatedRequest.employeeId,
            date: requestDate,
          },
        },
        update: attendanceData,
        create: {
          employeeId: updatedRequest.employeeId,
          date: requestDate,
          ...attendanceData,
        },
      });

      return updatedRequest;
    });

    revalidateAttendanceRequestPaths();

    return {
      success: true,
      message:
        request.status === AttendanceRequestStatus.APPROVED
          ? "Attendance request approved"
          : "Attendance request rejected",
      data: mapAttendanceRequestRaw(request),
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
