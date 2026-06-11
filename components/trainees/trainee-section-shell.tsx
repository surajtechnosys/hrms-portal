import Link from "next/link";
import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TraineeSectionShellProps = {
  title: string;
  subtitle?: string;
  traineeCode?: string;
  traineeName?: string;
  tabs: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  summaryItems?: Array<{
    label: string;
    value: string;
    tone?: "default" | "emerald" | "cyan" | "amber" | "rose";
  }>;
  actions?: ReactNode;
  children: ReactNode;
};

type SummaryTone = "default" | "emerald" | "cyan" | "amber" | "rose";

const toneClasses: Record<SummaryTone, string> = {
  default: "bg-slate-50 text-slate-700 border-slate-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
};

export function TraineeSectionShell({
  title,
  subtitle,
  traineeCode,
  traineeName,
  tabs,
  summaryItems = [],
  actions,
  children,
}: TraineeSectionShellProps) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 shadow-sm">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                Trainee Workspace
              </p>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-cyan-200 text-cyan-700">
                {traineeCode || "Trainee"}
              </Badge>
              <Badge variant="secondary" className="bg-white text-slate-700">
                {traineeName || "Unnamed"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.href}
                  asChild
                  variant={tab.active ? "default" : "outline"}
                  className={
                    tab.active
                      ? "bg-cyan-600 text-white hover:bg-cyan-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }
                >
                  <Link href={tab.href}>{tab.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p
                  className={`mt-2 rounded-2xl border px-3 py-2 text-lg font-semibold ${
                    toneClasses[item.tone ?? "default"]
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
            {actions ? (
              <div className="sm:col-span-2">{actions}</div>
            ) : null}
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}
