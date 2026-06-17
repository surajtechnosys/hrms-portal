import { auth } from "@/auth";
import { prisma } from "./prisma";

export function isHrJobRoleName(jobRoleName?: string | null) {
  return !!jobRoleName?.toLowerCase().includes("hr");
}

export function isManagerJobRoleName(jobRoleName?: string | null) {
  return !!jobRoleName?.toLowerCase().includes("manager");
}

export async function getCurrentEmployeeProfileForPortal() {
  const session = await auth();

  if (
    session?.user?.role?.toLowerCase() !== "employee" ||
    !session.user.email
  ) {
    return null;
  }

  return prisma.employeeProfile.findFirst({
    where: {
      email: session.user.email,
      status: "ACTIVE",
    },
    include: {
      jobRole: {
        select: {
          name: true,
        },
      },
    },
  });
}
export async function isCurrentEmployeeHr() {
  const session = await auth();

  if (session?.user?.role?.toLowerCase() === "admin") {
    return true;
  }

  const employee = await getCurrentEmployeeProfileForPortal();

  return isHrJobRoleName(employee?.jobRole?.name);
}

export async function isCurrentEmployeeManager() {
  const employee = await getCurrentEmployeeProfileForPortal();

  if (!employee) {
    return false;
  }

  const directReports = await prisma.employeeProfile.count({
    where: {
      managerId: employee.id,
      status: "ACTIVE",
    },
  });

  return directReports > 0 || isManagerJobRoleName(employee.jobRole?.name);
}
