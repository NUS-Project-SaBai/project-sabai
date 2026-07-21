import { trpc } from "@/utils/trpc";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import { FormFields } from "@/lib/utils/villageCodeTypes";
import { Button } from "@/components/interactive/Button/Button";

export default function DeleteModal({
  activeForm,
  onClose,
}: {
  onClose: () => void;
  activeForm: FormFields;
}) {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.villageCodesRouter.delete.useMutation({
    onSuccess: () => {
      utils.villageCodesRouter.list.invalidate();
      toast.success("Village code deleted!");
      onClose();
    },
    onError: (err) => {
      console.error(err);
      toast.error(
        "Unable to delete village code. Check that there are no visits with this village code before deleting.",
      );
    },
  });

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">
        Confirm Deletion
      </h2>
      <p>Code: {activeForm?.code}</p>
      <p>Name: {activeForm?.name}</p>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={onClose}
          colour="red"
          title="Cancel"
          className="w-full"
        />
        <Button
          onClick={() => deleteMutation.mutate({ id: activeForm!.id! })}
          disabled={deleteMutation.isPending}
          colour="emerald"
          title={deleteMutation.isPending ? "Deleting..." : "Confirm"}
          className="w-full"
        />
      </div>
    </Modal>
  );
}
