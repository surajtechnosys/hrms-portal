"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EmployeeType, Prisma } from "@prisma/client";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { getEmploymentNotificationPayload } from "@/lib/employee-notifications";
import {
  EMPLOYMENT_REVIEW_ACTIONS,
  getEmploymentReviewActionLabel,
  getEmploymentTrackingState,
  mapEmploymentReviewTimelineItem,
  type EmploymentReviewAction,
  type EmploymentReviewTimelineItem,
} from "@/lib/employee-employment";

type ActionResponse = {
  success: boolean;
  message: string;
};

type EmployeeEmploymentSnapshot = {
  id: string;
  employeeName: string;
  employeeCode: string;
  employeeType: EmployeeType;
  probationStartDate: Date | null;
  probationEndDate: Date | null;
  trainingStartDate: Date | null;
  trainingEndDate: Date | null;
};

const employmentSelect = {
  id: true,
  employeeName: true,
  employeeCode: true,
  employeeType: true,
  probationStartDate: true,
  probationEndDate: true,
  trainingStartDate: true,
  trainingEndDate: true,
} as const;

function getEmployeeDetailPath(employeeCode: string) {
  return `/employee-profiles/${employeeCode}`;
}

function parseDateInput(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid`);
  }

  return parsed;
}

function parseOptionalRemarks(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function assertEmploymentReviewAccess() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  if (!(await isCurrentEmployeeHr())) {
    throw new Error("You do not have permission to update employment status");
  }

  return session;
}

async function getEmployeeEmploymentSnapshot(
  employeeId: string,
): Promise<EmployeeEmploymentSnapshot | null> {
  return prisma.employeeProfile.findUnique({
    where: { id: employeeId },
    select: employmentSelect,
  });
}

async function createEmploymentReview(params: {
  tx: Prisma.TransactionClient;
  employeeId: string;
  action: string;
  oldEmployeeType: EmployeeType;
  newEmployeeType: EmployeeType;
  oldEndDate: Date | null;
  newEndDate: Date | null;
  remarks: string;
  reviewedByUserId: string;
  reviewedByName: string;
}) {
  return params.tx.employmentReview.create({
    data: {
      employeeId: params.employeeId,
      action: params.action,
      oldEmployeeType: params.oldEmployeeType,
      newEmployeeType: params.newEmployeeType,
      oldEndDate: params.oldEndDate,
      newEndDate: params.newEndDate,
      remarks: params.remarks || null,
      reviewedByUserId: params.reviewedByUserId,
      reviewedByName: params.reviewedByName,
    },
  });
}

async function createEmploymentNotification(params: {
  tx: Prisma.TransactionClient;
  employeeId: string;
  employmentReviewId: string;
  action: EmploymentReviewAction;
  oldEndDate: Date | null;
  newEndDate: Date | null;
}) {
  const payload = getEmploymentNotificationPayload({
    action: params.action,
    oldEndDate: params.oldEndDate,
    newEndDate: params.newEndDate,
  });

  await params.tx.notification.create({
    data: {
      employeeId: params.employeeId,
      employmentReviewId: params.employmentReviewId,
      action: params.action,
      title: payload.title,
      message: payload.message,
    },
  });
}

function getReviewerName(session: Awaited<ReturnType<typeof auth>>) {
  return (
    session?.user?.name?.trim() ||
    [session?.user?.firstName, session?.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    session?.user?.email ||
    "Unknown"
  );
}

function buildReviewRemark(defaultRemark: string, customRemark: string) {
  return customRemark || defaultRemark;
}

export async function getEmploymentReviewsForEmployee(
  employeeId: string,
): Promise<EmploymentReviewTimelineItem[]> {
  const reviews = await prisma.employmentReview.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map(mapEmploymentReviewTimelineItem);
}

export async function convertEmployeeToPermanent(
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const session = await assertEmploymentReviewAccess();
    const employeeId = formData.get("employeeId");

    if (typeof employeeId !== "string" || !employeeId.trim()) {
      return {
        success: false,
        message: "Employee is required",
      };
    }

    const employee = await getEmployeeEmploymentSnapshot(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee profile not found",
      };
    }

    const tracking = getEmploymentTrackingState(employee);
    if (!tracking.kind) {
      return {
        success: false,
        message: "Only probationers or trainees can be converted",
      };
    }

    const reviewerName = getReviewerName(session);
    const remarks = buildReviewRemark(
      `Converted to employee from ${tracking.periodLabel.toLowerCase()}`,
      parseOptionalRemarks(formData.get("remarks")),
    );

    await prisma.$transaction(async (tx) => {
      await tx.employeeProfile.update({
        where: { id: employee.id },
        data: {
          employeeType: EmployeeType.EMPLOYEE,
          probationStartDate: null,
          probationEndDate: null,
          trainingStartDate: null,
          trainingEndDate: null,
        },
      });

      const review = await createEmploymentReview({
        tx,
        employeeId: employee.id,
        action: EMPLOYMENT_REVIEW_ACTIONS.CONVERT_TO_EMPLOYEE,
        oldEmployeeType: employee.employeeType,
        newEmployeeType: EmployeeType.EMPLOYEE,
        oldEndDate: tracking.endDate,
        newEndDate: null,
        remarks,
        reviewedByUserId: session.user.id,
        reviewedByName: reviewerName,
      });

      await createEmploymentNotification({
        tx,
        employeeId: employee.id,
        employmentReviewId: review.id,
        action: EMPLOYMENT_REVIEW_ACTIONS.CONVERT_TO_EMPLOYEE,
        oldEndDate: tracking.endDate,
        newEndDate: null,
      });
    });

    revalidatePath("/employee-profiles");
    revalidatePath("/employee-dashboard");
    revalidatePath(getEmployeeDetailPath(employee.employeeCode));

    return {
      success: true,
      message: getEmploymentReviewActionLabel(
        EMPLOYMENT_REVIEW_ACTIONS.CONVERT_TO_EMPLOYEE,
      ),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to convert employee",
    };
  }
}

export async function extendProbation(
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const session = await assertEmploymentReviewAccess();
    const employeeId = formData.get("employeeId");

    if (typeof employeeId !== "string" || !employeeId.trim()) {
      return {
        success: false,
        message: "Employee is required",
      };
    }

    const employee = await getEmployeeEmploymentSnapshot(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee profile not found",
      };
    }

    const tracking = getEmploymentTrackingState(employee);
    if (tracking.kind !== "PROBATION" || !tracking.endDate) {
      return {
        success: false,
        message: "Probation period is not active",
      };
    }

    const newEndDate = parseDateInput(formData.get("newEndDate"), "New end date");
    if (tracking.endDate && newEndDate <= tracking.endDate) {
      return {
        success: false,
        message: "New end date must be after the current probation end date",
      };
    }

    const reviewerName = getReviewerName(session);
    const remarks = buildReviewRemark(
      `Probation extended to ${newEndDate.toLocaleDateString("en-GB")}`,
      parseOptionalRemarks(formData.get("remarks")),
    );

    await prisma.$transaction(async (tx) => {
      await tx.employeeProfile.update({
        where: { id: employee.id },
        data: {
          probationEndDate: newEndDate,
        },
      });

      const review = await createEmploymentReview({
        tx,
        employeeId: employee.id,
        action: EMPLOYMENT_REVIEW_ACTIONS.EXTEND_PROBATION,
        oldEmployeeType: employee.employeeType,
        newEmployeeType: employee.employeeType,
        oldEndDate: tracking.endDate,
        newEndDate,
        remarks,
        reviewedByUserId: session.user.id,
        reviewedByName: reviewerName,
      });

      await createEmploymentNotification({
        tx,
        employeeId: employee.id,
        employmentReviewId: review.id,
        action: EMPLOYMENT_REVIEW_ACTIONS.EXTEND_PROBATION,
        oldEndDate: tracking.endDate,
        newEndDate,
      });
    });

    revalidatePath("/employee-profiles");
    revalidatePath("/employee-dashboard");
    revalidatePath(getEmployeeDetailPath(employee.employeeCode));

    return {
      success: true,
      message: "Probation extended successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to extend probation",
    };
  }
}

export async function extendTraining(
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const session = await assertEmploymentReviewAccess();
    const employeeId = formData.get("employeeId");

    if (typeof employeeId !== "string" || !employeeId.trim()) {
      return {
        success: false,
        message: "Employee is required",
      };
    }

    const employee = await getEmployeeEmploymentSnapshot(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee profile not found",
      };
    }

    const tracking = getEmploymentTrackingState(employee);
    if (tracking.kind !== "TRAINING" || !tracking.endDate) {
      return {
        success: false,
        message: "Training period is not active",
      };
    }

    const newEndDate = parseDateInput(formData.get("newEndDate"), "New end date");
    if (tracking.endDate && newEndDate <= tracking.endDate) {
      return {
        success: false,
        message: "New end date must be after the current training end date",
      };
    }

    const reviewerName = getReviewerName(session);
    const remarks = buildReviewRemark(
      `Training extended to ${newEndDate.toLocaleDateString("en-GB")}`,
      parseOptionalRemarks(formData.get("remarks")),
    );

    await prisma.$transaction(async (tx) => {
      await tx.employeeProfile.update({
        where: { id: employee.id },
        data: {
          trainingEndDate: newEndDate,
        },
      });

      const review = await createEmploymentReview({
        tx,
        employeeId: employee.id,
        action: EMPLOYMENT_REVIEW_ACTIONS.EXTEND_TRAINING,
        oldEmployeeType: employee.employeeType,
        newEmployeeType: employee.employeeType,
        oldEndDate: tracking.endDate,
        newEndDate,
        remarks,
        reviewedByUserId: session.user.id,
        reviewedByName: reviewerName,
      });

      await createEmploymentNotification({
        tx,
        employeeId: employee.id,
        employmentReviewId: review.id,
        action: EMPLOYMENT_REVIEW_ACTIONS.EXTEND_TRAINING,
        oldEndDate: tracking.endDate,
        newEndDate,
      });
    });

    revalidatePath("/employee-profiles");
    revalidatePath("/employee-dashboard");
    revalidatePath(getEmployeeDetailPath(employee.employeeCode));

    return {
      success: true,
      message: "Training extended successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to extend training",
    };
  }
}
