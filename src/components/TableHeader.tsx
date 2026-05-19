interface TableHeaderProps {
  headers: string[];
  className?: string;
}

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
            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
