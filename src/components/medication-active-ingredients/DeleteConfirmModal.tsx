import Modal from "@/components/interactive/Modal";
import { Button } from "@/components/interactive/Button/Button";
import { MedicationActiveIngredient } from "@/db/schema";

export default function DeleteConfirmModal({
  ingredient,
  onConfirm,
  onCancel,
}: {
  ingredient: MedicationActiveIngredient;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">
        Confirm Deletion?
      </h2>
      <table>
        <tbody>
          <tr>
            <td>Active Ingredient:</td>
            <td>{ingredient.name}</td>
          </tr>
          <tr>
            <td>Unit:</td>
            <td>{ingredient.unitOfMeasurement}</td>
          </tr>
          <tr>
            <td>Fall Below:</td>
            <td>{ingredient.fallBelow}</td>
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
