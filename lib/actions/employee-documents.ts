"use server";

import { auth } from "@/auth";
import { DocumentReviewStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { EmployeeDocument } from "@/types";
import type { RecruitmentApplicantOption } from "./recruitment";
import { sendSystemEmail } from "../email";
import {
  getRecruitmentApplications,
  markApplicantDocumentsSubmitted,
} from "./recruitment";
import { isHrJobRoleName } from "../employee-job-role";
import {
  DOCUMENT_VERIFICATION_STATUSES,
  type DocumentVerificationStatus,
  formatDocumentVerificationStatus,
  getNextDocumentOverallStatus,
  getUploadedReviewableDocumentFields,
  REVIEWABLE_DOCUMENT_FIELDS,
} from "../employee-document-review";
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
  gender: string;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  reviewStatus: string;
  linkedEmployeeId: string;
};

async function readApplicantDocumentData(): Promise<EmployeeDocument[]> {
  try {
    const records = await prisma.employeeDocument.findMany({
      where: {
        documentOwnerType: "APPLICANT",
      },
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
  } catch {
    return [];
  }
}

function toDocumentReviewStatus(
  status?: string,
): DocumentReviewStatus {
  if (status === "APPROVED") return DocumentReviewStatus.APPROVED;
  if (status === "REJECTED") return DocumentReviewStatus.REJECTED;
  if (status === "REUPLOAD_REQUESTED") return DocumentReviewStatus.REUPLOAD_REQUESTED;
  return DocumentReviewStatus.PENDING;
}

function normalizeApplicantDocumentForPrisma(
  input: EmployeeDocument,
): Prisma.EmployeeDocumentUncheckedCreateInput {
  const normalized = normalizeApplicantDocument(input);

  return {
    id: normalized.id,
    documentOwnerType: "APPLICANT",
    applicantId: normalized.applicantId || null,
    candidateName: normalized.candidateName || null,
    employeeId: null,
    employeeCode: normalized.employeeCode || "",
    aadhaarNumber: normalized.aadhaarNumber,
    aadhaarFileUrl: normalized.aadhaarFileUrl || null,
    panNumber: normalized.panNumber,
    panFileUrl: normalized.panFileUrl || null,
    educationEntries: (normalized.educationEntries ?? []) as Prisma.InputJsonValue,
    experienceType: normalized.experienceType,
    experienceEntries: (normalized.experienceEntries ?? []) as Prisma.InputJsonValue,
    reviewStatus: toDocumentReviewStatus(normalized.reviewStatus),
    reviewRemark: normalized.reviewRemark || null,
    reviewedAt: normalized.reviewedAt ? new Date(normalized.reviewedAt) : null,
    remark: normalized.remark || null,
    status: normalized.status,
    documentPayload: normalized as Prisma.InputJsonValue,
  };
}

async function writeApplicantDocumentData(data: EmployeeDocument[]) {
  const nextRecords = data.map(normalizeApplicantDocument);
  const nextIds = nextRecords.map((record) => record.id).filter(Boolean) as string[];

  await prisma.$transaction(async (tx) => {
    const existingRecords = await tx.employeeDocument.findMany({
      where: {
        documentOwnerType: "APPLICANT",
      },
      select: {
        id: true,
      },
    });

    for (const record of nextRecords) {
      const payload = normalizeApplicantDocumentForPrisma(record);

      await tx.employeeDocument.upsert({
        where: { id: record.id ?? "" },
        update: {
          documentOwnerType: payload.documentOwnerType,
          applicantId: payload.applicantId,
          candidateName: payload.candidateName,
          employeeId: null,
          employeeCode: payload.employeeCode,
          aadhaarNumber: payload.aadhaarNumber,
          aadhaarFileUrl: payload.aadhaarFileUrl,
          panNumber: payload.panNumber,
          panFileUrl: payload.panFileUrl,
          educationEntries: payload.educationEntries,
          experienceType: payload.experienceType,
          experienceEntries: payload.experienceEntries,
          reviewStatus: payload.reviewStatus,
          reviewRemark: payload.reviewRemark,
          reviewedAt: payload.reviewedAt,
          remark: payload.remark,
          status: payload.status,
          documentPayload: payload.documentPayload,
        },
        create: {
          ...payload,
          createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined,
        },
      });
    }

    const idsToDelete = existingRecords
      .map((record) => record.id)
      .filter((id) => !nextIds.includes(id));

    if (idsToDelete.length) {
      await tx.employeeDocument.deleteMany({
        where: {
          documentOwnerType: "APPLICANT",
          id: {
            in: idsToDelete,
          },
        },
      });
    }
  });
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

function getDocumentPayload(record: PrismaEmployeeDocumentRecord) {
  return (record.documentPayload ?? {}) as Partial<EmployeeDocument>;
}

function mapPrismaEmployeeDocument(
  record: PrismaEmployeeDocumentRecord,
): EmployeeDocument {
  const payload = getDocumentPayload(record);
  const documentOwnerType =
    record.documentOwnerType ?? (record.employeeId ? "EMPLOYEE" : "APPLICANT");
  const ownerName =
    documentOwnerType === "EMPLOYEE"
      ? record.employee?.employeeName ?? payload.candidateName ?? ""
      : record.candidateName ?? payload.candidateName ?? "";
  const ownerCode =
    documentOwnerType === "EMPLOYEE"
      ? record.employee?.employeeCode ?? record.employeeCode ?? ""
      : payload.applicantCode ?? record.applicantId ?? payload.applicantId ?? "";

  return {
    ...payload,
    id: record.id,
    documentOwnerType,
    documentContext:
      payload.documentContext ??
      (documentOwnerType === "EMPLOYEE" ? "SELF_SERVICE" : "ONBOARDING"),
    applicantId: record.applicantId ?? payload.applicantId ?? "",
    applicantCode: payload.applicantCode ?? "",
    candidateName: record.candidateName ?? payload.candidateName ?? "",
    employeeId: record.employeeId ?? "",
    employeeCode: record.employee?.employeeCode ?? payload.employeeCode ?? record.employeeCode ?? "",
    employeeName: record.employee?.employeeName ?? payload.employeeName ?? "",
    aadhaarNumber: record.aadhaarNumber ?? payload.aadhaarNumber ?? "",
    aadhaarFileUrl: record.aadhaarFileUrl ?? payload.aadhaarFileUrl ?? "",
    panNumber: record.panNumber ?? payload.panNumber ?? "",
    panFileUrl: record.panFileUrl ?? payload.panFileUrl ?? "",
    educationEntries: Array.isArray(record.educationEntries)
      ? (record.educationEntries as EmployeeDocument["educationEntries"])
      : (payload.educationEntries ?? []),
    experienceType: record.experienceType ?? payload.experienceType ?? "FRESHER",
    experienceEntries: Array.isArray(record.experienceEntries)
      ? (record.experienceEntries as EmployeeDocument["experienceEntries"])
      : (payload.experienceEntries ?? []),
    reviewStatus: record.reviewStatus,
    reviewRemark: record.reviewRemark ?? "",
    reviewedAt: record.reviewedAt?.toISOString() ?? "",
    remark: record.remark ?? "",
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    applicantName: ownerName,
    ownerName,
    ownerCode,
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

async function getApplicantEmailForReview(record: EmployeeDocument) {
  const recruitmentRecord = (await getRecruitmentApplications()).find(
    (item) =>
      item.id === record.applicantId ||
      item.requestId === record.applicantCode ||
      item.serialNumber === record.applicantCode,
  );

  return recruitmentRecord?.email?.trim() || record.email?.trim() || "";
}

function buildApplicantDocumentReviewEmail(
  record: EmployeeDocument,
  reviewerName: string,
  overallStatus: string,
) {
  const reviewedFields = getUploadedReviewableDocumentFields(record);
  const completedFields = reviewedFields.filter(
    (field) => field.uploaded || field.status !== "PENDING_REVIEW",
  );
  const statusLabel = formatDocumentVerificationStatus(overallStatus);
  const subject =
    overallStatus === "APPROVED"
      ? `Your onboarding documents have been approved`
      : overallStatus === "REUPLOAD_REQUESTED"
        ? `Action required: re-upload your onboarding documents`
        : `Your onboarding documents review has been completed`;
  const actionMessage =
    overallStatus === "APPROVED"
      ? "Your documents are approved. Thank you for completing the review process."
      : overallStatus === "REUPLOAD_REQUESTED"
        ? "Please re-upload the requested documents from your applicant dashboard and resubmit the form."
        : "Some documents were not approved during review. Please read the remarks carefully.";

  const rows = completedFields
    .map(
      (field) => `
        <tr>
          <td style="padding:8px 0;color:#64748b">${field.label}</td>
          <td style="padding:8px 0;font-weight:600">${formatDocumentVerificationStatus(
            field.status,
          )}</td>
        </tr>
      `,
    )
    .join("");

  const text = [
    `Hello ${record.candidateName || "Applicant"},`,
    "",
    `Your onboarding document review has been completed.`,
    `Overall status: ${statusLabel}`,
    "",
    actionMessage,
    "",
    "Document statuses:",
    ...completedFields.map(
      (field) => `- ${field.label}: ${formatDocumentVerificationStatus(field.status)}`,
    ),
    "",
    `Reviewed by: ${reviewerName}`,
    record.reviewRemark ? `Review remark: ${record.reviewRemark}` : undefined,
    "",
    "Regards,",
    "HRMS Portal",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${record.candidateName || "Applicant"},</p>
      <p>Your onboarding document review has been completed.</p>
      <p><strong>Overall status:</strong> ${statusLabel}</p>
      <p>${actionMessage}</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;width:100%;max-width:640px">
        ${rows}
      </table>
      ${
        record.reviewRemark
          ? `<p><strong>Review remark:</strong> ${record.reviewRemark}</p>`
          : ""
      }
      <p><strong>Reviewed by:</strong> ${reviewerName}</p>
      <p>Regards,<br />HRMS Portal</p>
    </div>
  `;

  return { subject, text, html };
}

async function notifyApplicantDocumentReview(
  record: EmployeeDocument,
  reviewerName: string,
  overallStatus: string,
) {
  const applicantEmail = await getApplicantEmailForReview(record);

  if (!applicantEmail) {
    return;
  }

  const emailContent = buildApplicantDocumentReviewEmail(
    record,
    reviewerName,
    overallStatus,
  );

  await sendSystemEmail({
    to: applicantEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });
}

function normalizeEmployeeDocumentForPrisma(
  input: EmployeeDocument,
  employee: NonNullable<CurrentDocumentContext["currentEmployee"]>,
): Prisma.EmployeeDocumentUncheckedCreateInput {
  return {
    documentOwnerType: "EMPLOYEE" as const,
    applicantId: null,
    candidateName: null,
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
    .filter((record) => record.reviewStatus === "APPROVED")
    .map((record) => {
      const recruitmentRecord = recruitmentById.get(record.applicantId ?? "");

      return {
        id: record.id ?? "",
        applicantId: record.applicantId ?? "",
        requestId:
          recruitmentRecord?.requestId ||
          recruitmentRecord?.serialNumber ||
          record.applicantId ||
          "",
        candidateName: record.candidateName ?? "",
        mobileNumber: recruitmentRecord?.mobileNumber ?? "",
        email: recruitmentRecord?.email ?? "",
        gender: record.gender ?? "",
        dateOfBirth: record.dateOfBirth ?? "",
        address:
          record.currentAddress ||
          record.permanentAddress ||
          "",
        emergencyContactName: record.emergencyContactName ?? "",
        emergencyContactPhone: record.emergencyContactNumber ?? "",
        reviewStatus: record.reviewStatus ?? "PENDING",
        linkedEmployeeId: record.linkedEmployeeId ?? "",
      };
    })
    .filter((record) => !record.linkedEmployeeId)
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
  const client = params.tx ?? prisma;

  const applicantRecord = await client.employeeDocument.findFirst({
    where: {
      id: params.applicantDocumentId,
      documentOwnerType: "APPLICANT",
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

  if (!applicantRecord) {
    throw new Error("Applicant document not found");
  }

  const applicantDocument = mapPrismaEmployeeDocument(applicantRecord);

  if (
    applicantDocument.linkedEmployeeId &&
    applicantDocument.linkedEmployeeId !== params.employeeId
  ) {
    throw new Error("This applicant document is already connected to another employee");
  }

  await client.employeeDocument.create({
    data: {
      employeeId: params.employeeId,
      employeeCode: params.employeeCode,
      aadhaarNumber: applicantDocument.aadhaarNumber,
      aadhaarFileUrl: applicantDocument.aadhaarFileUrl || null,
      panNumber: applicantDocument.panNumber,
      panFileUrl: applicantDocument.panFileUrl || null,
      educationEntries:
        (applicantDocument.educationEntries ?? []) as Prisma.InputJsonValue,
      experienceType: applicantDocument.experienceType,
      experienceEntries:
        (applicantDocument.experienceEntries ?? []) as Prisma.InputJsonValue,
      reviewStatus:
        applicantDocument.reviewStatus === "APPROVED"
          ? DocumentReviewStatus.APPROVED
          : DocumentReviewStatus.PENDING,
      reviewRemark: applicantDocument.reviewRemark || null,
      reviewedAt: applicantDocument.reviewedAt
        ? new Date(applicantDocument.reviewedAt)
        : null,
      remark: applicantDocument.remark || null,
      status: applicantDocument.status,
    },
  });

  await client.employeeDocument.update({
    where: {
      id: params.applicantDocumentId,
    },
    data: {
      documentPayload: normalizeApplicantDocument({
        ...applicantDocument,
        linkedEmployeeId: params.employeeId,
        linkedEmployeeCode: params.employeeCode,
        linkedEmployeeName: params.employeeName,
      }) as Prisma.InputJsonValue,
    },
  });

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
        candidateName: context.currentApplicant.candidateName,
        applicantCode: context.currentApplicant.applicantCode,
      });
      const records = await readApplicantDocumentData();
      const existing = records.find(
        (item) =>
          item.applicantId === context.currentApplicant.id ||
          item.sourceInterviewApplicantId === record.sourceInterviewApplicantId,
      );

      if (existing) {
        return {
          success: false,
          message: "Applicant document already exists.",
        };
      }

      records.push(normalizeApplicantDocument(record));
      await writeApplicantDocumentData(records);
      await markApplicantDocumentsSubmitted(context.currentApplicant.id);

      revalidatePath("/applicant-dashboard");
      revalidatePath("/applicant-dashboard/documents");
      revalidatePath("/employee-documents");
      revalidatePath("/recruitment");

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
    const existing = records.find(
      (item) =>
        item.applicantId === record.applicantId?.trim() ||
        item.sourceInterviewApplicantId === record.sourceInterviewApplicantId,
    );

    if (existing) {
      return {
        success: false,
        message: "Applicant document already exists.",
      };
    }

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
        candidateName: context.currentApplicant.candidateName,
        applicantCode: context.currentApplicant.applicantCode,
      });
      const records = await readApplicantDocumentData();
      const index = records.findIndex(
        (item) => item.id === id && item.applicantId === context.currentApplicant.id,
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
      revalidatePath("/applicant-dashboard/documents");
      revalidatePath("/employee-documents");
      revalidatePath("/recruitment");

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
  input: {
    reviewRemark?: string;
    statusUpdates?: Partial<Record<string, DocumentVerificationStatus>>;
  },
): Promise<ActionResponse> {
  try {
    const context = await getCurrentDocumentContext();

    if (!context.isHrEmployee) {
      return {
        success: false,
        message: "Only HR can review applicant documents",
      };
    }

    const session = await auth();
    const reviewerName =
      session?.user?.name ||
      session?.user?.firstName ||
      session?.user?.username ||
      "HR Reviewer";

    const records = await readApplicantDocumentData();
    const record = records
      .map(mapApplicantDocument)
      .find((item) => item.id === id);

    if (!record) {
      return {
        success: false,
        message: "Applicant document not found",
      };
    }

    const index = records.findIndex((item) => item.id === id);
    const statusByKey = new Map(
      REVIEWABLE_DOCUMENT_FIELDS.map((field) => [field.statusKey, field]),
    );
    const updatedRecord: EmployeeDocument = {
      ...record,
    };

    for (const [statusKey, rawStatus] of Object.entries(
      input.statusUpdates ?? {},
    )) {
      if (!statusByKey.has(statusKey)) {
        continue;
      }

      if (
        !rawStatus ||
        !DOCUMENT_VERIFICATION_STATUSES.includes(
          rawStatus as DocumentVerificationStatus,
        )
      ) {
        return {
          success: false,
          message: `Invalid status for ${statusKey}`,
        };
      }

      (updatedRecord as Record<string, unknown>)[statusKey] =
        rawStatus as DocumentVerificationStatus;
    }

    const reviewedFields = getUploadedReviewableDocumentFields(updatedRecord).filter(
      (field) => field.uploaded || field.status !== "PENDING_REVIEW",
    );

    if (!reviewedFields.length) {
      return {
        success: false,
        message: "Please review at least one uploaded document",
      };
    }

    const pendingFields = reviewedFields.filter(
      (field) => field.status === "PENDING_REVIEW",
    );

    if (pendingFields.length) {
      return {
        success: false,
        message:
          "Please set a final status for every uploaded document before submitting the review",
      };
    }

    const overallStatus = getNextDocumentOverallStatus(
      reviewedFields.map((field) => field.status),
    );
    const reviewRemark = input.reviewRemark?.trim() || "";
    const reviewedAt = new Date().toISOString();

    records[index] = normalizeApplicantDocument({
      ...updatedRecord,
      reviewStatus: overallStatus,
      reviewRemark,
      reviewedByName: reviewerName,
      reviewedAt,
    });
    await writeApplicantDocumentData(records);

    let emailSent = true;
    try {
      await notifyApplicantDocumentReview(
        records[index],
        reviewerName,
        overallStatus,
      );
    } catch {
      emailSent = false;
      // Keep the review saved even if notification delivery fails.
    }

    revalidatePath("/employee-documents");
    revalidatePath("/applicant-dashboard/documents");
    revalidatePath("/recruitment");

    return {
      success: true,
      message:
        overallStatus === "APPROVED"
          ? emailSent
            ? "Document approved and applicant notified"
            : "Document approved, but the applicant email could not be sent"
          : overallStatus === "REUPLOAD_REQUESTED"
            ? emailSent
              ? "Reupload requested and applicant notified"
              : "Reupload requested, but the applicant email could not be sent"
            : emailSent
              ? "Document rejected and applicant notified"
              : "Document rejected, but the applicant email could not be sent",
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

    if (nextRecords.length !== records.length) {
      await writeApplicantDocumentData(nextRecords);
    }
    revalidatePath("/employee-documents");
    revalidatePath("/applicant-dashboard/documents");
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
