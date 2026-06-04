"use client";

import { Status } from "@prisma/client";
import {
  createEmployeeProfile,
  getEmployeeProfileOptions,
  getNextEmployeeCodePreview,
  updateEmployeeProfile,
} from "@/lib/actions/employee-profiles";
import { getApplicantDocumentOptionsForEmployeeCreation } from "@/lib/actions/employee-documents";
import { getRecruitmentApplicationById } from "@/lib/actions/recruitment";
import { employeeProfileDefaultValues } from "@/lib/constants";
import { employeeProfileSchema } from "@/lib/validators";
import { EmployeeProfile, RecruitmentApplication } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, FileCheck2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

type Props = {
  data?: EmployeeProfile;
  update: boolean;
  initialRecruitmentId?: string;
  initialApplicantDocumentId?: string;
};

type Option = {
  id: string;
  name: string;
};

type CompanyOption = {
  id: string;
  companyName: string;
};

type ManagerOption = {
  id: string;
  employeeName: string;
  employeeCode: string;
};

type ApplicantDocumentOption = {
  id: string;
  applicantId: string;
  requestId: string;
  candidateName: string;
  mobileNumber: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  reviewStatus: string;
  linkedEmployeeId: string;
};

const NONE_VALUE = "none";
const EXISTING_PASSWORD_SENTINEL = "__KEEP__";
const PASSWORD_MASK = "********";

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const textAreaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const EmployeeProfileForm = ({
  data,
  update,
  initialRecruitmentId,
  initialApplicantDocumentId,
}: Props) => {
  const router = useRouter();
  const id = data?.id;

  const [managers, setManagers] = React.useState<ManagerOption[]>([]);
  const [departments, setDepartments] = React.useState<Option[]>([]);
  const [jobRoles, setJobRoles] = React.useState<Option[]>([]);
  const [workLocations, setWorkLocations] = React.useState<Option[]>([]);
  const [companies, setCompanies] = React.useState<CompanyOption[]>([]);
  const [applicantDocuments, setApplicantDocuments] = React.useState<
    ApplicantDocumentOption[]
  >([]);
  const [selectedRecruitment, setSelectedRecruitment] =
    React.useState<RecruitmentApplication | null>(null);

  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof employeeProfileSchema>>({
    resolver: zodResolver(employeeProfileSchema),
    defaultValues: data ?? employeeProfileDefaultValues,
  });
  const selectedApplicantDocumentId = useWatch({
    control: form.control,
    name: "sourceApplicantDocumentId",
  });
  const selectedApplicantDocument = React.useMemo(
    () =>
      applicantDocuments.find(
        (item) => item.id === selectedApplicantDocumentId,
      ) ?? null,
    [applicantDocuments, selectedApplicantDocumentId],
  );

  const applyApplicantDocumentValues = React.useCallback(
    (document: ApplicantDocumentOption) => {
      form.setValue("sourceApplicantDocumentId", document.id);
      form.setValue("employeeName", document.candidateName || "");
      form.setValue("email", document.email || "");
      form.setValue("phone", document.mobileNumber || "");
      form.setValue("gender", document.gender || "");
      form.setValue("dateOfBirth", document.dateOfBirth || "");
      form.setValue("address", document.address || "");
      form.setValue(
        "emergencyContactName",
        document.emergencyContactName || "",
      );
      form.setValue(
        "emergencyContactPhone",
        document.emergencyContactPhone || "",
      );
    },
    [form],
  );

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  useEffect(() => {
    getEmployeeProfileOptions().then((options) => {
      setManagers(options.managers);
      setDepartments(options.departments);
      setCompanies(options.companies);
      setJobRoles(options.jobRoles);
      setWorkLocations(options.workLocations);
    });
    getApplicantDocumentOptionsForEmployeeCreation().then(setApplicantDocuments);

    if (!update) {
      getNextEmployeeCodePreview().then((code) => {
        form.setValue("employeeCode", code);
      });
    }
  }, [form, update]);

  useEffect(() => {
    if (!initialRecruitmentId || update) {
      return;
    }

    getRecruitmentApplicationById(initialRecruitmentId).then((result) => {
      if (!result.success || !result.data) {
        return;
      }

      setSelectedRecruitment(result.data);
      form.setValue("employeeName", result.data.candidateName || "");
      form.setValue("email", result.data.email || "");
      form.setValue("phone", result.data.mobileNumber || "");
    });
  }, [form, initialRecruitmentId, update]);

  useEffect(() => {
    if (update || !applicantDocuments.length) {
      return;
    }

    const linkedApplicantDocument = initialApplicantDocumentId
      ? applicantDocuments.find((item) => item.id === initialApplicantDocumentId)
      : initialRecruitmentId
        ? applicantDocuments.find((item) => item.applicantId === initialRecruitmentId)
        : null;

    if (linkedApplicantDocument) {
      applyApplicantDocumentValues(linkedApplicantDocument);
    }
  }, [
    applicantDocuments,
    applyApplicantDocumentValues,
    form,
    initialApplicantDocumentId,
    initialRecruitmentId,
    update,
  ]);

  const onSubmit: SubmitHandler<z.infer<typeof employeeProfileSchema>> = async (
    values,
  ) => {
    startTransition(async () => {
      const res =
        update && id
          ? await updateEmployeeProfile(values, id)
          : await createEmployeeProfile(values);

      if (!res?.success) {
        toast.error("Error", {
          description: res?.message,
        });
        return;
      }

      toast.success("Success", {
        description: res.message,
      });

      router.push("/employee-profiles");
      router.refresh();
    });
  };

  const availableManagers = React.useMemo(
    () => managers.filter((manager) => manager.id !== id),
    [id, managers],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!update && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  On-boarding Documentation
                </h3>
                <p className="text-sm text-slate-500">
                  Choose an applicant document set if this employee is being created from pre-onboarding.
                </p>
              </div>
            </div>

            {(selectedRecruitment || selectedApplicantDocument) && (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Creating employee profile for{" "}
                {selectedApplicantDocument?.candidateName ||
                  selectedRecruitment?.candidateName}
                {selectedApplicantDocument
                  ? ` from applicant document ${selectedApplicantDocument.requestId}`
                  : ` from request ${selectedRecruitment?.requestId}`}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sourceApplicantDocumentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant Document</FormLabel>

                    <Select
                      value={field.value || NONE_VALUE}
                        onValueChange={(value) => {
                          const nextValue = value === NONE_VALUE ? "" : value;
                          const selected = applicantDocuments.find(
                            (item) => item.id === nextValue,
                          );

                          field.onChange(nextValue);

                          if (!selected) {
                            return;
                          }
                          applyApplicantDocumentValues(selected);
                        }}
                    >
                      <FormControl>
                        <SelectTrigger className={fieldClass}>
                          <SelectValue placeholder="Select applicant document" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="rounded-2xl border border-indigo-100">
                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                        {applicantDocuments.map((item) => (
                          <SelectItem
                            key={item.id}
                            value={item.id}
                            disabled={!!item.linkedEmployeeId}
                          >
                            {item.candidateName} ({item.requestId}) - {item.reviewStatus}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                The selected applicant documents will be copied into the employee record automatically when this profile is created.
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="employeeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Name</FormLabel>
                <FormControl>
                  <Input
                    className={fieldClass}
                    placeholder="Enter employee name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input
                    readOnly
                    className={fieldClass}
                    placeholder="Auto generated"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Email</FormLabel>
                <FormControl>
                  <Input
                    className={fieldClass}
                    placeholder="Enter Email Id"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className={fieldClass}
                    placeholder={
                      update
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    value={
                      field.value === EXISTING_PASSWORD_SENTINEL
                        ? PASSWORD_MASK
                        : field.value || ""
                    }
                    onFocus={() => {
                      if (field.value === EXISTING_PASSWORD_SENTINEL) {
                        field.onChange("");
                      }
                    }}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <Input
                  className={fieldClass}
                  placeholder="Enter phone"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alternatePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternate Phone</FormLabel>
                <Input
                  className={fieldClass}
                  placeholder="Alternate phone"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>

                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="rounded-2xl border border-indigo-100">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <Input type="date" className={fieldClass} {...field} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="joiningDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joining Date</FormLabel>
                <Input type="date" className={fieldClass} {...field} />
              </FormItem>
            )}
          />

          {/* Company */}
          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>

                <Select
                  value={field.value ?? undefined}   // ✅ FIXED
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="rounded-2xl border border-indigo-100">
                    {companies.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager</FormLabel>

                <Select
                  value={field.value || NONE_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_VALUE ? "" : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="rounded-2xl border border-indigo-100">
                    <SelectItem value={NONE_VALUE}>None</SelectItem>

                    {availableManagers.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.employeeName} ({item.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* Department */}
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>

                <Select
                  value={field.value || NONE_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_VALUE ? "" : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="rounded-2xl border border-indigo-100">
                    <SelectItem value={NONE_VALUE}>None</SelectItem>

                    {departments.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Job Role */}
          <FormField
            control={form.control}
            name="jobRoleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Role</FormLabel>

                <Select
                  value={field.value || NONE_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_VALUE ? "" : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select job role" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="rounded-2xl border border-indigo-100">
                    <SelectItem value={NONE_VALUE}>None</SelectItem>

                    {jobRoles.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Work Location */}
          <FormField
            control={form.control}
            name="workLocationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Location</FormLabel>

                <Select
                  value={field.value || NONE_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_VALUE ? "" : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="rounded-2xl border border-indigo-100">
                    <SelectItem value={NONE_VALUE}>None</SelectItem>

                    {workLocations.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Name</FormLabel>
                <Input
                  className={fieldClass}
                  placeholder="Contact name"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Phone</FormLabel>
                <Input
                  className={fieldClass}
                  placeholder="Contact phone"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>

                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as Status)}
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="rounded-2xl border border-indigo-100">
                    <SelectItem value={Status.ACTIVE}>Active</SelectItem>
                    <SelectItem value={Status.INACTIVE}>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <Textarea
                className={textAreaClass}
                placeholder="Enter full address"
                {...field}
              />
            </FormItem>
          )}
        />

        {/* Remark */}
        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remark</FormLabel>
              <Textarea
                className={textAreaClass}
                placeholder="Additional notes"
                {...field}
              />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-8 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}

          {update ? "Update Employee Profile" : "Save Employee Profile"}
        </Button>
      </form>
    </Form>
  );
};

export default EmployeeProfileForm;
