import { useFieldArray, useFormContext } from "react-hook-form";
import toast from "react-hot-toast";
import { HiOutlineTrash } from "react-icons/hi2";
import { trpc } from "@/utils/trpc";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { Button } from "@/components/interactive/Button/Button";
import { IsRequiredStar } from "@/components/IsRequiredStar";
import {
  DIAGNOSIS_CATEGORY_OPTIONS,
  DiagnosisCategory,
} from "@/lib/constants/diagnosisCategories";

export type DiagnosisFormValue = {
  details: string;
  category: string;
};

export type ConsultFormValues = {
  pastMedicalHistory: string;
  consultation: string;
  treatmentPlan: string;
  remarks: string;
  diagnoses: DiagnosisFormValue[];
};

export const BLANK_CONSULT: ConsultFormValues = {
  pastMedicalHistory: "",
  consultation: "",
  treatmentPlan: "",
  remarks: "",
  diagnoses: [{ details: "", category: "" }],
};

/**
 * The consultation form body. Must be rendered inside a `FormProvider`.
 *
 * Submits the consult and all diagnoses in one transaction.
 *
 * @param visitId - The visit this consult belongs to.
 * @param onSaved - Called after a successful save so the form can be reset.
 */
export function ConsultForm({
  visitId,
  onSaved,
}: {
  visitId: number;
  onSaved: () => void;
}) {
  const { control, handleSubmit } = useFormContext<ConsultFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "diagnoses",
  });

  const utils = trpc.useUtils();
  const createConsult = trpc.consultsRouter.create.useMutation();

  const onInvalid = () =>
    toast.error("Please fill in all required fields before saving.");

  const onSubmit = (data: ConsultFormValues) => {
    createConsult.mutate(
      {
        visitId,
        pastMedicalHistory: data.pastMedicalHistory,
        consultation: data.consultation,
        treatmentPlan: data.treatmentPlan || undefined,
        remarks: data.remarks || undefined,
        diagnoses: data.diagnoses.map((d) => ({
          details: d.details,
          category: d.category as DiagnosisCategory,
        })),
      },
      {
        onSuccess: () => {
          utils.consultsRouter.getByVisitId.invalidate({ visitId });
          toast.success("Consult saved successfully!");
          onSaved();
        },
        onError: () => toast.error("Failed to save consult."),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
      <h2 className="text-lg font-semibold text-slate-900">
        Doctor&apos;s Consult Form
      </h2>

      <section className="space-y-4">
        <RHFTextArea
          name="pastMedicalHistory"
          label="Past Medical History"
          isRequired
          rows={3}
          placeholder="Type the patient's past medical history here..."
        />
        <RHFTextArea
          name="consultation"
          label="Consultation"
          isRequired
          rows={4}
          placeholder="Type your consultation here..."
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold text-slate-700">Diagnoses</h3>
          <IsRequiredStar isRequired />
        </div>

        <Button
          type="button"
          title="Add Diagnosis"
          colour="emerald"
          variant="filled"
          onClick={() => append({ details: "", category: "" })}
          className="w-full"
        />

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-4 rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                Diagnosis {index + 1}
              </p>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                title="Remove diagnosis"
                className="inline-flex items-center gap-1 rounded p-1 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                <HiOutlineTrash className="h-4 w-4" />
                Remove
              </button>
            </div>
            <RHFDropdown
              name={`diagnoses.${index}.category`}
              label="Category"
              dropdownOptions={DIAGNOSIS_CATEGORY_OPTIONS}
              isRequired
              placeholder="Choose a category"
            />
            <RHFTextArea
              name={`diagnoses.${index}.details`}
              label="Details"
              isRequired
              rows={2}
              placeholder="Describe the diagnosis..."
            />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <RHFTextArea
          name="treatmentPlan"
          label="Plan"
          rows={3}
          placeholder="Type your plan here..."
        />
        <RHFTextArea
          name="remarks"
          label="Remarks"
          rows={2}
          placeholder="Type your remarks here..."
        />
      </section>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-44">
          <Button
            type="submit"
            title="Save Consult"
            colour="emerald"
            variant="filled"
            loading={createConsult.isPending}
          />
        </div>
      </div>
    </form>
  );
}
