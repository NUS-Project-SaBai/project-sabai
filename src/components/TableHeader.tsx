interface TableHeaderProps {
  headers: string[];
  className?: string;
}

/**
 * Table header component rendering a `<thead>` element with header cells.
 *
 * @param {string[]} headers - Array of header text strings to display as column headers
 * @param {string} [className=""] - Additional CSS classes to apply to the thead element
 *
 * @example
 * ```tsx
 * <TableHeader
 *   headers={['Name', 'Age', 'Status']}
 *   className="border-b"
 * />
 * ```
 */
export default function TableHeader({
  headers,
  className = "",
}: TableHeaderProps) {
  return (
    <thead className={`bg-slate-50 ${className}`}>
      <tr>
        {headers.map((header, index) => (
          <th
            key={index}
            className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
