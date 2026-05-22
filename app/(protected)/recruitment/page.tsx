import Link from "next/link";
import { redirect } from "next/navigation";

import RecruitmentDataTable from "./recruitment-data-table";
import { Button } from "@/components/ui/button";
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
      title="Recruitment"
      actions={
        permissions.canCreate && (
          <Button asChild className="bg-blue-500 hover:bg-blue-600">
            <Link href="/recruitment/create">Add Applicant</Link>
          </Button>
        )
      }
    />
  );
};

export default RecruitmentPage;
