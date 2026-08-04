import Modal from "@/components/interactive/Modal";
import {
  MedicationStockWithBrandAndActiveIngredient,
  StockStatus,
} from "@/lib/utils/medication-stock";
import { Button } from "@/components/interactive/Button/Button";
import { useState } from "react";
import { medicationStatusValues } from "@/db/schema";
import { trpc } from "@/utils/trpc";
import toast from "react-hot-toast";

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
    if (splits.length < 2) {
      toast.error("Must have at least 2 splits!");
      return;
    }

    const quantity = splits.reduce(
      (accumulator, current) => accumulator + current.quantity,
      0,
    );

    if (quantity != stock.quantity) {
      toast.error("Child stock quantity does not equal parent stock quantity!");
      return;
    }

    const payload = splits.map((split) => ({
      location: split.location,
      stockStatus: split.stockStatus,
      quantity: split.quantity,
      remarks: split.remarks ?? undefined,
    }));
    splitMutation.mutate({ splits: payload, parentId: stock.id });
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
      {splits.map((split, index) => (
        <div key={`${split.id}-${index}`}>
          <div className="flex justify-between">
            <h3>Split {index + 1}</h3>
            <button onClick={() => removeSplit(index)}>-</button>
          </div>
          <div className="flex flex-row justify-evenly">
            <input
              type="text"
              value={split.location ? split.location : ""}
              onChange={(e) => updateSplit(index, { location: e.target.value })}
            ></input>
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
            <input
              type="number"
              value={split.quantity}
              min="1"
              onChange={(e) =>
                updateSplit(index, { quantity: parseInt(e.target.value) })
              }
            />
            <input
              type="text"
              value={split.remarks ? split.remarks : ""}
              onChange={(e) => {
                updateSplit(index, { remarks: e.target.value });
              }}
            />
          </div>
          <hr></hr>
        </div>
      ))}
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
        // TODO(separate PR): validate parent qty === sum(all child qty), then bulk mutate the splits
      />
    </Modal>
  );
}
