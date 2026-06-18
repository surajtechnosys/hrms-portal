"use server";

import { EmployeeType, Prisma, Status } from "@prisma/client";
import { EmployeeProfile } from "@/types";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { attachApplicantDocumentToEmployeeProfile } from "./employee-documents";
import { prisma } from "../prisma";
import { formatError } from "../utils";
import { employeeProfileSchema } from "../validators";

type ActionResponse = {
  success: boolean;
  message: string;
};

const EXISTING_PASSWORD_SENTINEL = "__KEEP__";

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function toIsoDate(value?: Date | null) {
  return value?.toISOString().split("T")[0] ?? "";
}

function connectRelation(id?: string | null) {
  return id ? { connect: { id } } : { disconnect: true };
}

function isEmailUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("email")
  );
}

async function findEmployeeProfileByEmail(email: string, excludeId?: string) {
  return prisma.employeeProfile.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      employeeName: true,
      employeeCode: true,
      email: true,
    },
  });
}

function getNextEmployeeCode(codes: string[]) {
  const nextNumber =
    codes.reduce((max, code) => {
      const match = /^emp-(\d+)$/i.exec(code);
      const number = match ? Number(match[1]) : 0;
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0) + 1;

  return `emp-${String(nextNumber).padStart(3, "0")}`;
}

async function generateEmployeeCode() {
  const profiles = await prisma.employeeProfile.findMany({
    where: {
      employeeCode: {
        startsWith: "emp-",
        mode: "insensitive",
      },
    },
    select: {
      employeeCode: true,
    },
  });

  return getNextEmployeeCode(
    profiles.map((profile) => profile.employeeCode),
  );
}

export async function getNextEmployeeCodePreview() {
  try {
    return await generateEmployeeCode();
  } catch {
    return "emp-001";
  }
}

type EmployeeProfileRecord = Prisma.EmployeeProfileGetPayload<{
  include: typeof employeeProfileInclude;
}>;

function mapEmployeeProfile(record: EmployeeProfileRecord): EmployeeProfile {
  return {
    id: record.id,
    managerId: record.managerId ?? "",
    email: record.email ?? "",
    employeeName: record.employeeName,
    employeeCode: record.employeeCode,
    companyId: record.companyId ?? "",
    phone: record.phone,
    alternatePhone: record.alternatePhone ?? "",
    gender: record.gender ?? "",
    dateOfBirth: toIsoDate(record.dateOfBirth),
    joiningDate: toIsoDate(record.joiningDate),
    employeeType: record.employeeType,
    probationStartDate: toIsoDate(record.probationStartDate),
    probationEndDate: toIsoDate(record.probationEndDate),
    trainingStartDate: toIsoDate(record.trainingStartDate),
    trainingEndDate: toIsoDate(record.trainingEndDate),
    departmentId: record.departmentId ?? "",
    jobRoleId: record.jobRoleId ?? "",
    workLocationId: record.workLocationId ?? "",
    password: record.password ? EXISTING_PASSWORD_SENTINEL : "",
    address: record.address ?? "",
    emergencyContactName: record.emergencyContactName ?? "",
    emergencyContactPhone: record.emergencyContactPhone ?? "",
    remark: record.remark ?? "",
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    companyName: record.company?.companyName ?? "",
    departmentName: record.department?.name ?? "",
    jobRoleName: record.jobRole?.name ?? "",
    managerName: record.manager?.employeeName ?? "",
    workLocationName: record.workLocation?.name ?? "",
    projectNames:
      record.projectMembers?.map((member) => member.project.name) ?? [],
  };
}

const employeeProfileInclude = {
  manager: {
    select: {
      employeeName: true,
      employeeCode: true,
    },
  },
  company: {
    select: {
      companyName: true,
    },
  },
  department: {
    select: {
      name: true,
    },
  },
  jobRole: {
    select: {
      name: true,
    },
  },
  workLocation: {
    select: {
      name: true,
    },
  },
  projectMembers: {
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  },
};

export async function getEmployeeProfileOptions() {
  try {
    const [managers, companies, departments, jobRoles, workLocations, projects] =
      await Promise.all([
        prisma.employeeProfile.findMany({
          orderBy: [{ employeeName: "asc" }, { employeeCode: "asc" }],
          select: {
            id: true,
            employeeName: true,
            employeeCode: true,
          },
        }),
        prisma.company.findMany({
          orderBy: { companyName: "asc" },
          select: { id: true, companyName: true },
        }),
        prisma.department.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.jobRole.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.workLocation.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.project.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
      ]);

    return {
      managers,
      companies,
      departments,
      jobRoles,
      workLocations,
      projects,
    };
  } catch {
    return {
      managers: [],
      companies: [],
      departments: [],
      jobRoles: [],
      workLocations: [],
      projects: [],
    };
  }
}

export async function getEmployeeProfileSelectOptions() {
  try {
    return await prisma.employeeProfile.findMany({
      orderBy: [{ employeeName: "asc" }, { employeeCode: "asc" }],
      select: {
        id: true,
        employeeName: true,
        employeeCode: true,
        status: true,
      },
    });
  } catch {
    return [];
  }
}

export interface EmployeeFilters {
  employeeId?: string;
  employeeName?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  departmentId?: string;
  jobRoleId?: string;
  workLocationId?: string;
  status?: string;
  employeeType?: string;
  joiningDateFrom?: string;
  joiningDateTo?: string;
  project?: string;
}

export async function getEmployeeProfiles(): Promise<EmployeeProfile[]> {
  try {
    const records = await prisma.employeeProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: employeeProfileInclude,
    });

    return records.map(mapEmployeeProfile);
  } catch {
    return [];
  }
}

