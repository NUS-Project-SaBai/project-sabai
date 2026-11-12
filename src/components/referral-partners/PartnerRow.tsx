import { useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import EditableCell from "@/components/interactive/EditableCell";
import { Button } from "@/components/interactive/Button/Button";
import { ReferralPartner } from "@/db/schema";
import { trpc } from "@/utils/trpc";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { EditFormFields, nameRegisterOptions } from "./types";

export default function PartnerRow(partner: ReferralPartner) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const form = useForm<EditFormFields>({
    values: {
      id: partner.id,
      name: partner.name,
      remarks: partner.remarks ?? "",
      isActive: partner.isActive,
    },
  });

  const utils = trpc.useUtils();
  const updateMutation = trpc.referralPartnersRouter.update.useMutation({
    onSuccess: () => {
      toast.success("Successfully updated!");
      utils.referralPartnersRouter.list.invalidate();
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error("An error has occurred.");
      console.error(err);
    },
  });

  const deleteMutation = trpc.referralPartnersRouter.delete.useMutation({
    onSuccess: () => {
      toast.success("Successfully deleted.");
      utils.referralPartnersRouter.list.invalidate();
      setIsDeleting(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Unable to delete referral partner.");
      setIsDeleting(false);
    },
  });

  const isSaving = updateMutation.isPending;

  const handleSubmit: SubmitHandler<EditFormFields> = async (data) => {
    const hasChanged =
      data.name !== partner.name ||
      data.remarks !== (partner.remarks ?? "") ||
      data.isActive !== partner.isActive;

    if (!hasChanged) {
      toast.error("No form field changed!");
      return;
    }

    updateMutation.mutate({ ...data, id: partner.id });
  };

  return (
    <TableRow>
      <FormProvider {...form}>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            <EditableCell
              isEditing={isEditing}
              name="name"
              type="text"
              value={partner.name}
              registerOptions={nameRegisterOptions}
            />
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-slate-900">
            <EditableCell
              isEditing={isEditing}
              name="remarks"
              type="text"
              value={partner.remarks ?? ""}
            />
          </span>
        </TableCell>
        <TableCell>
          {isEditing ? (
            <input
              type="checkbox"
              aria-label={`${partner.name} is active`}
              className="h-4 w-4 accent-blue-500 cursor-pointer"
              {...form.register("isActive")}
            />
          ) : (
            <input
              type="checkbox"
              aria-label={`${partner.name} is active`}
              aria-readonly
              checked={partner.isActive}
              disabled
              readOnly
              className="h-4 w-4 accent-blue-500"
            />
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-left gap-2">
            {isEditing ? (
              <Button
                colour="emerald"
                disabled={isSaving}
                onClick={() => form.handleSubmit(handleSubmit)()}
                title={isSaving ? "Saving..." : "Save"}
              />
            ) : (
              <Button
                colour="emerald"
                onClick={() => setIsEditing(true)}
                title="Edit"
              />
            )}

            {isEditing ? (
              <Button
                onClick={() => {
                  form.reset();
                  setIsEditing(false);
                }}
                colour="red"
                title="Cancel"
              />
            ) : (
              <Button
                onClick={() => setIsDeleting(true)}
                colour="red"
                title="Delete"
              />
            )}

            {isDeleting && (
              <DeleteConfirmModal
                partner={partner}
                isDeleting={deleteMutation.isPending}
                onCancel={() => setIsDeleting(false)}
                onConfirm={() => deleteMutation.mutate({ id: partner.id })}
              />
            )}
          </div>
        </TableCell>
      </FormProvider>
    </TableRow>
  );
}
