import { ReactNode } from "react";
import Breadcrumbs, { BreadcrumbItem } from "@/components/Breadcrumbs";

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="w-full mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>
        {actions}
      </div>
    </div>
  );
}
