import EmployeeProfileForm from "@/components/employee-profiles/employee-profile-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canAccess } from "@/lib/rbac";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";

const EmployeeProfileCreatePage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ recruitmentId?: string | string[] }>;
}) => {
  const route = "/employee-profiles";
  const [canCreateByRole, isHrEmployee] = await Promise.all([
    canAccess(route, "create"),
    isCurrentEmployeeHr(),
  ]);
  const canCreate = canCreateByRole || isHrEmployee;

  if (!canCreate) {
    redirect("/404");
  }

  const params = await searchParams;
  const recruitmentId =
    typeof params?.recruitmentId === "string" ? params.recruitmentId : "";

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <UserPlus size={20} />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Add Employee Profile
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Create a new employee profile in your HRMS portal
              </p>
            </div>
          </div>

          {/* Right */}
          <Button
            asChild
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            <Link href="/employee-profiles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <EmployeeProfileForm
          update={false}
          initialRecruitmentId={recruitmentId}
        />
      </CardContent>
    </Card>
  );
};

export default EmployeeProfileCreatePage;
