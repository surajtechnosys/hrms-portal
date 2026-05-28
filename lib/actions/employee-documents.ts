"use server";

import { auth } from "@/auth";
import { DocumentReviewStatus, Prisma } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

import { EmployeeDocument } from "@/types";
import type { RecruitmentApplicantOption } from "./recruitment";
import {
  getRecruitmentApplications,
  markApplicantDocumentsSubmitted,
} from "./recruitment";
import { isHrJobRoleName } from "../employee-job-role";
import { prisma } from "../prisma";
import { formatError } from "../utils";
import { employeeDocumentSchema } from "../validators";

type ActionResponse = {
  success: boolean;
  message: string;
};

type CurrentDocumentContext = {
  isEmployee: boolean;
  isHrEmployee: boolean;
  isApplicant: boolean;
  currentEmployee: {
    id: string;
    employeeCode: string;
    employeeName: string;
  } | null;
  currentApplicant: {
    id: string;
    applicantCode: string;
    candidateName: string;
  } | null;
};

type ApplicantDocumentOption = {
  id: string;
  applicantId: string;
  requestId: string;
  candidateName: string;
  mobileNumber: string;
  email: string;
  reviewStatus: DocumentReviewStatus | "PENDING" | "APPROVED" | "REJECTED";
  linkedEmployeeId: string;
};

const dataFilePath = path.join(
  process.cwd(),
  "lib",
  "data",
  "applicant-documents.json",
);

async function ensureDataFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

async function readApplicantDocumentData(): Promise<EmployeeDocument[]> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmployeeDocument[]) : [];
  } catch {
    return [];
  }
}

async function writeApplicantDocumentData(data: EmployeeDocument[]) {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
}

async function getCurrentDocumentContext(): Promise<CurrentDocumentContext> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      isEmployee: false,
      isHrEmployee: false,
      isApplicant: false,
      currentEmployee: null,
      currentApplicant: null,
    };
  }

  const isEmployee = session.user.role?.toLowerCase() === "employee";
  const isApplicant =
    session.user.accountType === "applicant" ||
    session.user.role?.toLowerCase() === "applicant";
  const employeeProfile = isEmployee
    ? await prisma.employeeProfile.findFirst({
        where: { email: session.user.email },
        select: {
          id: true,
          employeeCode: true,
          employeeName: true,
          jobRole: {
            select: {
              name: true,
            },
          },
        },
      })
    : null;
  const applicantRecord = isApplicant
    ? (await getRecruitmentApplications()).find(
        (record) => record.id === session.user.id,
      )
    : null;

  return {
    isEmployee,
    isHrEmployee: isHrJobRoleName(employeeProfile?.jobRole?.name),
    isApplicant,
    currentEmployee: employeeProfile
      ? {
          id: employeeProfile.id,
          employeeCode: employeeProfile.employeeCode,
          employeeName: employeeProfile.employeeName,
        }
      : null,
    currentApplicant: applicantRecord
      ? {
          id: applicantRecord.id ?? "",
          applicantCode: applicantRecord.requestId || applicantRecord.serialNumber || "",
          candidateName: applicantRecord.candidateName,
        }
      : null,
  };
}

function isSelfServiceEmployeeContext(
  context: CurrentDocumentContext,
): context is CurrentDocumentContext & {
  isEmployee: true;
  currentEmployee: NonNullable<CurrentDocumentContext["currentEmployee"]>;
} {
  return context.isEmployee && !context.isHrEmployee && !!context.currentEmployee;
}

function isApplicantContext(
  context: CurrentDocumentContext,
): context is CurrentDocumentContext & {
  isApplicant: true;
  currentApplicant: NonNullable<CurrentDocumentContext["currentApplicant"]>;
} {
  return context.isApplicant && !!context.currentApplicant;
}

type PrismaEmployeeDocumentRecord = Prisma.EmployeeDocumentGetPayload<{
  include: {
    employee: {
      select: {
        id: true;
        employeeCode: true;
        employeeName: true;
      };
    };
  };
}>;

