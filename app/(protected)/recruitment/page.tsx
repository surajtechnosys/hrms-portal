import Link from "next/link";
import { redirect } from "next/navigation";

import RecruitmentDataTable from "./recruitment-data-table";
import { getRecruitmentApplications } from "@/lib/actions/recruitment";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { canAccess } from "@/lib/rbac";
import { getRoutePermissions } from "@/lib/rbac";

const RecruitmentPage = async () => {
  const route = "/recruitment";
  const [routePermissions, isHrEmployee] = await Promise.all([
    getRoutePermissions(route),
    isCurrentEmployeeHr(),
  ]);
  const canCreateEmployeeProfile = await canAccess("/employee-profiles", "create");

  const permissions = isHrEmployee
    ? {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
      }
    : routePermissions;

  if (!permissions.canView) {
    redirect("/404");
  }

  const records = await getRecruitmentApplications();

  return (
    <RecruitmentDataTable
      data={records}
      canEdit={permissions.canEdit}
      canDelete={permissions.canDelete}
      canCreateEmployeeProfile={canCreateEmployeeProfile || isHrEmployee}
      canInviteApplicants={permissions.canCreate || permissions.canEdit}
      title="Pre-Onboarding"
      actions={
        permissions.canCreate && (
          <Link
            href="/recruitment/create"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-500 px-4 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            Create Pre-Onboarding
          </Link>
        )
      }
    />
  );
};

export default RecruitmentPage;
