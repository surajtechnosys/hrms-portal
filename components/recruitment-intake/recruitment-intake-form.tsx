"use client";

import React from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createRecruitmentIntake,
  updateRecruitmentIntake,
} from "@/lib/actions/recruitment-intake";
import { type RecruitmentIntake } from "@/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Props = {
  data?: RecruitmentIntake;
  update: boolean;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const textAreaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const sourceOptions = [
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "REFERRAL", label: "Referral" },
  { value: "NAUKRI", label: "Naukri" },
  { value: "WEBSITE", label: "Website" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
];

const RecruitmentIntakeForm = ({ data, update }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = update && data?.id
        ? await updateRecruitmentIntake(formData, data.id)
        : await createRecruitmentIntake(formData);

      if (!res.success) {
        toast.error("Error", { description: res.message });
        return;
      }

      toast.success("Success", { description: res.message });
      router.push("/recruitment-intake");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {data?.id ? <input type="hidden" name="id" value={data.id} /> : null}
      {data?.resumeUrl ? (
        <input type="hidden" name="currentResumeUrl" value={data.resumeUrl} />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Name
          </label>
          <Input
            name="name"
            defaultValue={data?.name ?? ""}
            required
            placeholder="Enter name"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <Input
            name="email"
            type="email"
            defaultValue={data?.email ?? ""}
            required
            placeholder="Enter email"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Phone
          </label>
          <Input
            name="phone"
            defaultValue={data?.phone ?? ""}
            required
            placeholder="Enter phone number"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Applied Position
          </label>
          <Input
            name="appliedPosition"
            defaultValue={data?.appliedPosition ?? ""}
            required
            placeholder="Enter applied position"
            className={fieldClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Skills
          </label>
          <Textarea
            name="skills"
            defaultValue={data?.skills ?? ""}
            required
            placeholder="Enter key skills"
            className={textAreaClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Experience
          </label>
          <Textarea
            name="experience"
            defaultValue={data?.experience ?? ""}
            required
            placeholder="Enter experience summary"
            className={textAreaClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Source
          </label>
          <select
            name="source"
            defaultValue={data?.source ?? "LINKEDIN"}
            className={fieldClass}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Resume PDF
          </label>
          <Input
            name="resumeFile"
            type="file"
            accept="application/pdf"
            required={!update}
            className={fieldClass}
          />
          <p className="mt-2 text-xs text-slate-500">
            Upload a PDF resume only.
          </p>
          {data?.resumeUrl ? (
            <a
              href={data.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              View current resume
            </a>
          ) : null}
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
            "Update Recruitment"
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Create Recruitment
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default RecruitmentIntakeForm;
