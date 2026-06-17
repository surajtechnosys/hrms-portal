import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDepartments } from "@/lib/actions/department";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { getRoutePermissions } from "@/lib/rbac";
import { redirect } from "next/navigation";
import DepartmentDataTable from "./department-datatable";

export default async function DepartmentPage() {
  const route = "/department";
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

  const departments = await getDepartments();

  return (
    <DepartmentDataTable
      data={departments}
      canEdit={permissions.canEdit}
      canDelete={permissions.canDelete}
      title="Department"
      actions={
        permissions.canCreate && (
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Link href="/department/create">Add Department</Link>
          </Button>
        )
      }
    />
  );
}
