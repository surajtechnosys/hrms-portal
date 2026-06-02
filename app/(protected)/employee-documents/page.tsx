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
  if (!isHrEmployee) {
    redirect("/404");
  }

  const permissions = routePermissions;

  if (!permissions.canView) {
    redirect("/404");
  }

  const records = await getEmployeeDocuments();

  return (
    <EmployeeDocumentDataTable
      key={records.map((record) => `${record.id}:${record.updatedAt}`).join("|")}
      data={records}
      canEdit={permissions.canEdit}
      canDelete={permissions.canDelete}
      canReview={true}
      title="Employee Documents"
      actions={
        permissions.canCreate && (
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Link href="/employee-documents/create">
              Add Applicant Document
            </Link>
          </Button>
        )
      }
    />
  );
};

export default EmployeeDocumentPage;
