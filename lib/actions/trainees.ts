"use server";

import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { Trainee } from "@/types";
import { sanitizeStoredFileUrl } from "../document-uploads";
import { buildTraineeDocumentUrls } from "../trainee-documents";
import { prisma } from "../prisma";
import { formatError } from "../utils";
import { traineeSchema } from "../validators";

type ActionResponse = {
  success: boolean;
  message: string;
  data?: Trainee;
};

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function toTraineeCode(index: number) {
  return `TRN-${String(index).padStart(3, "0")}`;
}

type TraineeRecord = {
  id: string;
  applicantId: string | null;
  applicantDocumentId: string | null;
  traineeCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  gender: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  educationEntries: Prisma.JsonValue | null;
  experienceEntries: Prisma.JsonValue | null;
  uploadedDocumentUrls: Prisma.JsonValue | null;
  onboardingPayload: Prisma.JsonValue | null;
  trainingBatch: string | null;
  trainerName: string | null;
  departmentId: string | null;
  reportingManagerId: string | null;
  trainingStartDate: Date | null;
  trainingEndDate: Date | null;
  traineeStatus: string | null;
  trainingProgress: number | null;
  attendancePercentage: number | null;
  assessmentScore: number | null;
  evaluationRecommendation: string | null;
  evaluationRemarks: string | null;
  loginPassword: string | null;
  employeeId: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  convertedAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

async function generateTraineeCode() {
  const records = await prisma.trainee.findMany({
    select: {
      traineeCode: true,
    },
  });

  const nextNumber =
    records.reduce((max, record) => {
      const match = /^TRN-(\d+)$/i.exec(record.traineeCode);
      const number = match ? Number(match[1]) : 0;
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0) + 1;

  return toTraineeCode(nextNumber);
}

export async function getNextTraineeCodePreview() {
  try {
    return await generateTraineeCode();
  } catch {
    return "TRN-001";
  }
}

function mapTrainee(record: TraineeRecord): Trainee {
  const onboardingPayload = (record.onboardingPayload ??
    {}) as Partial<Trainee>;

  return {
    id: record.id,
    applicantId: record.applicantId ?? "",
    applicantDocumentId: record.applicantDocumentId ?? "",
    sourceApplicantDocumentId: record.applicantDocumentId ?? "",
    traineeCode: record.traineeCode,
    fullName: record.fullName,
    email: record.email,
    mobileNumber: record.mobileNumber,
    gender: record.gender ?? "",
    dateOfBirth: record.dateOfBirth?.toISOString().split("T")[0] ?? "",
    address: record.address ?? "",
    currentAddress: record.currentAddress ?? "",
    permanentAddress: record.permanentAddress ?? "",
    city: record.city ?? "",
    state: record.state ?? "",
    postalCode: record.postalCode ?? "",
    emergencyContactName: record.emergencyContactName ?? "",
    emergencyContactPhone: record.emergencyContactPhone ?? "",
    educationEntries: (record.educationEntries ??
      []) as Trainee["educationEntries"],
    experienceEntries: (record.experienceEntries ??
      []) as Trainee["experienceEntries"],
    uploadedDocumentUrls: (record.uploadedDocumentUrls ??
      []) as Trainee["uploadedDocumentUrls"],
    onboardingPayload,
    trainingBatch: record.trainingBatch ?? "",
    trainerName: record.trainerName ?? "",
    departmentId: record.departmentId ?? "",
    reportingManagerId: record.reportingManagerId ?? "",
    trainingStartDate:
      record.trainingStartDate?.toISOString().split("T")[0] ?? "",
    trainingEndDate: record.trainingEndDate?.toISOString().split("T")[0] ?? "",
    traineeStatus: (record.traineeStatus ??
      "PENDING") as Trainee["traineeStatus"],
    trainingProgress: record.trainingProgress ?? 0,
    attendancePercentage: record.attendancePercentage ?? 0,
    assessmentScore: record.assessmentScore ?? 0,
    evaluationRecommendation: (record.evaluationRecommendation ??
      "") as Trainee["evaluationRecommendation"],
    evaluationRemarks: record.evaluationRemarks ?? "",
    password: record.loginPassword ? "__KEEP__" : "",
    employeeId: record.employeeId ?? "",
    employeeCode: record.employeeCode ?? "",
    employeeName: record.employeeName ?? "",
    linkedEmployeeId: record.employeeId ?? "",
    linkedEmployeeCode: record.employeeCode ?? "",
    linkedEmployeeName: record.employeeName ?? "",
    status: record.status as Trainee["status"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    departmentName: "",
    reportingManagerName: "",
  };
}

async function readTraineeById(id: string) {
  const record = await prisma.trainee.findFirst({
    where: { id },
  });

  return record ? mapTrainee(record) : null;
}

export async function getTraineeById(id: string) {
  try {
    return await readTraineeById(id);
  } catch {
    return null;
  }
}

export async function getTraineeByApplicantDocumentId(
  applicantDocumentId: string,
) {
  try {
    const record = await prisma.trainee.findFirst({
      where: { applicantDocumentId },
    });

    return record ? mapTrainee(record) : null;
  } catch {
    return null;
  }
}

export async function getTrainees(): Promise<Trainee[]> {
  try {
    const records = await prisma.trainee.findMany({
      orderBy: { createdAt: "desc" },
    });

    return records.map(mapTrainee);
  } catch {
    return [];
  }
}

function buildOnboardingPayload(trainee: Trainee) {
  return {
    ...trainee,
    password: "",
  } as Prisma.InputJsonValue;
}

export async function createTraineeProfile(
  data: Trainee,
): Promise<ActionResponse> {
  try {
    const record = traineeSchema.parse(data);

    const traineeCode = await generateTraineeCode();

    const applicantDocument = record.applicantDocumentId
      ? await prisma.applicantDocument.findFirst({
          where: {
            id: record.applicantDocumentId,
            documentOwnerType: "APPLICANT",
          },
          select: {
            id: true,
            traineeId: true,
            documentPayload: true,
            aadhaarFileUrl: true,
            panFileUrl: true,
          },
        })
      : null;

    if (applicantDocument?.traineeId && applicantDocument.traineeId !== "") {
      return {
        success: false,
        message: "This applicant document is already linked to a trainee.",
      };
    }

    const hashedPassword =
      record.password && record.password !== "__KEEP__"
        ? await bcrypt.hash(record.password, 10)
        : null;

    const trainee = await prisma.trainee.create({
      data: {
        traineeCode,
        applicantId: record.applicantId || null,
        applicantDocumentId: record.applicantDocumentId || null,
        fullName: record.fullName.trim(),
        email: record.email.trim(),
        mobileNumber: record.mobileNumber.trim(),
        gender: record.gender || null,
        dateOfBirth: toDate(record.dateOfBirth),
        address: record.address || null,
        currentAddress: record.currentAddress || null,
        permanentAddress: record.permanentAddress || null,
        city: record.city || null,
        state: record.state || null,
        postalCode: record.postalCode || null,
        emergencyContactName: record.emergencyContactName || null,
        emergencyContactPhone: record.emergencyContactPhone || null,
        educationEntries: (record.educationEntries ??
          []) as Prisma.InputJsonValue,
        experienceEntries: (record.experienceEntries ??
          []) as Prisma.InputJsonValue,
        uploadedDocumentUrls: (
          applicantDocument
            ? buildTraineeDocumentUrls(
                ({
                  ...(applicantDocument.documentPayload as Record<string, unknown>),
                  ...applicantDocument,
                } as unknown),
              )
            : (record.uploadedDocumentUrls ?? [])
                .map((url) => sanitizeStoredFileUrl(url))
                .filter(Boolean)
        ) as Prisma.InputJsonValue,
        onboardingPayload: buildOnboardingPayload(record),
        trainingBatch: record.trainingBatch || null,
        trainerName: record.trainerName || null,
        departmentId: record.departmentId || null,
        reportingManagerId: record.reportingManagerId || null,
        trainingStartDate: toDate(record.trainingStartDate),
        trainingEndDate: toDate(record.trainingEndDate),
        traineeStatus: record.traineeStatus ?? "PENDING",
        trainingProgress: record.trainingProgress ?? 0,
        attendancePercentage: record.attendancePercentage ?? null,
        assessmentScore: record.assessmentScore ?? null,
        evaluationRecommendation: record.evaluationRecommendation || null,
        evaluationRemarks: record.evaluationRemarks || null,
        loginPassword: hashedPassword,
        status: record.status,
      },
    });

    if (record.applicantDocumentId) {
      const currentPayload =
        (applicantDocument?.documentPayload as Record<
          string,
          unknown
        > | null) ?? {};

      await prisma.applicantDocument.update({
        where: {
          id: record.applicantDocumentId,
        },
        data: {
          traineeId: trainee.id,
          documentPayload: {
            ...currentPayload,
            traineeId: trainee.id,
            traineeCode,
            linkedTraineeId: trainee.id,
            linkedTraineeCode: traineeCode,
            linkedTraineeName: trainee.fullName,
          } as Prisma.InputJsonValue,
        },
      });
    }

    revalidatePath("/employee-documents");
    revalidatePath("/trainees");
    revalidatePath("/trainee-dashboard");

    return {
      success: true,
      message: "Trainee created successfully",
    };
  } catch (error) {
    console.error("CREATE TRAINEE ERROR");
    console.error(error);

    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function attachTraineeToEmployeeProfile(params: {
  traineeId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;

  const trainee = await client.trainee.findFirst({
    where: { id: params.traineeId },
  });

  if (!trainee) {
    throw new Error("Trainee not found");
  }

  if (trainee.employeeId && trainee.employeeId !== params.employeeId) {
    throw new Error("This trainee is already connected to another employee");
  }

  await client.trainee.update({
    where: { id: params.traineeId },
    data: {
      employeeId: params.employeeId,
      employeeCode: params.employeeCode,
      employeeName: params.employeeName,
      traineeStatus: "COMPLETED",
      convertedAt: new Date(),
    },
  });

  if (trainee.applicantDocumentId) {
    const currentPayload =
      (trainee.onboardingPayload as Record<string, unknown> | null) ?? {};

    await client.applicantDocument.update({
      where: { id: trainee.applicantDocumentId },
      data: {
        traineeId: params.traineeId,
        employeeId: params.employeeId,
        employeeCode: params.employeeCode,
        documentPayload: {
          ...currentPayload,
          traineeId: params.traineeId,
          linkedTraineeId: params.traineeId,
          linkedTraineeCode: trainee.traineeCode,
          linkedTraineeName: trainee.fullName,
          linkedEmployeeId: params.employeeId,
          linkedEmployeeCode: params.employeeCode,
          linkedEmployeeName: params.employeeName,
        } as Prisma.InputJsonValue,
      },
    });
  }

  revalidatePath("/employee-profiles");
  revalidatePath("/trainees");
  revalidatePath("/trainee-dashboard");
  revalidatePath("/employee-documents");
}
