import Modal from "@/components/interactive/Modal";
import { Button } from "@/components/interactive/Button/Button";
import type { MedicationBrand } from "@/db/schema";

export default function DeleteConfirmModal({
  brand,
  onConfirm,
  onCancel,
}: {
  brand: MedicationBrand & {
    activeIngredientName: string;
    unitOfMeasurement: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title="Confirm Deletion?" onClose={onCancel}>
      <table>
        <tbody>
          <tr>
            <td>Brand:</td>
            <td>{brand.name}</td>
          </tr>
          <tr>
            <td>Active Ingredient:</td>
            <td>{brand.activeIngredientName}</td>
          </tr>
          <tr>
            <td>Unit:</td>
            <td>{brand.unitOfMeasurement}</td>
          </tr>
          <tr>
            <td>Remarks:</td>
            <td>{brand.remarks}</td>
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
          title="Confirm"
          className="w-full"
        />
      </div>
    </Modal>
  );
}
