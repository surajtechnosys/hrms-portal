import { EMPLOYMENT_REVIEW_ACTIONS } from "@/lib/employee-employment";

type EmploymentNotificationAction =
  (typeof EMPLOYMENT_REVIEW_ACTIONS)[keyof typeof EMPLOYMENT_REVIEW_ACTIONS];

export type EmploymentNotificationSummary = {
  id: string;
  action: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
};

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString("en-GB") : "";
}

export function getEmploymentNotificationPayload(params: {
  action: EmploymentNotificationAction;
  oldEndDate: Date | null;
  newEndDate: Date | null;
}) {
  if (params.action === EMPLOYMENT_REVIEW_ACTIONS.CONVERT_TO_EMPLOYEE) {
    return {
      title: "Employment Status Updated",
      message: "Congratulations. You have been converted to a permanent employee.",
    };
  }

  if (params.action === EMPLOYMENT_REVIEW_ACTIONS.EXTEND_PROBATION) {
    return {
      title: "Probation Extended",
      message: `Your probation period has been extended from ${formatDate(params.oldEndDate)} to ${formatDate(params.newEndDate)}.`,
    };
  }

  return {
    title: "Training Extended",
    message: `Your training period has been extended from ${formatDate(params.oldEndDate)} to ${formatDate(params.newEndDate)}.`,
  };
}

