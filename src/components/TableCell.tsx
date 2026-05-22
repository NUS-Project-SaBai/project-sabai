import { ReactNode } from "react";

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export default function TableCell({
  children,
  className = "",
}: TableCellProps) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}