function mapPrismaEmployeeDocument(
  record: PrismaEmployeeDocumentRecord,
): EmployeeDocument {
  return {
    id: record.id,
    documentOwnerType: "EMPLOYEE",
    applicantId: "",
    applicantCode: "",
    candidateName: "",
    employeeId: record.employeeId,
    employeeCode: record.employee.employeeCode,
    employeeName: record.employee.employeeName,
    aadhaarNumber: record.aadhaarNumber,
    aadhaarFileUrl: record.aadhaarFileUrl ?? "",
    panNumber: record.panNumber,
    panFileUrl: record.panFileUrl ?? "",
    educationEntries: Array.isArray(record.educationEntries)
      ? (record.educationEntries as EmployeeDocument["educationEntries"])
      : [],
    experienceType: record.experienceType,
    experienceEntries: Array.isArray(record.experienceEntries)
      ? (record.experienceEntries as EmployeeDocument["experienceEntries"])
      : [],
    reviewStatus: record.reviewStatus,
    reviewRemark: record.reviewRemark ?? "",
    reviewedAt: record.reviewedAt?.toISOString() ?? "",
    remark: record.remark ?? "",
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    applicantName: record.employee.employeeName,
    ownerName: record.employee.employeeName,
    ownerCode: record.employee.employeeCode,
  };
}

function mapApplicantDocument(record: EmployeeDocument): EmployeeDocument {
  const ownerName = record.candidateName ?? "";
  const ownerCode = record.applicantCode ?? "";

  return {
    ...record,
    id: record.id ?? "",
    documentOwnerType: "APPLICANT",
    applicantId: record.applicantId ?? "",
    applicantCode: record.applicantCode ?? "",
    candidateName: record.candidateName ?? "",
    employeeId: record.employeeId ?? "",
    employeeCode: record.employeeCode ?? "",
    employeeName: record.employeeName ?? "",
    linkedEmployeeId: record.linkedEmployeeId ?? "",
    linkedEmployeeCode: record.linkedEmployeeCode ?? "",
    linkedEmployeeName: record.linkedEmployeeName ?? "",
    aadhaarNumber: record.aadhaarNumber ?? "",
    aadhaarFileUrl: record.aadhaarFileUrl ?? "",
    panNumber: record.panNumber ?? "",
    panFileUrl: record.panFileUrl ?? "",
    educationEntries: record.educationEntries ?? [],
    experienceEntries: record.experienceEntries ?? [],
    reviewStatus: record.reviewStatus ?? "PENDING",
    reviewRemark: record.reviewRemark ?? "",
    reviewedByName: record.reviewedByName ?? "",
    reviewedAt: record.reviewedAt ?? "",
    remark: record.remark ?? "",
    applicantName: ownerName,
    ownerName,
    ownerCode,
  };
}

