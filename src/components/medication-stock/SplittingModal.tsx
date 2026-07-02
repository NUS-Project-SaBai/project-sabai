import Modal from "@/components/interactive/Modal";
import { MedicationStockWithBrandAndActiveIngredient } from "@/lib/utils/medication-stock";

export default function SplittingModal({
  onClose,
  stock,
}: {
  onClose: () => void;
  stock: MedicationStockWithBrandAndActiveIngredient;
}) {
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Split Stock</h2>
      <table>
        <tbody>
          <tr>
            <td>Location:</td>
            <td>{stock.location}</td>
          </tr>
          <tr>
            <td>Active Ingredient</td>
            <td>{stock.medicationActiveIngredientName}</td>
          </tr>
          <tr>
            <td>Brand Id</td>
            <td>{stock.medicationBrandName}</td>
          </tr>
          <tr>
            <td>Quantity:</td>
            <td>{stock.quantity}</td>
          </tr>
          <tr>
            <td>Status:</td>
            <td>{stock.stockStatus}</td>
          </tr>
        </tbody>
      </table>
    </Modal>
  );
}
