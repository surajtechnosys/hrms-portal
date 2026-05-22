"use client";

import { ExperienceType, Status } from "@prisma/client";
import {
  createEmployeeDocument,
  updateEmployeeDocument,
} from "@/lib/actions/employee-documents";
import { getRecruitmentApplicantOptions } from "@/lib/actions/recruitment";
import { employeeDocumentDefaultValues } from "@/lib/constants";
import { employeeDocumentSchema } from "@/lib/validators";
import { EmployeeDocument } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Loader2,
  Upload,
  Trash2,
  Plus,
  GraduationCap,
  Briefcase,
  User,
  IdCard,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import {
  FieldPath,
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
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
  data?: EmployeeDocument;
  update: boolean;
  redirectTo?: string;
  mode?: "applicant" | "applicant-self" | "employee";
};

type ApplicantOption = {
  id: string;
  candidateName: string;
  requestId: string;
  profilePost: string;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const textAreaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const cardClass =
  "rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm space-y-5";

const experienceFileFields = [
  { name: "experienceLetterFileUrl", label: "Experience Letter" },
  { name: "salarySlip1FileUrl", label: "Salary Slip 1" },
  { name: "salarySlip2FileUrl", label: "Salary Slip 2" },
  { name: "salarySlip3FileUrl", label: "Salary Slip 3" },
] as const;

const createEducationEntry = () => ({
  degree: "",
  college: "",
  year: "",
  marks: undefined,
  marksheetFileUrl: "",
});

const createExperienceEntry = () => ({
  totalExperience: "",
  previousCompanyName: "",
  experienceLetterFileUrl: "",
  salarySlip1FileUrl: "",
  salarySlip2FileUrl: "",
  salarySlip3FileUrl: "",
});

type InputType = z.input<typeof employeeDocumentSchema>;
type OutputType = z.output<typeof employeeDocumentSchema>;

type ImageFieldPath = Extract<
  FieldPath<InputType>,
  | "aadhaarFileUrl"
  | "panFileUrl"
  | `educationEntries.${number}.marksheetFileUrl`
  | `experienceEntries.${number}.experienceLetterFileUrl`
  | `experienceEntries.${number}.salarySlip1FileUrl`
  | `experienceEntries.${number}.salarySlip2FileUrl`
  | `experienceEntries.${number}.salarySlip3FileUrl`
>;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject();
    reader.readAsDataURL(file);
  });

