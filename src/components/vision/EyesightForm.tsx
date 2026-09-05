import { RegisterOptions, useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { visualAcuitySchema, pinholeSchema } from "@/lib/validation/eyesight";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { Button } from "@/components/interactive/Button/Button";
import toast from "react-hot-toast";
import { EyesightFormValues } from "@/types/eyesight";

const BLANK_EYESIGHT: EyesightFormValues = {
  leftEyeDegree: "",
  rightEyeDegree: "",
  leftEyePinhole: "",
  rightEyePinhole: "",
  leftAstigmatism: "",
  rightAstigmatism: "",
  leftPrescribedGlassesDegree: "",
  rightPrescribedGlassesDegree: "",
  comments: "",
};

// Validate a Visual Acuity field against the shared Zod schema so the client
// and server enforce the exact same rule. Returns true when valid, or the
// error message string RHF should display.
const validateVisualAcuity: RegisterOptions["validate"] = (value) => {
  const result = visualAcuitySchema.safeParse(value ?? "");
  return result.success || result.error.issues[0]?.message;
};

const validatePinhole: RegisterOptions["validate"] = (value) => {
  const result = pinholeSchema.safeParse(value ?? "");
  return result.success || result.error.issues[0]?.message;
};

const EYE_SECTIONS: {
  title: string;
  fields: {
    name: keyof EyesightFormValues;
    label: string;
    registerOptions?: RegisterOptions;
  }[];
}[] = [
  {
    title: "Visual Acuity (Degree)",
    fields: [
      {
        name: "leftEyeDegree",
        label: "Left Eye Degree",
        registerOptions: { validate: validateVisualAcuity },
      },
      {
        name: "rightEyeDegree",
        label: "Right Eye Degree",
        registerOptions: { validate: validateVisualAcuity },
      },
    ],
  },
  {
    title: "Pinhole",
    fields: [
      {
        name: "leftEyePinhole",
        label: "Left Eye Pinhole",
        registerOptions: { validate: validatePinhole },
      },
      {
        name: "rightEyePinhole",
        label: "Right Eye Pinhole",
        registerOptions: { validate: validatePinhole },
      },
    ],
  },
  {
    title: "Astigmatism",
    fields: [
      { name: "leftAstigmatism", label: "Left Astigmatism" },
      { name: "rightAstigmatism", label: "Right Astigmatism" },
    ],
  },
  {
    title: "Prescribed Glasses (Degree)",
    fields: [
      {
        name: "leftPrescribedGlassesDegree",
        label: "Left Prescribed Glasses Degree",
      },
      {
        name: "rightPrescribedGlassesDegree",
        label: "Right Prescribed Glasses Degree",
      },
    ],
  },
];

export function EyesightForm({
  visitId,
  visitSelect,
}: {
  visitId: number;
  visitSelect: string;
}) {
  const {
    handleSubmit,
    formState: { isDirty },
    reset: resetCtx,
  } = useFormContext<EyesightFormValues>();

  const reset = resetCtx as (
    values: EyesightFormValues & { visitSelect: string },
  ) => void;

  const { data: eyesightData, isLoading: eyesightLoading } =
    trpc.eyesightRouter.getByVisitId.useQuery(
      { visitId },
      { enabled: !!visitId },
    );

  const utils = trpc.useUtils();

  const createEyesightMutation = trpc.eyesightRouter.create.useMutation();
  const updateEyesightMutation =
    trpc.eyesightRouter.updateByVisitId.useMutation();

  useEffect(() => {
    if (eyesightLoading) return;
    reset({ ...BLANK_EYESIGHT, ...eyesightData, visitSelect });
  }, [eyesightData, eyesightLoading, reset, visitId, visitSelect]); // eyesightData and visitSelect are redundant alongside visitId (both change when visitId changes), but included to satisfy the linter

  if (eyesightLoading) return <LoadingSpinner message="Loading vision data" />;

  const onSubmit = (data: EyesightFormValues) => {
    if (!isDirty) {
      toast.error("No form field changed!");
      return;
    }

    const payload = {
      visitId,
      leftEyeDegree: data.leftEyeDegree || undefined,
      rightEyeDegree: data.rightEyeDegree || undefined,
      leftEyePinhole: data.leftEyePinhole || undefined,
      rightEyePinhole: data.rightEyePinhole || undefined,
      leftAstigmatism: data.leftAstigmatism || undefined,
      rightAstigmatism: data.rightAstigmatism || undefined,
      leftPrescribedGlassesDegree:
        data.leftPrescribedGlassesDegree || undefined,
      rightPrescribedGlassesDegree:
        data.rightPrescribedGlassesDegree || undefined,
      comments: data.comments || undefined,
    };

    const onSuccess = () => {
      utils.eyesightRouter.getByVisitId.invalidate({ visitId });
      toast.success("Vision record saved successfully!");

      reset({ ...data, visitSelect });
    };
    const onError = () => toast.error("Failed to save vision record.");

    if (!eyesightData) {
      createEyesightMutation.mutate(payload, { onSuccess, onError });
    } else {
      updateEyesightMutation.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {EYE_SECTIONS.map((section) => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">
            {section.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.fields.map((field) => (
              <RHFInput
                key={field.name}
                name={field.name}
                label={field.label}
                type="text"
                registerOptions={field.registerOptions}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-4">
        <RHFTextArea name="comments" label="Comments" rows={3} />
      </section>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <div className="w-full md:w-44">
          <Button
            type="submit"
            title="Save Records"
            colour="emerald"
            variant="filled"
            loading={
              createEyesightMutation.isPending ||
              updateEyesightMutation.isPending
            }
          />
        </div>
      </div>
    </form>
  );
}