function normalizeApplicantDocument(input: EmployeeDocument): EmployeeDocument {
  const now = new Date().toISOString();

  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    documentOwnerType: "APPLICANT",
    applicantId: input.applicantId?.trim() || "",
    applicantCode: input.applicantCode?.trim() || "",
    candidateName: input.candidateName?.trim() || "",
    employeeId: "",
    employeeCode: "",
    employeeName: "",
    linkedEmployeeId: input.linkedEmployeeId?.trim() || "",
    linkedEmployeeCode: input.linkedEmployeeCode?.trim() || "",
    linkedEmployeeName: input.linkedEmployeeName?.trim() || "",
    aadhaarNumber: input.aadhaarNumber.trim(),
    aadhaarFileUrl: input.aadhaarFileUrl || "",
    panNumber: input.panNumber.trim(),
    panFileUrl: input.panFileUrl || "",
    educationEntries: input.educationEntries ?? [],
    experienceType: input.experienceType,
    experienceEntries: input.experienceEntries ?? [],
    reviewStatus: input.reviewStatus ?? "PENDING",
    reviewRemark: input.reviewRemark?.trim() || "",
    reviewedByName: input.reviewedByName?.trim() || "",
    reviewedAt: input.reviewedAt || "",
    remark: input.remark?.trim() || "",
    status: input.status,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

function normalizeEmployeeDocumentForPrisma(
  input: EmployeeDocument,
  employee: NonNullable<CurrentDocumentContext["currentEmployee"]>,
) {
  return {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    aadhaarNumber: input.aadhaarNumber.trim(),
    aadhaarFileUrl: input.aadhaarFileUrl || null,
    panNumber: input.panNumber.trim(),
    panFileUrl: input.panFileUrl || null,
    educationEntries: (input.educationEntries ?? []) as Prisma.InputJsonValue,
    experienceType: input.experienceType,
    experienceEntries: (input.experienceEntries ?? []) as Prisma.InputJsonValue,
    reviewStatus: DocumentReviewStatus.PENDING,
    reviewRemark: "",
    reviewedAt: null,
    remark: input.remark?.trim() || null,
    status: input.status,
  };
}

async function getApplicantDocumentOptionsBase(): Promise<ApplicantDocumentOption[]> {
  const [documentRecords, recruitmentRecords] = await Promise.all([
    readApplicantDocumentData(),
    getRecruitmentApplications(),
  ]);

  const recruitmentById = new Map(
    recruitmentRecords.map((record) => [record.id ?? "", record]),
  );

  return documentRecords
    .map(mapApplicantDocument)
    .map((record) => {
      const recruitmentRecord = recruitmentById.get(record.applicantId ?? "");

      return {
        id: record.id ?? "",
        applicantId: record.applicantId ?? "",
        requestId: record.applicantCode ?? "",
        candidateName: record.candidateName ?? "",
        mobileNumber: recruitmentRecord?.mobileNumber ?? "",
        email: recruitmentRecord?.email ?? "",
        reviewStatus: record.reviewStatus ?? "PENDING",
        linkedEmployeeId: record.linkedEmployeeId ?? "",
      };
    })
    .sort((a, b) => a.candidateName.localeCompare(b.candidateName));
}

export async function getApplicantDocumentOptionsForEmployeeCreation() {
  try {
    return await getApplicantDocumentOptionsBase();
  } catch {
    return [];
  }
}

export async function attachApplicantDocumentToEmployeeProfile(params: {
  applicantDocumentId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  tx?: Prisma.TransactionClient;
}) {
  const records = await readApplicantDocumentData();
  const index = records.findIndex((item) => item.id === params.applicantDocumentId);

  if (index === -1) {
    throw new Error("Applicant document not found");
  }

  const applicantRecord = mapApplicantDocument(records[index]);

  if (
    applicantRecord.linkedEmployeeId &&
    applicantRecord.linkedEmployeeId !== params.employeeId
  ) {
    throw new Error("This applicant document is already connected to another employee");
  }

  const client = params.tx ?? prisma;

  await client.employeeDocument.create({
    data: {
      employeeId: params.employeeId,
      employeeCode: params.employeeCode,
      aadhaarNumber: applicantRecord.aadhaarNumber,
      aadhaarFileUrl: applicantRecord.aadhaarFileUrl || null,
      panNumber: applicantRecord.panNumber,
      panFileUrl: applicantRecord.panFileUrl || null,
      educationEntries:
        (applicantRecord.educationEntries ?? []) as Prisma.InputJsonValue,
      experienceType: applicantRecord.experienceType,
      experienceEntries:
        (applicantRecord.experienceEntries ?? []) as Prisma.InputJsonValue,
      reviewStatus:
        applicantRecord.reviewStatus === "APPROVED"
          ? DocumentReviewStatus.APPROVED
          : DocumentReviewStatus.PENDING,
      reviewRemark: applicantRecord.reviewRemark || null,
      reviewedAt: applicantRecord.reviewedAt
        ? new Date(applicantRecord.reviewedAt)
        : null,
      remark: applicantRecord.remark || null,
      status: applicantRecord.status,
    },
  });

  records[index] = normalizeApplicantDocument({
    ...applicantRecord,
    linkedEmployeeId: params.employeeId,
    linkedEmployeeCode: params.employeeCode,
    linkedEmployeeName: params.employeeName,
  });

  await writeApplicantDocumentData(records);

  revalidatePath("/employee-documents");
  revalidatePath("/employee-profiles");
  revalidatePath("/employee-dashboard");
}

export async function getEmployeeDocuments(): Promise<EmployeeDocument[]> {
  try {
    const context = await getCurrentDocumentContext();

    if (isApplicantContext(context)) {
      const records = await readApplicantDocumentData();
      return records
        .map(mapApplicantDocument)
        .filter((record) => record.applicantId === context.currentApplicant.id)
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }

    if (isSelfServiceEmployeeContext(context)) {
      const records = await prisma.employeeDocument.findMany({
        where: { employeeId: context.currentEmployee.id },
        orderBy: { updatedAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              employeeName: true,
            },
          },
        },
      });

      return records.map(mapPrismaEmployeeDocument);
    }

    const records = await readApplicantDocumentData();
    return records
      .map(mapApplicantDocument)
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  } catch {
    return [];
  }
}

