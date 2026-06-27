import { trpc } from "@/utils/trpc";
import { FormFields } from "./types";
import toast from "react-hot-toast";
import Modal from "@/components/interactive/Modal";
import clsx from "clsx";

export function DeleteModal({
  activeForm,
  onClose,
}: {
  onClose: () => void;
  activeForm: FormFields | null;
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
      <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">
        Confirm Deletion
      </h2>
      <p>{activeForm?.code}</p>
      <p>{activeForm?.name}</p>

      <div className="flex gap-2">
        <button
          onClick={() => deleteMutation.mutate({ id: activeForm!.id! })}
          className={clsx(
            "flex-1 text-white px-4 py-1 rounded-lg font-medium",
            deleteMutation.isPending
              ? "bg-neutral-600"
              : "bg-green-600 hover:bg-green-700",
          )}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={onClose}
          className="bg-red-700 flex-1 text-white px-4 py-1 rounded-lg font-medium hover:bg-red-800"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