export async function getFilteredEmployeeProfiles(
  filters: EmployeeFilters = {},
): Promise<EmployeeProfile[]> {
  try {
    const where: Prisma.EmployeeProfileWhereInput = {};

    if (filters.employeeId) {
      where.employeeCode = {
        contains: filters.employeeId,
        mode: "insensitive",
      };
    }

    if (filters.project) {
      const project = await prisma.project.findFirst({
        where: {
          name: {
            equals: filters.project,
            mode: "insensitive",
          },
        },
      });

      if (project) {
        where.projectMembers = {
          some: {
            projectId: project.id,
          },
        };
      }
    }

    if (filters.employeeName) {
      where.employeeName = {
        contains: filters.employeeName,
        mode: "insensitive",
      };
    }

    if (filters.email) {
      where.email = {
        contains: filters.email,
        mode: "insensitive",
      };
    }

    if (filters.phone) {
      where.phone = {
        contains: filters.phone,
        mode: "insensitive",
      };
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.jobRoleId) {
      where.jobRoleId = filters.jobRoleId;
    }

    if (filters.workLocationId) {
      where.workLocationId = filters.workLocationId;
    }

    if (
      filters.employeeType &&
      Object.values(EmployeeType).includes(filters.employeeType as EmployeeType)
    ) {
      where.employeeType = filters.employeeType as EmployeeType;
    }

    if (
      filters.status &&
      filters.status !== "ALL" &&
      Object.values(Status).includes(filters.status as Status)
    ) {
      where.status = filters.status as Status;
    }

    if (filters.joiningDateFrom || filters.joiningDateTo) {
      where.joiningDate = {};

      if (filters.joiningDateFrom) {
        where.joiningDate.gte = new Date(filters.joiningDateFrom);
      }
      if (filters.joiningDateTo) {
        where.joiningDate.lte = new Date(filters.joiningDateTo);
      }
    }

    const records = await prisma.employeeProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ...employeeProfileInclude,
      },
    });

    return records.map(mapEmployeeProfile);
  } catch (error) {
    console.error("Error fetching filtered employee profiles:", error);
    return [];
  }
}

