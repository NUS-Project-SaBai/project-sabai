import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteConfirmModal from "@/components/medication-brands/DeleteConfirmModal";
import type { MedicationBrand } from "@/db/schema";

type BrandWithIngredient = MedicationBrand & {
  activeIngredientName: string;
  unitOfMeasurement: string;
};

const BASE_BRAND: BrandWithIngredient = {
  id: 1,
  name: "Panadol",
  activeIngredientId: 1,
  activeIngredientName: "Paracetamol",
  unitOfMeasurement: "mg",
  remarks: null,
};

function renderModal({
  brand = BASE_BRAND,
  onConfirm = vi.fn(),
  onCancel = vi.fn(),
}: {
  brand?: BrandWithIngredient;
  onConfirm?: () => void;
  onCancel?: () => void;
} = {}) {
  render(
    <DeleteConfirmModal
      brand={brand}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );

  return { onConfirm, onCancel };
}

describe("DeleteConfirmModal", () => {
  describe("Rendering", () => {
    it("renders the title 'Confirm Deletion?'", () => {
      renderModal();

      expect(
        screen.getByRole("heading", {
          name: "Confirm Deletion?",
          hidden: true,
        }),
      ).toBeInTheDocument();
    });

    it("displays the brand name, active ingredient name, and unit", () => {
      renderModal();

      expect(screen.getByText("Panadol")).toBeInTheDocument();
      expect(screen.getByText("Paracetamol")).toBeInTheDocument();
      expect(screen.getByText("mg")).toBeInTheDocument();
    });

    it("displays remarks when provided", () => {
      renderModal({
        brand: {
          ...BASE_BRAND,
          remarks: "Handle with care",
        },
      });

      expect(screen.getByText("Handle with care")).toBeInTheDocument();
    });

    it("renders the remarks row without a value when remarks are absent", () => {
      renderModal({
        brand: {
          ...BASE_BRAND,
          remarks: null,
        },
      });

      expect(screen.getByText("Remarks:")).toBeInTheDocument();
    });
  });

  describe("Initial render", () => {
    it("does not invoke onConfirm or onCancel on mount", () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      renderModal({ onConfirm, onCancel });

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("Cancel button", () => {
    it("calls onCancel when clicked", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      renderModal({ onConfirm, onCancel });

      await user.click(
        screen.getByRole("button", {
          name: "Cancel",
          hidden: true,
        }),
      );

      expect(onCancel).toHaveBeenCalledOnce();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("Confirm button", () => {
    it("calls onConfirm when clicked", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      renderModal({ onConfirm, onCancel });

      await user.click(
        screen.getByRole("button", {
          name: "Confirm",
          hidden: true,
        }),
      );

      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