const EmployeeDocumentForm = ({
  data,
  update,
  redirectTo = "/employee-documents",
  mode = "applicant",
}: Props) => {
  const router = useRouter();
  const id = data?.id;

  const [applicants, setApplicants] = React.useState<ApplicantOption[]>([]);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<InputType, unknown, OutputType>({
    resolver: zodResolver(employeeDocumentSchema),
    defaultValues: (data ??
      {
        ...employeeDocumentDefaultValues,
      }) as InputType,
  });

  const experienceType = useWatch({
    control: form.control,
    name: "experienceType",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "educationEntries",
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
    replace: replaceExperience,
  } = useFieldArray({
    control: form.control,
    name: "experienceEntries",
  });

  useEffect(() => {
    if (mode === "applicant") {
      getRecruitmentApplicantOptions().then(setApplicants);
    }
  }, [mode]);

  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  useEffect(() => {
    if (!educationFields.length) {
      appendEducation(createEducationEntry());
    }
  }, [educationFields.length, appendEducation]);

  useEffect(() => {
    if (experienceType === ExperienceType.EXPERIENCED) {
      if (!experienceFields.length) {
        appendExperience(createExperienceEntry());
      }
    } else {
      replaceExperience([]);
    }
  }, [
    experienceType,
    experienceFields.length,
    appendExperience,
    replaceExperience,
  ]);

  const onSubmit: SubmitHandler<OutputType> = async (
    values
  ) => {
    startTransition(async () => {
      const res =
        update && id
          ? await updateEmployeeDocument(values, id)
          : await createEmployeeDocument(values);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.push(redirectTo);
      router.refresh();
    });
  };

  const renderUpload = (
    name: ImageFieldPath,
    label: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>

          <FormControl>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 px-4 py-4 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100">
                <Upload className="h-4 w-4" />
                Upload File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file =
                      e.target.files?.[0];
                    if (!file) return;

                    try {
                      const base64 =
                        await readFileAsDataUrl(
                          file
                        );
                      field.onChange(base64);
                    } catch {
                      toast.error(
                        "Unable to read file"
                      );
                    }
                  }}
                />
              </label>

              {field.value && (
                <div className="space-y-2">
                  <Image
                    src={field.value}
                    alt={label}
                    width={220}
                    height={140}
                    unoptimized
                    className="h-36 w-full rounded-2xl border object-cover md:w-56"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      field.onChange("")
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {mode === "applicant" ? (
          <div className={cardClass}>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                Applicant Details
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applicantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Applicant Name
                    </FormLabel>

                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        const selected = applicants.find((e) => e.id === value);

                        field.onChange(value);

                        form.setValue("applicantCode", selected?.requestId ?? "");
                        form.setValue(
                          "candidateName",
                          selected?.candidateName ?? "",
                        );
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className={fieldClass}>
                          <SelectValue placeholder="Select applicant" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                        {applicants.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.candidateName} - {e.profilePost}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicantCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Request ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        className={fieldClass}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="candidateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Name</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        className={fieldClass}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ) : (
          <div className={cardClass}>
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                {mode === "employee"
                  ? "Employee Document Upload"
                  : "Applicant Document Upload"}
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              {mode === "employee"
                ? "Upload your identity, education, and experience records here. HR can review them later from the employee profile."
                : "Upload your identity, education, and experience records here so HR can complete your joining documentation."}
            </p>
          </div>
        )}

        {/* Documents */}
        <div className={cardClass}>
          <div className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-cyan-500" />
            <h3 className="text-lg font-semibold text-slate-800">
              Identity Documents
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Aadhaar Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={
                        fieldClass
                      }
                      placeholder="Enter Aadhaar Number"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {renderUpload(
              "aadhaarFileUrl",
              "Aadhaar Upload"
            )}

            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    PAN Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={
                        fieldClass
                      }
                      placeholder="Enter PAN Number"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {renderUpload(
              "panFileUrl",
              "PAN Upload"
            )}
          </div>
        </div>

        {/* Education */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                Education Details
              </h3>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                appendEducation(
                  createEducationEntry()
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          {educationFields.map(
            (item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    Education{" "}
                    {index + 1}
                  </h4>

                  {educationFields.length >
                    1 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        removeEducation(
                          index
                        )
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`educationEntries.${index}.degree`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter degree"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`educationEntries.${index}.college`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>College / University</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter college or university"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`educationEntries.${index}.year`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Year</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter passing year"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`educationEntries.${index}.marks`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks / Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className={fieldClass}
                            placeholder="Enter marks"
                            {...field}
                            value={
                              typeof field.value === "number" ||
                              typeof field.value === "string"
                                ? field.value
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderUpload(
                    `educationEntries.${index}.marksheetFileUrl`,
                    "Marksheet Upload"
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Experience */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                Experience Details
              </h3>
            </div>

            {experienceType === ExperienceType.EXPERIENCED && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => appendExperience(createExperienceEntry())}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="experienceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Experience Type
                  </FormLabel>

                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(
                        v as ExperienceType
                      )
                    }
                  >
                    <FormControl>
                      <SelectTrigger
                        className={
                          fieldClass
                        }
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                      <SelectItem
                        value={
                          ExperienceType.FRESHER
                        }
                      >
                        Fresher
                      </SelectItem>
                      <SelectItem
                        value={
                          ExperienceType.EXPERIENCED
                        }
                      >
                        Experienced
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status
                  </FormLabel>

                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(
                        v as Status
                      )
                    }
                  >
                    <FormControl>
                      <SelectTrigger
                        className={
                          fieldClass
                        }
                      >
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                      <SelectItem
                        value={Status.ACTIVE}
                      >
                        Active
                      </SelectItem>
                      <SelectItem
                        value={
                          Status.INACTIVE
                        }
                      >
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {experienceType === ExperienceType.EXPERIENCED &&
            experienceFields.map((item, index) => (
              <div
                key={item.id}
                className="space-y-4 rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    Experience {index + 1}
                  </h4>

                  {experienceFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => removeExperience(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`experienceEntries.${index}.totalExperience`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Experience</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Example: 2 years"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`experienceEntries.${index}.previousCompanyName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Company</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter previous company"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {experienceFileFields.map((fileField) =>
                    renderUpload(
                      `experienceEntries.${index}.${fileField.name}`,
                      fileField.label
                    )
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Remark */}
        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Remark
              </FormLabel>
              <FormControl>
                <Textarea
                  className={
                    textAreaClass
                  }
                  placeholder="Additional notes"
                  {...field}
                  value={
                    field.value ?? ""
                  }
                />
              </FormControl>
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

          {update
            ? mode === "employee"
              ? "Update My Document"
              : "Update Applicant Document"
            : mode === "employee"
              ? "Save My Document"
              : "Save Applicant Document"}
        </Button>
      </form>
    </Form>
  );
}
export default EmployeeDocumentForm;
