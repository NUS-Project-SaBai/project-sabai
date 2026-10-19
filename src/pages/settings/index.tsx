import Link from "next/link";
import { MdOutlineLocationOn } from "react-icons/md";
import PageHeader from "@/components/PageHeader";
import { paths } from "@/utils/paths";

const settingsItems = [
  {
    name: "Village Codes",
    href: paths.settingsVillageCodes(),
    icon: MdOutlineLocationOn,
    description:
      "Add, edit or hide village codes and the colours used to tag patients.",
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
          title="Settings"
          description="Manage configuration for this clinic deployment."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <item.icon className="h-6 w-6 text-indigo-800" />
                {item.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
