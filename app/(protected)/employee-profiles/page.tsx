import { Button } from "@/components/ui/button";
import { getEmployeeProfiles } from "@/lib/actions/employee-profiles";
import { getEmployeeProfileOptions } from "@/lib/actions/employee-profiles";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { getRoutePermissions } from "@/lib/rbac";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardDesignContent from "../dashboard-design/content";

const EmployeeProfilePage = async () => {
  const route = "/employee-profiles";
  const [routePermissions, isHrEmployee] = await Promise.all([
    getRoutePermissions(route),
    isCurrentEmployeeHr(),
  ]);
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

  const [employees, options] = await Promise.all([
    getEmployeeProfiles(),
    getEmployeeProfileOptions(),
  ]);

  return (
    <DashboardDesignContent
      initialEmployees={employees}
      companies={options.companies}
      departments={options.departments}
      jobRoles={options.jobRoles}
      workLocations={options.workLocations}
      projects={options.projects}
      eyebrow="Employee Search"
      title="Employee Profiles"
      description="Search, filter, and open employee profiles from a single directory view."
      actions={permissions.canCreate ? (
        <Button
          asChild
          className="rounded-2xl bg-cyan-700 px-5 text-white shadow-sm hover:bg-cyan-800"
        >
          <Link href="/employee-profiles/create">Add Employee Profile</Link>
        </Button>
      ) : undefined}
    />
  );
};

export default EmployeeProfilePage;
