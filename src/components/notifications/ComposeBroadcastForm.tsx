import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import type { z } from "zod";
import { trpc } from "@/utils/trpc";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import { Button } from "@/components/interactive/Button/Button";
import {
  BROADCAST_BODY_MAX_LENGTH,
  BROADCAST_TITLE_MAX_LENGTH,
} from "@/lib/constants/broadcasts";
import {
  sendBroadcastSchema,
  type SendBroadcastInput,
} from "@/lib/validation/broadcasts";

type SendBroadcastOutput = z.output<typeof sendBroadcastSchema>;

const DEFAULT_VALUES: SendBroadcastInput = {
  title: "",
  body: "",
  severity: "info",
};

const SEVERITY_OPTIONS = [
  { label: "Info", value: "info" },
  { label: "Warning", value: "warning" },
  { label: "Critical", value: "critical" },
];

export default function ComposeBroadcastForm() {
  const form = useForm<SendBroadcastInput, unknown, SendBroadcastOutput>({
    resolver: zodResolver(sendBroadcastSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const utils = trpc.useUtils();

  const sendMutation = trpc.broadcastsRouter.send.useMutation({
    onSuccess: () => {
      toast.success("Broadcast sent!");
      form.reset();
      utils.broadcastsRouter.list.invalidate();
    },
    // Keep the form values so the sender can retry.
    onError: (err) => {
      console.error(err);
      toast.error("Failed to send broadcast.");
    },
  });

  const handleSubmit: SubmitHandler<SendBroadcastOutput> = (data) => {
    sendMutation.mutate(data);
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
      >
        <RHFInput
          name="title"
          label="Title"
          type="text"
          isRequired
          maxLength={BROADCAST_TITLE_MAX_LENGTH}
          placeholder="e.g. Paracetamol stock running low"
        />
        <RHFTextArea
          name="body"
          label="Message"
          isRequired
          rows={4}
          maxLength={BROADCAST_BODY_MAX_LENGTH}
          placeholder="e.g. To those doing consults: please dispense paracetamol conservatively (max 10 tablets per patient)."
        />
        <RHFRadio
          name="severity"
          label="Severity"
          radioOptions={SEVERITY_OPTIONS}
          numberOfColumns={3}
          isRequired
        />
        <Button
          colour="emerald"
          type="submit"
          className="self-end"
          title={sendMutation.isPending ? "Sending..." : "Send broadcast"}
          disabled={sendMutation.isPending}
        />
      </form>
    </FormProvider>
  );
}
