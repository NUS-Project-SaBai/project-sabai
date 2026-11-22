import Modal from "@/components/interactive/Modal";
import { Button } from "@/components/interactive/Button/Button";
import { ReferralPartner } from "@/db/schema";

export default function DeleteConfirmModal({
  partner,
  onConfirm,
  onCancel,
  isDeleting = false,
}: {
  partner: ReferralPartner;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}) {
  return (
    <Modal title="Confirm Deletion?" onClose={onCancel}>
      <table>
        <tbody>
          <tr>
            <td>Name:</td>
            <td>{partner.name}</td>
          </tr>
          <tr>
            <td>Remarks:</td>
            <td>{partner.remarks}</td>
          </tr>
          <tr>
            <td>Active:</td>
            <td>{partner.isActive ? "Yes" : "No"}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex flex-row gap-2">
        <Button
          onClick={onCancel}
          colour="red"
          title="Cancel"
          className="w-full"
        />
        <Button
          onClick={onConfirm}
          colour="emerald"
          disabled={isDeleting}
          title={isDeleting ? "Deleting..." : "Confirm"}
          className="w-full"
        />
      </div>
    </Modal>
  );
}
