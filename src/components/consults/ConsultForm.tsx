import { FormProvider, useFieldArray, useForm } from "react-hook-form";
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
import { useState } from "react";
import OrderModal from "./OrderModal";
import { BLANK_CONSULT, ConsultFormValues } from "@/types/consults";

/**
 * The consultation form for a single visit. Owns its own form state.
 * Remount via `key` (e.g. per visit) to get a fresh form.
 *
 * @param visitId - The visit this consult belongs to.
 */
export function ConsultForm({ visitId }: { visitId: number }) {
  const methods = useForm<ConsultFormValues>({ defaultValues: BLANK_CONSULT });
  const { control, handleSubmit } = methods;

  const {
    fields: diagnosisFields,
    append: appendDiagnosis,
    remove: removeDiagnosis,
  } = useFieldArray({
    control,
    name: "diagnoses",
  });

  const {
    fields: orderFields,
    append: appendOrder,
    remove: removeOrder,
  } = useFieldArray({
    control,
    name: "orders",
  });

  const [orderModalIsOpen, setOrderModalIsOpen] = useState<boolean>(false);

  const utils = trpc.useUtils();
  const createConsult = trpc.consultsRouter.create.useMutation();

  const onInvalid = () =>
    toast.error("Please fill in all required fields before saving.");

  const onSubmit = (data: ConsultFormValues) => {
    const pastMedicalHistory = data.pastMedicalHistory.trim();
    const consultation = data.consultation.trim();
    const diagnoses = data.diagnoses.map((d) => ({
      details: d.details.trim(),
      category: d.category as DiagnosisCategory,
    }));

    if (diagnoses.some((d) => !d.details || !d.category)) {
      onInvalid();
      return;
    }

    createConsult.mutate(
      {
        visitId,
        pastMedicalHistory: pastMedicalHistory || undefined,
        consultation: consultation || undefined,
        treatmentPlan: data.treatmentPlan?.trim() || undefined,
        remarks: data.remarks?.trim() || undefined,
        diagnoses,
      },
      {
        onSuccess: () => {
          utils.consultsRouter.getByVisitId.invalidate({ visitId });
          toast.success("Consult has been saved successfully!");
          methods.reset(BLANK_CONSULT);
        },
        onError: () => toast.error("Failed to save consult."),
      },
    );
  };

  return (
    <FormProvider {...methods}>
      {orderModalIsOpen && (
        <OrderModal setOrderModalIsOpen={setOrderModalIsOpen} />
      )}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Doctor&apos;s Consult Form
        </h2>

        <section className="space-y-4">
          <RHFTextArea
            name="pastMedicalHistory"
            label="Past Medical History"
            rows={3}
            placeholder="Type the patient's past medical history here..."
          />
          <RHFTextArea
            name="consultation"
            label="Consultation"
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
            onClick={() => appendDiagnosis({ details: "", category: "" })}
            className="w-full"
          />

          {diagnosisFields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-4 rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  Diagnosis {index + 1}
                </p>
                {diagnosisFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDiagnosis(index)}
                    title="Remove diagnosis"
                    className="inline-flex items-center gap-1 rounded p-1 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                    Remove
                  </button>
                )}
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

        <section className="space-y-4">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-semibold text-slate-700">Orders</h3>
          </div>

          <Button
            title="Add Order"
            colour="emerald"
            variant="filled"
            onClick={() => setOrderModalIsOpen(true)}
            className="w-full"
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
    </FormProvider>
  );
}
