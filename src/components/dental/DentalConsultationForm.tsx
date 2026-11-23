import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { DentalWithDiagnoses } from "@/db/schema/dental";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/interactive/Button/Button";
import {
  ChiefComplaintFormValues,
  ChiefComplaintSection,
  toChiefComplaintFormValues,
  toChiefComplaintPayload,
} from "@/components/dental/ChiefComplaintSection";
import {
  ClinicalExaminationFormValues,
  ClinicalExaminationSection,
  toClinicalExaminationFormValues,
  toClinicalExaminationPayload,
} from "@/components/dental/ClinicalExaminationSection";
import {
  DentalDiagnosisFormValues,
  DentalDiagnosisSection,
  toDentalDiagnosisFormValues,
  toDentalDiagnosisPayload,
} from "@/components/dental/DentalDiagnosisSection";
import {
  DentalHistoryFormValues,
  DentalHistorySection,
  toDentalHistoryFormValues,
  toDentalHistoryPayload,
} from "@/components/dental/DentalHistorySection";
import {
  RemarksFormValues,
  RemarksSection,
  toRemarksFormValues,
  toRemarksPayload,
} from "@/components/dental/RemarksSection";
import { trpc } from "@/utils/trpc";

// Extend with each new section's values as the remaining sections are built.
type DentalConsultationFormValues = DentalHistoryFormValues &
  ChiefComplaintFormValues &
  ClinicalExaminationFormValues &
  DentalDiagnosisFormValues &
  RemarksFormValues;

const toFormValues = (
  record: DentalWithDiagnoses | null,
): DentalConsultationFormValues => ({
  ...toDentalHistoryFormValues(record),
  ...toChiefComplaintFormValues(record),
  ...toClinicalExaminationFormValues(record),
  ...toDentalDiagnosisFormValues(record),
  ...toRemarksFormValues(record),
});

const toPayload = (values: DentalConsultationFormValues) => ({
  ...toDentalHistoryPayload(values),
  ...toChiefComplaintPayload(values),
  ...toClinicalExaminationPayload(values),
  ...toDentalDiagnosisPayload(values),
  ...toRemarksPayload(values),
});

/**
 * Loads and saves the dental consultation for one visit. Render it with
 * `key={visitId}` so switching visits remounts it with that visit's record
 * instead of carrying over the previous visit's form state.
 */
export function DentalConsultationForm({ visitId }: { visitId: number }) {
  const dentalQuery = trpc.dentalRouter.getByVisitId.useQuery({ visitId });

  if (dentalQuery.isLoading) {
    return (
      <LoadingSpinner message="Loading dental records..." className="p-12" />
    );
  }
  if (dentalQuery.isError) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Unable to load dental records for this visit. Please try again.
      </div>
    );
  }

  return (
    <DentalConsultationFormBody
      visitId={visitId}
      record={dentalQuery.data ?? null}
    />
  );
}

function DentalConsultationFormBody({
  visitId,
  record,
}: {
  visitId: number;
  record: DentalWithDiagnoses | null;
}) {
  const methods = useForm<DentalConsultationFormValues>({
    defaultValues: toFormValues(record),
  });
  // Read during render: RHF only tracks formState fields that are subscribed.
  const { isDirty } = methods.formState;
  const utils = trpc.useUtils();

  const mutationOptions = {
    onSuccess: (saved: DentalWithDiagnoses) => {
      // Write the saved row straight into the cache so a second save updates
      // this record instead of creating a duplicate while a refetch is pending.
      utils.dentalRouter.getByVisitId.setData({ visitId }, saved);
      methods.reset(toFormValues(saved));
      toast.success("Dental consultation saved!");
    },
    onError: () => {
      toast.error("Failed to save dental consultation.");
    },
  };
  const createMutation = trpc.dentalRouter.create.useMutation(mutationOptions);
  const updateMutation = trpc.dentalRouter.update.useMutation(mutationOptions);

  const onSubmit = (values: DentalConsultationFormValues) => {
    if (!isDirty) {
      toast("No form field changed!");
      return;
    }
    const payload = toPayload(values);
    if (record) {
      updateMutation.mutate({ id: record.id, ...payload });
    } else {
      createMutation.mutate({ visitId, ...payload });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <DentalHistorySection />
        <ChiefComplaintSection />
        <ClinicalExaminationSection />
        <DentalDiagnosisSection />
        {/* Treatment Provided and Referral go here once built. */}
        <RemarksSection />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            title="Reset Form"
            colour="indigo"
            variant="outline"
            onClick={() => methods.reset()}
          />
          <Button
            type="submit"
            title="Save Dental Consultation"
            colour="emerald"
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </form>
    </FormProvider>
  );
}
