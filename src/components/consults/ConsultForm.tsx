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
 * The consultation form for a single visit.
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
  const createOrder = trpc.ordersRouter.create.useMutation();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const onInvalid = () =>
    toast.error("Please fill in all required fields before saving.");

  const onSubmit = async (data: ConsultFormValues) => {
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

    setIsSaving(true);

    let consult;
    try {
      consult = await createConsult.mutateAsync({
        visitId,
        pastMedicalHistory: pastMedicalHistory || undefined,
        consultation: consultation || undefined,
        treatmentPlan: data.treatmentPlan?.trim() || undefined,
        remarks: data.remarks?.trim() || undefined,
        diagnoses,
      });
    } catch {
      setIsSaving(false);
      toast.error("Failed to save consult.");
      return;
    }

    // Orders are created one at a time against the saved consult. A short order later in the seq does not impact the other orders or the consult.
    const unfilled: string[] = [];
    for (const order of data.orders) {
      try {
        await createOrder.mutateAsync({
          consultId: consult.id,
          activeIngredientId: Number(order.activeIngredientId),
          quantity: order.quantity,
          dosageInstructions: order.dosageInstructions.trim(),
        });
      } catch (error) {
        unfilled.push(
          `${order.activeIngredientName} (${error instanceof Error ? error.message : "unknown error"})`,
        );
      }
    }

    utils.consultsRouter.getByVisitId.invalidate({ visitId });
    if (data.orders.length > 0) {
      utils.medicationStockRouter.invalidate();
    }

    if (unfilled.length > 0) {
      toast.error(
        `Consult saved, but ${unfilled.length} order(s) could not be filled: ${unfilled.join(", ")}. Please re-order from the pharmacy.`,
        { duration: 10000 },
      );
    } else {
      toast.success("Consult has been saved successfully!");
    }

    methods.reset(BLANK_CONSULT);
    setIsSaving(false);
  };

  return (
    <FormProvider {...methods}>
      {orderModalIsOpen && (
        <OrderModal
          setOrderModalIsOpen={setOrderModalIsOpen}
          onSave={appendOrder}
        />
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

          {orderFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">
                  {field.activeIngredientName}
                </p>
                <p className="text-sm text-slate-600">
                  Quantity: {field.quantity}
                </p>
                <p className="text-sm text-slate-600">
                  {field.dosageInstructions}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeOrder(index)}
                title="Remove order"
                className="inline-flex items-center gap-1 rounded p-1 text-sm text-red-600 transition hover:bg-red-50"
              >
                <HiOutlineTrash className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full sm:w-44">
            <Button
              type="submit"
              title="Save Consult"
              colour="emerald"
              variant="filled"
              loading={isSaving}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
