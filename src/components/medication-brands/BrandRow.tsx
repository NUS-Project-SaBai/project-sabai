import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import type { MedicationBrand } from "@/db/schema";

type BrandRowProps = MedicationBrand & {
  activeIngredientName: string;
  unitOfMeasurement: string;
};

export default function BrandRow(brand: BrandRowProps) {
  return (
    <TableRow>
      <TableCell>
        <span className="text-sm font-medium text-slate-900">{brand.id}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium text-slate-900">{brand.name}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium text-slate-900">
          {brand.activeIngredientName}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium text-slate-900">
          {brand.unitOfMeasurement}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium text-slate-900">
          {brand.remarks}
        </span>
      </TableCell>
    </TableRow>
  );
}
