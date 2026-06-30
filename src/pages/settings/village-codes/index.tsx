import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { VillageCode } from "@/db/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import DeleteModal from "@/components/village-codes/DeleteModal";
import ChangeModal from "@/components/village-codes/ChangeModal";
import { FormFields } from "@/lib/utils/villageCodeTypes";
import { Button } from "@/components/interactive/Button/Button";

function Content({
  showHidden,
  openEdit,
  openDelete,
}: {
  showHidden: boolean;
  openEdit: (code: VillageCode) => void;
  openDelete: (code: VillageCode) => void;
}) {
  const { data: codes, isLoading } = trpc.villageCodesRouter.list.useQuery({
    includeHidden: showHidden,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <table className="min-w-full divide-y divide-slate-200">
      <TableHeader headers={["Code", "Name", "Color", "Status", "actions"]} />
      <tbody className="divide-y divide-slate-200 bg-white">
        {codes?.map((code: VillageCode) => (
          <TableRow key={code.id}>
            <TableCell>{code.code}</TableCell>
            <TableCell>{code.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border border-slate-200 shadow-sm"
                  style={{ backgroundColor: code.colorHex }}
                />
                <span className="text-slate-500 font-mono text-xs">
                  {code.colorHex}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {code.isVisible ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                  Hidden
                </span>
              )}
            </TableCell>
            <TableCell>
              <button
                onClick={() => {
                  openEdit(code);
                }}
                className="mr-4 bg-indigo-600 text-white px-4 py-1 rounded-lg font-medium hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={() => openDelete(code)}
                className="bg-red-700 flex-1 text-white px-4 py-1 rounded-lg font-medium hover:bg-red-800"
              >
                Delete
              </button>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </table>
  );
}

function VillageCodesPage() {
  const [activeForm, setActiveForm] = useState<FormFields | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [mode, setMode] = useState<"editing" | "deleting" | null>(null);

  const openEdit = (code: VillageCode) => {
    setMode("editing");
    setActiveForm(code);
  };

  const openDelete = (code: VillageCode) => {
    setMode("deleting");
    setActiveForm(code);
  };

  const closeModal = () => {
    setMode(null);
    setActiveForm(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Settings" },
            { label: "Village Codes" },
          ]}
        />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Village Codes</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="rounded border-slate-300"
              />
              Show Hidden
            </label>
            <button
              onClick={() => {
                setMode("editing");
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              New Village Code
            </button>
          </div>
        </div>
        <div className="min-h-screen bg-slate-50 p-8">
          <div className="max-w-5xl mx-auto">
            {mode === "editing" && (
              <ChangeModal onClose={closeModal} activeForm={activeForm} />
            )}
            {mode === "deleting" && (
              <DeleteModal onClose={closeModal} activeForm={activeForm} />
            )}
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
              <Content
                openEdit={openEdit}
                openDelete={openDelete}
                showHidden={showHidden}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VillageCodesPage;
