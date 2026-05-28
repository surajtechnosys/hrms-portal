import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";

import RecruitmentForm from "@/components/recruitment/recruitment-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecruitmentApplications } from "@/lib/actions/recruitment";
import { canAccess } from "@/lib/rbac";

function getNextSerialNumber(records: Awaited<ReturnType<typeof getRecruitmentApplications>>) {
  return String(
    records.reduce((max, record) => {
      const value = Number.parseInt(record.serialNumber ?? "", 10);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1,
  );
}

const RecruitmentCreatePage = async () => {
  const route = "/recruitment";
  const canCreate = await canAccess(route, "create");

  if (!canCreate) {
    redirect("/404");
  }

  const records = await getRecruitmentApplications();
  const nextSerialNumber = getNextSerialNumber(records);

  return (
    <Card className="rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <UserPlus size={20} />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Add Candidate
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Create a pre-onboarding record using the shared candidate screening format
              </p>
            </div>
          </div>

          <Button
            asChild
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            <Link href="/recruitment">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <RecruitmentForm update={false} nextSerialNumber={nextSerialNumber} />
      </CardContent>
    </Card>
  );
};

export default RecruitmentCreatePage;
