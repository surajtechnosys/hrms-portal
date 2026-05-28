"use client";

import React from "react";
import { Status } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import {
  createRecruitmentApplication,
  updateRecruitmentApplication,
} from "@/lib/actions/recruitment";
import { recruitmentDefaultValues } from "@/lib/constants";
import { recruitmentSchema } from "@/lib/validators";
import { RecruitmentApplication } from "@/types";
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

type Props = {
  data?: RecruitmentApplication;
  update: boolean;
  nextSerialNumber?: string;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const RecruitmentForm = ({ data, update, nextSerialNumber }: Props) => {
  const router = useRouter();
  const id = data?.id;
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof recruitmentSchema>>({
    resolver: zodResolver(recruitmentSchema),
    defaultValues:
      data ||
      {
        ...recruitmentDefaultValues,
        serialNumber: nextSerialNumber ?? recruitmentDefaultValues.serialNumber,
      },
  });

  const onSubmit: SubmitHandler<
    z.infer<typeof recruitmentSchema>
  > = async (values) => {
    startTransition(async () => {
      const res =
        update && id
          ? await updateRecruitmentApplication(values, id)
          : await createRecruitmentApplication(values);

      if (!res?.success) {
        toast.error("Error", { description: res?.message });
        return;
      }

      toast.success("Success", { description: res.message });
      router.push("/recruitment");
      router.refresh();
    });
  };

  const renderInput = (
    name: keyof z.infer<typeof recruitmentSchema>,
    label: string,
    placeholder: string,
    type = "text",
    readOnly = false,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              className={fieldClass}
              {...field}
              readOnly={readOnly}
              value={(field.value as string | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderSelect = (
    name: keyof z.infer<typeof recruitmentSchema>,
    label: string,
    options: { label: string; value: string }[],
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={(field.value as string | undefined) ?? ""}
            onValueChange={(value) => field.onChange(value)}
          >
            <FormControl>
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Candidate Details
              </h3>
              <p className="text-sm text-slate-500">
                Basic candidate information.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {renderInput(
              "serialNumber",
              "Sl. No.",
              "Auto-generated",
              "text",
              true,
            )}
            {renderInput("candidateName", "Candidate Name", "Enter candidate name")}
            {renderInput("gender", "Gender", "Enter gender")}
            {renderInput("dateOfBirth", "DOB", "Select date of birth", "date")}
            {renderInput("mobileNumber", "Mob no.", "Enter mobile number")}
            {renderInput("email", "Email", "Enter email address", "email")}
            {renderInput(
              "currentLocation",
              "Current Location",
              "Enter current location",
            )}
            {renderInput("profilePost", "Profile / Post", "Enter profile or post")}
            {renderSelect("status", "Status", [
              { label: "Active", value: Status.ACTIVE },
              { label: "Inactive", value: Status.INACTIVE },
            ])}
            {renderInput("currentCtc", "C.CTC", "Enter current CTC")}
            {renderInput("expectedCtc", "E.CTC", "Enter expected CTC")}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            disabled={isPending}
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : update ? (
              "Update Pre-Onboarding"
            ) : (
              "Create Pre-Onboarding"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RecruitmentForm;
