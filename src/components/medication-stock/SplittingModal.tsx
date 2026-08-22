import Modal from "@/components/interactive/Modal";
import {
  MedicationStockWithBrandAndActiveIngredient,
  StockStatus,
} from "@/types/medication-stock";
import { Button } from "@/components/interactive/Button/Button";
import { useState } from "react";
import { medicationStatusValues } from "@/db/schema/pharmacy";
import { trpc } from "@/utils/trpc";
import toast from "react-hot-toast";
import { validateSplits } from "@/lib/utils/medication-stock";

export default function SplittingModal({
  onClose,
  stock,
}: {
  onClose: () => void;
  stock: MedicationStockWithBrandAndActiveIngredient;
}) {
  const [splits, setSplits] = useState<
    MedicationStockWithBrandAndActiveIngredient[]
  >([]);

  function removeSplit(remove: number) {
    setSplits(splits.filter((item, index) => index !== remove));
  }

  const utils = trpc.useUtils();

  const splitMutation = trpc.medicationStockRouter.createSplits.useMutation({
    onSuccess: () => {
      toast.success("Successfully split!");
      utils.medicationStockRouter.listWithBrandAndActiveIngredient.invalidate();
      onClose();
    },
    onError: (err) => {
      console.error(err);
      toast.error("An error has occurred.");
    },
  });

  function updateSplit(index: number, patch: object) {
    const newSplits = splits.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            ...patch,
          }
        : item,
    );

    setSplits(newSplits);
  }

  function handleSubmit() {
    const payload = splits.map((split) => ({
      location: split.location,
      stockStatus: split.stockStatus,
      quantity: split.quantity,
      remarks: split.remarks ?? undefined,
    }));

    const validationResults = validateSplits(payload, stock.quantity);

    if (validationResults.success) {
      splitMutation.mutate({ splits: payload, parentId: stock.id });
      return;
    }

    toast.error(validationResults.message);
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Split Stock</h2>
      <h3 className="text-l font-bold mb-4">Parent stock details</h3>
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
            <td>Brand Name</td>
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
          <tr>
            <td>Remarks:</td>
            <td>{stock.remarks}</td>
          </tr>
        </tbody>
      </table>
      <h3 className="text-l font-bold mb-4 mt-4">Child stock details</h3>
      {splits.length === 0 && "No splits added, add a split to begin."}
      {splits.length > 0 && (
        <table>
          <thead className="text-center">
            <tr>
              <th>#</th>
              <th>Location</th>
              <th>Status</th>
              <th>Qty</th>
              <th>Remarks</th>
              <th className="pl-2">-</th>
            </tr>
          </thead>
          <tbody>
            {splits.map((split, index) => (
              <tr key={`${split.id}-${index}`}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    value={split.location ? split.location : ""}
                    onChange={(e) =>
                      updateSplit(index, { location: e.target.value })
                    }
                    className="text-right"
                  ></input>
                </td>
                <td>
                  <select
                    value={split.stockStatus!}
                    onChange={(e) => {
                      updateSplit(index, {
                        stockStatus: e.target.value as StockStatus,
                      });
                    }}
                  >
                    {medicationStatusValues.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={split.quantity}
                    min="1"
                    onChange={(e) =>
                      updateSplit(index, { quantity: parseInt(e.target.value) })
                    }
                    className="text-right"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={split.remarks ? split.remarks : ""}
                    onChange={(e) => {
                      updateSplit(index, { remarks: e.target.value });
                    }}
                  />
                </td>
                <td className="pl-2">
                  <button onClick={() => removeSplit(index)}>-</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Button
        title="Add Split"
        colour="indigo"
        onClick={() => setSplits([...splits, stock])}
        className="my-4"
      />
      <Button
        title="Confirm"
        colour="emerald"
        onClick={handleSubmit}
        disabled={splitMutation.isPending}
      />
    </Modal>
  );
}
