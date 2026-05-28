import Link from "next/link";
import { redirect } from "next/navigation";

import RecruitmentIntakeDataTable from "./recruitment-intake-data-table";
import { Button } from "@/components/ui/button";
import { getRecruitmentIntakes } from "@/lib/actions/recruitment-intake";
import { canAccess, getRoutePermissions } from "@/lib/rbac";

const RecruitmentIntakePage = async () => {
  const route = "/recruitment-intake";
  const permissions = await getRoutePermissions(route);
  const canCreate = await canAccess(route, "create");

  if (!permissions.canView) {
    redirect("/404");
  }

  const records = await getRecruitmentIntakes();

  return (
    <RecruitmentIntakeDataTable
      data={records}
      canEdit={permissions.canEdit}
      canDelete={permissions.canDelete}
      title="Recruitment"
      actions={
        canCreate && (
          <Button asChild className="bg-blue-500 hover:bg-blue-600">
            <Link href="/recruitment-intake/create">Add Recruitment</Link>
          </Button>
        )
      }
    />
  );
};

export default RecruitmentIntakePage;
