import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getEmployeeDocuments } from "@/lib/actions/employee-documents";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { getRoutePermissions } from "@/lib/rbac";
import Link from "next/link";
import { redirect } from "next/navigation";
import EmployeeDocumentDataTable from "./employee-document-data-table";

const EmployeeDocumentPage = async () => {
  const route = "/employee-documents";
  const [routePermissions, isHrEmployee] = await Promise.all([
    getRoutePermissions(route),
    isCurrentEmployeeHr(),
  ]);
  const session = await auth();
  const isSelfServiceEmployee =
    session?.user?.role?.toLowerCase() === "employee" && !isHrEmployee;
  const permissions = isHrEmployee
    ? {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
      }
    : isSelfServiceEmployee
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

  const records = await getEmployeeDocuments();

  return (
    <EmployeeDocumentDataTable
      data={records}
      canEdit={permissions.canEdit}
      canDelete={permissions.canDelete}
      canReview={isHrEmployee}
      title={isSelfServiceEmployee ? "My Documents" : "Employee Documents"}
      actions={
        permissions.canCreate && (
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Link href="/employee-documents/create">
              {isSelfServiceEmployee ? "Add My Document" : "Add Applicant Document"}
            </Link>
          </Button>
        )
      }
    />
  );
};

export default EmployeeDocumentPage;
