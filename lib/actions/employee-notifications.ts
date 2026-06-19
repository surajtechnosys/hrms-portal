"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionResponse = {
  success: boolean;
  message: string;
};

async function getCurrentEmployeeId() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const employeeProfile = await prisma.employeeProfile.findFirst({
    where: { email: session.user.email },
    select: {
      id: true,
    },
  });

  if (!employeeProfile) {
    throw new Error("Employee profile not found");
  }

  return employeeProfile.id;
}

export async function markEmploymentNotificationAsRead(
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const notificationId = formData.get("notificationId");
    if (typeof notificationId !== "string" || !notificationId.trim()) {
      return {
        success: false,
        message: "Notification is required",
      };
    }

    const employeeId = await getCurrentEmployeeId();
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        employeeId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        message: "Notification not found",
      };
    }

    revalidatePath("/employee-dashboard");

    return {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update notification",
    };
  }
}
