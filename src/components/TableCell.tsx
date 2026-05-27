import { ReactNode } from "react";

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Table cell component rendering a `<td>` element with consistent padding and styling.
 * @param {ReactNode} children - The content to display within the table cell
 * @param {string} [className=""] - Additional CSS classes to apply to the cell
 *
 * @example
 * ```tsx
 * <TableCell className="text-center">
 *   Patient Name
 * </TableCell>
 * ```
 */
export default function TableCell({
  children,
  className = "",
}: TableCellProps) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>
  );
}
