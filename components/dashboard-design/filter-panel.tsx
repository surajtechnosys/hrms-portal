"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeFilters } from "@/lib/actions/employee-profiles";
import { Funnel, RotateCcw } from "lucide-react";

interface FilterPanelProps {
  companies: Array<{ id: string; companyName: string }>;
  departments: Array<{ id: string; name: string }>;
  jobRoles: Array<{ id: string; name: string }>;
  workLocations: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  onApplyFilters: (filters: EmployeeFilters) => void;
  onResetFilters: () => void;
}

const selectAllValue = "ALL";
const fieldClass =
  "h-11 rounded-[18px] border-slate-200 bg-white text-sm shadow-none transition-all placeholder:text-slate-400 focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/10";
const selectFieldClass = `w-full ${fieldClass} data-[size=default]:h-11`;
const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";

export default function FilterPanel({
  companies,
  departments,
  jobRoles,
  workLocations,
  projects,
  onApplyFilters,
  onResetFilters,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<EmployeeFilters>({});

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleInputChange = (key: keyof EmployeeFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value && value !== selectAllValue ? value : undefined,
    }));
  };

  const handleReset = useCallback(() => {
    setFilters({});
    onResetFilters();
  }, [onResetFilters]);

  const handleApply = useCallback(() => {
    onApplyFilters(filters);
  }, [filters, onApplyFilters]);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)] md:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(236,254,255,0.9),rgba(255,255,255,0))]" />

      <div className="relative mb-7 flex flex-col gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-cyan-100 bg-cyan-50 text-cyan-700">
            <Funnel className="h-5 w-5" />
          </span>
          <div className="space-y-1.5">
              {/* <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Filter workspace
              </p> */}
            <h2 className="text-[1.35rem] pt-2 font-semibold tracking-tight text-slate-950">
              Filter workspace
            </h2>
            {/* <p className="max-w-xl text-sm leading-6 text-slate-500">
              Use only the fields you need to narrow the employee directory.
            </p> */}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            {activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
            Live directory
          </div>
        </div>
      </div>

      <div className="relative grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="space-y-1.5">
          <label className={labelClass}>Employee ID</label>
          <Input
            placeholder="Enter employee ID"
            value={filters.employeeId || ""}
            onChange={(e) => handleInputChange("employeeId", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Full Name</label>
          <Input
            placeholder="Enter full name"
            value={filters.employeeName || ""}
            onChange={(e) => handleInputChange("employeeName", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Phone Number</label>
          <Input
            placeholder="Enter phone number"
            value={filters.phone || ""}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Project</label>
          <Select
            value={filters.project || selectAllValue}
            onValueChange={(value) => handleInputChange("project", value)}
          >
            <SelectTrigger className={selectFieldClass}>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectAllValue} >All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.name}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Company</label>
          <Select
            value={filters.companyId || selectAllValue}
            onValueChange={(value) => handleInputChange("companyId", value)}
          >
            <SelectTrigger className={selectFieldClass}>
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectAllValue}>All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Department</label>
          <Select
            value={filters.departmentId || selectAllValue}
            onValueChange={(value) => handleInputChange("departmentId", value)}
          >
            <SelectTrigger className={selectFieldClass}>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectAllValue}>All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Work Location</label>
          <Select
            value={filters.workLocationId || selectAllValue}
            onValueChange={(value) => handleInputChange("workLocationId", value)}
          >
            <SelectTrigger className={selectFieldClass}>
              <SelectValue placeholder="Work Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectAllValue}>All Locations</SelectItem>
              {workLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Job Role</label>
          <Select
            value={filters.jobRoleId || selectAllValue}
            onValueChange={(value) => handleInputChange("jobRoleId", value)}
          >
            <SelectTrigger className={selectFieldClass}>
              <SelectValue placeholder="Job Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectAllValue}>All Roles</SelectItem>
              {jobRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Joining From</label>
          <Input
            type="date"
            value={filters.joiningDateFrom || ""}
            onChange={(e) =>
              handleInputChange("joiningDateFrom", e.target.value)
            }
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Joining To</label>
          <Input
            type="date"
            value={filters.joiningDateTo || ""}
            onChange={(e) => handleInputChange("joiningDateTo", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Status</label>
          <Select
            value={filters.status || selectAllValue}
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger className={selectFieldClass}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectAllValue}>All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-4 sm:col-span-2 lg:col-span-3 xl:col-span-2 xl:items-end">
          <Button
            onClick={handleApply}
            className="h-11 flex-1 rounded-[18px] bg-cyan-700 text-white shadow-[0_16px_28px_-18px_rgba(8,145,178,0.8)] hover:bg-cyan-800"
          >
            Apply filters
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-11 flex-1 rounded-[18px] border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
