import Modal from "@/components/interactive/Modal";
import {
  MedicationStockWithBrandAndActiveIngredient,
  StockStatus,
} from "@/lib/utils/medication-stock";
import { Button } from "@/components/interactive/Button/Button";
import { useState } from "react";
import { medicationStatusValues } from "@/db/schema";

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
              onChange={(e) =>
                setSplits(
                  splits.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, location: e.target.value }
                      : item,
                  ),
                )
              }
            ></input>
            <select
              value={split.stockStatus!}
              onChange={(e) => {
                setSplits(
                  splits.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          ...item,
                          stockStatus: e.target.value as StockStatus,
                        }
                      : item,
                  ),
                );
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
                setSplits(
                  splits.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, quantity: parseInt(e.target.value) }
                      : item,
                  ),
                )
              }
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
        onClick={() => console.log(splits)}
        // TODO(separate PR): validate parent qty === sum(all child qty), then bulk mutate the splits
      />
    </Modal>
  );
}
