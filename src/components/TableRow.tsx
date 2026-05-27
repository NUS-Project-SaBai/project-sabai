import { ReactNode } from "react";

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Table row component rendering a `<tr>` element with hover effects and optional click handling.
 *
 * @param {ReactNode} children - The table cells or other content to display within the row
 * @param {string} [className=""] - Additional CSS classes to apply to the row
 * @param {() => void} [onClick] - Optional click handler function for interactive rows
 *
 * @example
 * ```tsx
 * <TableRow onClick={() => navigate(`/patient/${id}`)}>
 *   <TableCell>John Doe</TableCell>
 *   <TableCell>25</TableCell>
 * </TableRow>
 * ```
 */
export default function TableRow({
  children,
  className = "",
  onClick,
}: TableRowProps) {
  return (
    <tr
      className={`hover:bg-slate-50 transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
