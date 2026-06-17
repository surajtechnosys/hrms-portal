import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getJobRoles } from "@/lib/actions/job-role";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { getRoutePermissions } from "@/lib/rbac";
import JobRoleDataTable from "./job-role-data-table";

export default async function JobRolePage() {
  const route = "/job-roles";
  const [routePermissions, isHrEmployee] = await Promise.all([
    getRoutePermissions(route),
    isCurrentEmployeeHr(),
  ]);
  const permissions = isHrEmployee
    ? {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      }
    : routePermissions;

  if (!permissions.canView) {
    redirect("/404");
  }

  const jobRoles = await getJobRoles();

  return (
    <JobRoleDataTable
      data={jobRoles}
      canEdit={permissions.canEdit}
      canDelete={permissions.canDelete}
      title="Job Roles"
      actions={
        permissions.canCreate && (
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Link href="/job-roles/create">Add Job Role</Link>
          </Button>
        )
      }
    />
  );
}