export async function createEmployeeDocument(
  data: EmployeeDocument,
): Promise<ActionResponse> {
  try {
    const context = await getCurrentDocumentContext();

    if (isApplicantContext(context)) {
      const record = employeeDocumentSchema.parse({
        ...data,
        documentOwnerType: "APPLICANT",
        applicantId: context.currentApplicant.id,
        applicantCode: context.currentApplicant.applicantCode,
        candidateName: context.currentApplicant.candidateName,
      });
      const records = await readApplicantDocumentData();

      records.push(normalizeApplicantDocument(record));
      await writeApplicantDocumentData(records);
      await markApplicantDocumentsSubmitted(context.currentApplicant.id);

      revalidatePath("/applicant-dashboard");

      return {
        success: true,
        message: "Applicant document submitted successfully",
      };
    }

    if (isSelfServiceEmployeeContext(context)) {
      const record = employeeDocumentSchema.parse({
        ...data,
        documentOwnerType: "EMPLOYEE",
        employeeId: context.currentEmployee.id,
        employeeCode: context.currentEmployee.employeeCode,
        employeeName: context.currentEmployee.employeeName,
      });

      await prisma.employeeDocument.create({
        data: normalizeEmployeeDocumentForPrisma(record, context.currentEmployee),
      });

      revalidatePath("/employee-documents");
      revalidatePath("/employee-dashboard");

      return {
        success: true,
        message: "Employee document created successfully",
      };
    }

    const record = employeeDocumentSchema.parse({
      ...data,
      documentOwnerType: "APPLICANT",
    });
    const records = await readApplicantDocumentData();

    records.push(normalizeApplicantDocument(record));
    await writeApplicantDocumentData(records);

    revalidatePath("/employee-documents");
    revalidatePath("/recruitment");

    return {
      success: true,
      message: "Applicant document created successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getEmployeeDocumentById(id: string) {
  try {
    const context = await getCurrentDocumentContext();

    if (isApplicantContext(context)) {
      const records = await readApplicantDocumentData();
      const record = records
        .map(mapApplicantDocument)
        .find(
          (item) =>
            item.id === id && item.applicantId === context.currentApplicant.id,
        );

      if (!record) {
        return {
          success: false,
          message: "Applicant document not found",
        };
      }

      return {
        success: true,
        data: record,
        message: "Applicant document fetched successfully",
      };
    }

    if (isSelfServiceEmployeeContext(context)) {
      const record = await prisma.employeeDocument.findFirst({
        where: {
          id,
          employeeId: context.currentEmployee.id,
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              employeeName: true,
            },
          },
        },
      });

      if (!record) {
        return {
          success: false,
          message: "Employee document not found",
        };
      }

      return {
        success: true,
        data: mapPrismaEmployeeDocument(record),
        message: "Employee document fetched successfully",
      };
    }

    const records = await readApplicantDocumentData();
    const record = records.find((item) => item.id === id);

    if (!record) {
      return {
        success: false,
        message: "Applicant document not found",
      };
    }

    return {
      success: true,
      data: mapApplicantDocument(record),
      message: "Applicant document fetched successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateEmployeeDocument(
  data: EmployeeDocument,
  id: string,
): Promise<ActionResponse> {
  try {
    const context = await getCurrentDocumentContext();

    if (isApplicantContext(context)) {
      const record = employeeDocumentSchema.parse({
        ...data,
        documentOwnerType: "APPLICANT",
        applicantId: context.currentApplicant.id,
        applicantCode: context.currentApplicant.applicantCode,
        candidateName: context.currentApplicant.candidateName,
      });
      const records = await readApplicantDocumentData();
      const index = records.findIndex(
        (item) =>
          item.id === id && item.applicantId === context.currentApplicant.id,
      );

      if (index === -1) {
        return {
          success: false,
          message: "Applicant document not found",
        };
      }

      records[index] = normalizeApplicantDocument({
        ...record,
        id,
        createdAt: records[index].createdAt,
        reviewStatus: "PENDING",
        reviewRemark: "",
        reviewedByName: "",
        reviewedAt: "",
        linkedEmployeeId: records[index].linkedEmployeeId,
        linkedEmployeeCode: records[index].linkedEmployeeCode,
        linkedEmployeeName: records[index].linkedEmployeeName,
      });

      await writeApplicantDocumentData(records);
      await markApplicantDocumentsSubmitted(context.currentApplicant.id);

      revalidatePath("/applicant-dashboard");

      return {
        success: true,
        message: "Applicant document updated successfully",
      };
    }

    if (isSelfServiceEmployeeContext(context)) {
      const record = employeeDocumentSchema.parse({
        ...data,
        documentOwnerType: "EMPLOYEE",
        employeeId: context.currentEmployee.id,
        employeeCode: context.currentEmployee.employeeCode,
        employeeName: context.currentEmployee.employeeName,
      });

      const existing = await prisma.employeeDocument.findFirst({
        where: {
          id,
          employeeId: context.currentEmployee.id,
        },
        select: { id: true },
      });

      if (!existing) {
        return {
          success: false,
          message: "Employee document not found",
        };
      }

      await prisma.employeeDocument.update({
        where: { id },
        data: normalizeEmployeeDocumentForPrisma(record, context.currentEmployee),
      });

      revalidatePath("/employee-documents");
      revalidatePath(`/employee-documents/edit/${id}`);
      revalidatePath("/employee-dashboard");

      return {
        success: true,
        message: "Employee document updated successfully",
      };
    }

    const record = employeeDocumentSchema.parse({
      ...data,
      documentOwnerType: "APPLICANT",
    });
    const records = await readApplicantDocumentData();
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Applicant document not found",
      };
    }

    records[index] = normalizeApplicantDocument({
      ...record,
      id,
      createdAt: records[index].createdAt,
      reviewStatus: "PENDING",
      reviewRemark: "",
      reviewedByName: "",
      reviewedAt: "",
      linkedEmployeeId: records[index].linkedEmployeeId,
      linkedEmployeeCode: records[index].linkedEmployeeCode,
      linkedEmployeeName: records[index].linkedEmployeeName,
    });

    await writeApplicantDocumentData(records);

    revalidatePath("/employee-documents");
    revalidatePath(`/employee-documents/edit/${id}`);
    revalidatePath("/recruitment");

    return {
      success: true,
      message: "Applicant document updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function reviewEmployeeDocument(
  id: string,
  input: { reviewStatus?: "APPROVED" | "REJECTED"; reviewRemark?: string },
): Promise<ActionResponse> {
  try {
    const context = await getCurrentDocumentContext();

    if (!context.isHrEmployee) {
      return {
        success: false,
        message: "Only HR can review applicant documents",
      };
    }

    if (
      input.reviewStatus !== "APPROVED" &&
      input.reviewStatus !== "REJECTED"
    ) {
      return {
        success: false,
        message: "Review status must be approved or rejected",
      };
    }

    const session = await auth();
    const reviewerName =
      session?.user?.name ||
      session?.user?.firstName ||
      session?.user?.username ||
      "HR Reviewer";

    const records = await readApplicantDocumentData();
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Applicant document not found",
      };
    }

    records[index] = normalizeApplicantDocument({
      ...records[index],
      reviewStatus: input.reviewStatus,
      reviewRemark: input.reviewRemark?.trim() || "",
      reviewedByName: reviewerName,
      reviewedAt: new Date().toISOString(),
    });

    await writeApplicantDocumentData(records);

    revalidatePath("/employee-documents");
    revalidatePath("/recruitment");

    return {
      success: true,
      message:
        input.reviewStatus === "APPROVED"
          ? "Document approved"
          : "Document rejected",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function deleteEmployeeDocument(
  id: string,
): Promise<ActionResponse> {
  try {
    const context = await getCurrentDocumentContext();

    if (isSelfServiceEmployeeContext(context)) {
      await prisma.employeeDocument.deleteMany({
        where: {
          id,
          employeeId: context.currentEmployee.id,
        },
      });

      revalidatePath("/employee-documents");
      revalidatePath("/employee-dashboard");

      return {
        success: true,
        message: "Employee document deleted successfully",
      };
    }

    const records = await readApplicantDocumentData();
    const nextRecords = records.filter((item) => item.id !== id);

    await writeApplicantDocumentData(nextRecords);
    revalidatePath("/employee-documents");
    revalidatePath("/recruitment");

    return {
      success: true,
      message: "Applicant document deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getRecruitmentApplicantOptions(): Promise<
  RecruitmentApplicantOption[]
> {
  const records = await getRecruitmentApplications();

  return records.map((item) => ({
    id: item.id ?? "",
    requestId: item.requestId || item.serialNumber || "",
    candidateName: item.candidateName,
    profilePost: item.profilePost,
  }));
}
