"use client";

import { useCallback, useState } from "react";
import FilterPanel from "@/components/dashboard-design/filter-panel";
import EmployeeList from "@/components/dashboard-design/employee-list";
import {
  getFilteredEmployeeProfiles,
  EmployeeFilters,
} from "@/lib/actions/employee-profiles";
import { EmployeeProfile } from "@/types";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Activity,
  Building2,
  MapPin,
  Users,
} from "lucide-react";

interface DashboardDesignContentProps {
  initialEmployees: EmployeeProfile[];
  companies: Array<{ id: string; companyName: string }>;
  departments: Array<{ id: string; name: string }>;
  jobRoles: Array<{ id: string; name: string }>;
  workLocations: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

const getDashboardStats = (employees: EmployeeProfile[]) => {
  const activeEmployees = employees.filter(
    (employee) => employee.status?.toUpperCase() === "ACTIVE",
  );
  const inactiveEmployees = employees.filter(
    (employee) => employee.status?.toUpperCase() === "INACTIVE",
  );
  const companies = new Set(
    employees.map((employee) => employee.companyName).filter(Boolean),
  );
  const departments = new Set(
    employees.map((employee) => employee.departmentName).filter(Boolean),
  );
  const locations = new Set(
    employees.map((employee) => employee.workLocationName).filter(Boolean),
  );
  return {
    total: employees.length,
    active: activeEmployees.length,
    inactive: inactiveEmployees.length,
    activeRatio: employees.length
      ? Math.round((activeEmployees.length / employees.length) * 100)
      : 0,
    companies: companies.size,
    departments: departments.size,
    locations: locations.size,
  };
};

export default function DashboardDesignContent({
  initialEmployees,
  companies,
  departments,
  jobRoles,
  workLocations,
  projects,
  eyebrow = "Employee Directory",
  title,
  description,
  actions,
}: DashboardDesignContentProps) {
  const [employees, setEmployees] =
    useState<EmployeeProfile[]>(initialEmployees);
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyFilters = useCallback(async (filters: EmployeeFilters) => {
    setIsLoading(true);
    try {
      const filtered = await getFilteredEmployeeProfiles(filters);
      setEmployees(filtered);
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const allEmployees = await getFilteredEmployeeProfiles({});
      setEmployees(allEmployees);
    } catch (error) {
      console.error("Error resetting filters:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { state } = useSidebar();
  const stats = getDashboardStats(employees);
  const isCollapsed = state === "collapsed";
  const statsCards = [
    {
      label: "Employees",
      value: stats.total,
      detail: "Current results",
      icon: Users,
      cardClassName: "border-sky-200 bg-sky-50/90",
      accentClassName: "bg-sky-500",
      iconClassName: "bg-sky-100 text-sky-700",
    },
    {
      label: "Active",
      value: stats.active,
      detail: `${stats.activeRatio}% ratio`,
      icon: Activity,
      cardClassName: "border-emerald-200 bg-emerald-50/90",
      accentClassName: "bg-emerald-500",
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Departments",
      value: stats.departments,
      detail: "In current results",
      icon: Building2,
      cardClassName: "border-violet-200 bg-violet-50/90",
      accentClassName: "bg-violet-500",
      iconClassName: "bg-violet-100 text-violet-700",
    },
    {
      label: "Locations",
      value: stats.locations,
      detail: "In current results",
      icon: MapPin,
      cardClassName: "border-amber-200 bg-amber-50/90",
      accentClassName: "bg-amber-500",
      iconClassName: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div
      className={cn(
        "min-w-0 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-3 shadow-sm md:p-5",
        isCollapsed ? "w-full" : "w-full",
      )}
    >
      <div className="space-y-4">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                {eyebrow}
              </p>
              {(title || description || actions) && (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    {title && (
                      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="max-w-3xl text-sm leading-6 text-slate-500">
                        {description}
                      </p>
                    )}
                  </div>
                  {actions && (
                    <div className="flex flex-wrap items-center gap-3">
                      {actions}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statsCards.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border px-4 py-4 shadow-sm transition-colors",
                    item.cardClassName,
                  )}
                >
                  <div className={cn("absolute inset-x-0 top-0 h-1", item.accentClassName)} />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </p>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        item.iconClassName,
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FilterPanel
          companies={companies}
          departments={departments}
          jobRoles={jobRoles}
          workLocations={workLocations}
          projects={projects}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
        <EmployeeList employees={employees} isLoading={isLoading} />
      </div>
    </div>
  );
}
