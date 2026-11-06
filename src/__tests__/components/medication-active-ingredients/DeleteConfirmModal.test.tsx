import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteConfirmModal from "@/components/medication-active-ingredients/DeleteConfirmModal";
import { MedicationActiveIngredient } from "@/db/schema";

const BASE_INGREDIENT: MedicationActiveIngredient = {
  id: 1,
  name: "Paracetamol 500mg",
  unitOfMeasurement: "tablets",
  fallBelow: 50,
  remarks: null,
};

function renderModal({
  ingredient = BASE_INGREDIENT,
  onConfirm = vi.fn(),
  onCancel = vi.fn(),
}: {
  ingredient?: MedicationActiveIngredient;
  onConfirm?: () => void;
  onCancel?: () => void;
} = {}) {
  render(
    <DeleteConfirmModal
      ingredient={ingredient}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe("DeleteConfirmModal", () => {
  describe("Rendering", () => {
    it("renders the title 'Confirm Deletion?'", () => {
      // Given: a modal is rendered with an ingredient
      renderModal();

      // Then: the heading is visible
      expect(
        screen.getByRole("heading", {
          name: "Confirm Deletion?",
          hidden: true,
        }),
      ).toBeInTheDocument();
    });

    it("displays the ingredient name, unit of measurement, and fallBelow", () => {
      // Given: an ingredient with known fields
      renderModal();

      // Then: all three fields are visible
      expect(screen.getByText("Paracetamol 500mg")).toBeInTheDocument();
      expect(screen.getByText("tablets")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("displays remarks when provided", () => {
      // Given: an ingredient that has remarks
      renderModal({
        ingredient: { ...BASE_INGREDIENT, remarks: "Handle with care" },
      });

      // Then: the remarks text is visible
      expect(screen.getByText("Handle with care")).toBeInTheDocument();
    });

    it("renders the remarks row without a value when remarks are absent", () => {
      // Given: an ingredient with no remarks
      renderModal({ ingredient: { ...BASE_INGREDIENT, remarks: null } });

      // Then: the label is present but no extra text follows
      expect(screen.getByText("Remarks:")).toBeInTheDocument();
    });
  });

  describe("Initial render", () => {
    it("does not invoke onConfirm or onCancel on mount", () => {
      // Given: fresh spy callbacks
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // When: the component mounts
      renderModal({ onConfirm, onCancel });

      // Then: neither callback has been called
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("Cancel button", () => {
    it("calls onCancel when clicked", async () => {
      // Given: the modal is rendered with spy callbacks
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      renderModal({ onConfirm, onCancel });

      // When: the Cancel button is clicked
      await user.click(
        screen.getByRole("button", { name: "Cancel", hidden: true }),
      );

      // Then: onCancel is invoked once and onConfirm is untouched
      expect(onCancel).toHaveBeenCalledOnce();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("Confirm button", () => {
    it("calls onConfirm when clicked", async () => {
      // Given: the modal is rendered with spy callbacks
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      renderModal({ onConfirm, onCancel });

      // When: the Confirm button is clicked
      await user.click(
        screen.getByRole("button", { name: "Confirm", hidden: true }),
      );

      // Then: onConfirm is invoked once and onCancel is untouched
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
