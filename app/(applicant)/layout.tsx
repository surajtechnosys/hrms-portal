import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    !session?.user?.id ||
    (session.user.accountType !== "applicant" &&
      session.user.role !== "applicant")
  ) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {children}
    </main>
  );
}
