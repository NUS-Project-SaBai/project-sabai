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
            <div
              key={item.name}
              className="relative p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 transition"
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <item.icon aria-hidden className="h-6 w-6 text-indigo-800" />
                <Link
                  href={item.href}
                  className="after:absolute after:inset-0 focus:outline-none"
                >
                  {item.name}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
