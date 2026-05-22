import { ReactNode } from "react";

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

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