export async function createEmployeeProfile(
  data: EmployeeProfile,
): Promise<ActionResponse> {
  try {
    const record = employeeProfileSchema.parse(data);
    const employeeName = record.employeeName.trim();
    const email = record.email.trim();

    const existingEmployee = await findEmployeeProfileByEmail(email);
    if (existingEmployee) {
      return {
        success: false,
        message: `An employee profile already exists for ${email}.`,
      };
    }

    const employeeCode = await generateEmployeeCode();

    const hashedPassword =
      record.password &&
        record.password !== EXISTING_PASSWORD_SENTINEL
        ? await bcrypt.hash(record.password, 10)
        : null;

    await prisma.$transaction(async (tx) => {
      const employee = await tx.employeeProfile.create({
        data: {
          employeeName,
          employeeCode,
          email,
          password: hashedPassword,
          employeeType: record.employeeType,
          probationStartDate:
            record.employeeType === EmployeeType.PROBATIONER
              ? toDate(record.probationStartDate)
              : null,
          probationEndDate:
            record.employeeType === EmployeeType.PROBATIONER
              ? toDate(record.probationEndDate)
              : null,
          trainingStartDate:
            record.employeeType === EmployeeType.TRAINEE
              ? toDate(record.trainingStartDate)
              : null,
          trainingEndDate:
            record.employeeType === EmployeeType.TRAINEE
              ? toDate(record.trainingEndDate)
              : null,
          manager: record.managerId
            ? { connect: { id: record.managerId } }
            : undefined,
          company: record.companyId
            ? { connect: { id: record.companyId } }
            : undefined,
          department: record.departmentId
            ? { connect: { id: record.departmentId } }
            : undefined,
          jobRole: record.jobRoleId
            ? { connect: { id: record.jobRoleId } }
            : undefined,
          workLocation: record.workLocationId
            ? { connect: { id: record.workLocationId } }
            : undefined,

          phone: record.phone,
          alternatePhone: record.alternatePhone || null,
          gender: record.gender || null,
          dateOfBirth: toDate(record.dateOfBirth),
          joiningDate: new Date(record.joiningDate),

          address: record.address || null,
          emergencyContactName: record.emergencyContactName || null,
          emergencyContactPhone: record.emergencyContactPhone || null,
          remark: record.remark || null,
          status: record.status,
        },
      });

      if (record.sourceApplicantDocumentId) {
        await attachApplicantDocumentToEmployeeProfile({
          applicantDocumentId: record.sourceApplicantDocumentId,
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          tx,
        });
      }
    });

    revalidatePath("/employee-profiles");
    revalidatePath("/employee-dashboard");
    revalidatePath("/employee-documents");

    return {
      success: true,
      message: "Employee profile created successfully",
    };
  } catch (error) {
    if (isEmailUniqueConstraintError(error)) {
      return {
        success: false,
        message: "An employee profile already exists for this email.",
      };
    }

    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getEmployeeProfileById(id: string) {
  try {
    const record = await prisma.employeeProfile.findUnique({
      where: { id },
      include: employeeProfileInclude,
    });

    if (!record) {
      return {
        success: false,
        message: "Employee profile not found",
      };
    }

    return {
      success: true,
      data: mapEmployeeProfile(record),
      message: "Employee profile fetched successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateEmployeeProfile(
  data: EmployeeProfile,
  id: string,
): Promise<ActionResponse> {
  try {
    const record = employeeProfileSchema.parse(data);
    const employeeName = record.employeeName.trim();
    const email = record.email.trim();

    if (record.managerId && record.managerId === id) {
      return {
        success: false,
        message: "Employee cannot be assigned as their own manager",
      };
    }

    const hashedPassword =
      record.password &&
        record.password !== EXISTING_PASSWORD_SENTINEL
        ? await bcrypt.hash(record.password, 10)
        : null;

    const existingRecord = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { employeeCode: true },
    });

    if (!existingRecord) {
      return {
        success: false,
        message: "Employee profile not found",
      };
    }

    const existingEmployee = await findEmployeeProfileByEmail(email, id);
    if (existingEmployee) {
      return {
        success: false,
        message: `An employee profile already exists for ${email}.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.employeeProfile.update({
        where: { id },
        data: {
          employeeName,
          employeeCode: record.employeeCode || existingRecord.employeeCode,
          email,
          ...(hashedPassword ? { password: hashedPassword } : {}),
          employeeType: record.employeeType,
          probationStartDate:
            record.employeeType === EmployeeType.PROBATIONER
              ? toDate(record.probationStartDate)
              : null,
          probationEndDate:
            record.employeeType === EmployeeType.PROBATIONER
              ? toDate(record.probationEndDate)
              : null,
          trainingStartDate:
            record.employeeType === EmployeeType.TRAINEE
              ? toDate(record.trainingStartDate)
              : null,
          trainingEndDate:
            record.employeeType === EmployeeType.TRAINEE
              ? toDate(record.trainingEndDate)
              : null,
          manager: connectRelation(record.managerId),
          company: connectRelation(record.companyId),
          department: connectRelation(record.departmentId),
          jobRole: connectRelation(record.jobRoleId),
          workLocation: connectRelation(record.workLocationId),

          phone: record.phone,
          alternatePhone: record.alternatePhone || null,
          gender: record.gender || null,
          dateOfBirth: toDate(record.dateOfBirth),
          joiningDate: new Date(record.joiningDate),

          address: record.address || null,
          emergencyContactName: record.emergencyContactName || null,
          emergencyContactPhone: record.emergencyContactPhone || null,
          remark: record.remark || null,
          status: record.status,
        },
      });

    });

    revalidatePath("/employee-profiles");
    revalidatePath(`/employee-profiles/edit/${id}`);
    revalidatePath("/employee-dashboard");

    return {
      success: true,
      message: "Employee profile updated successfully",
    };
  } catch (error) {
    if (isEmailUniqueConstraintError(error)) {
      return {
        success: false,
        message: "An employee profile already exists for this email.",
      };
    }

    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function deleteEmployeeProfile(
  id: string,
): Promise<ActionResponse> {
  try {
    await prisma.employeeProfile.delete({
      where: { id },
    });

    revalidatePath("/employee-profiles");

    return {
      success: true,
      message: "Employee profile deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
