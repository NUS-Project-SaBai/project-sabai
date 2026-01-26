import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { withAuth } from "@/lib/auth";
import { VillageCode, NewVillageCode } from "@/db/schema";
import Link from "next/link";

const DEFAULT_FORM: NewVillageCode = {
  code: "",
  name: "",
  colorHex: "#3b82f6", // Default blue
  isVisible: true,
};

function VillageCodesPage() {
  // 1. Local State
  const [showHidden, setShowHidden] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<NewVillageCode>(DEFAULT_FORM);

  // 2. Data Fetching
  const utils = trpc.useUtils();
  const { data: codes, isLoading } = trpc.villageCodeRouter.list.useQuery({
    includeHidden: showHidden,
  });

  // 3. Mutations
  const createMutation = trpc.villageCodeRouter.create.useMutation({
    onSuccess: () => {
      utils.villageCodeRouter.list.invalidate();
      closeForm();
    },
  });

  const updateMutation = trpc.villageCodeRouter.update.useMutation({
    onSuccess: () => {
      utils.villageCodeRouter.list.invalidate();
      closeForm();
    },
  });

  const deleteMutation = trpc.villageCodeRouter.delete.useMutation({
    onSuccess: () => utils.villageCodeRouter.list.invalidate(),
  });

  // 4. Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      updateMutation.mutate({
        id: formData.id,
        name: formData.name,
        colorHex: formData.colorHex,
        isVisible: formData.isVisible,
      });
    } else {
      createMutation.mutate({
        code: formData.code,
        name: formData.name,
        colorHex: formData.colorHex,
        isVisible: formData.isVisible,
      });
    }
  };

  const openEdit = (code: VillageCode) => {
    setFormData(code);
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    setFormData(DEFAULT_FORM);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this code?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            Home
          </Link>
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-slate-500">Settings</span>
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-slate-900 font-medium">Village Codes</span>
        </nav>

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
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              New Village Code
            </button>
          </div>
        </div>

        {/* Form Modal (Simplified as inline for MVP) */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {formData.id ? "Edit Village Code" : "New Village Code"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!formData.id && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Code
                    </label>
                    <input
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
                      placeholder="e.g. V001"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Central Village"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Color
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.colorHex}
                      onChange={(e) =>
                        setFormData({ ...formData, colorHex: e.target.value })
                      }
                      className="h-10 w-14 rounded cursor-pointer border border-slate-300 p-1"
                    />
                    <input
                      value={formData.colorHex}
                      readOnly
                      className="block w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isVisible: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    Is Visible?
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {codes?.map((code: VillageCode) => (
                  <tr key={code.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {code.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {code.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-slate-200 shadow-sm"
                          style={{ backgroundColor: code.colorHex }}
                        />
                        <span className="text-slate-500 font-mono text-xs">
                          {code.colorHex}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {code.isVisible ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(code)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(VillageCodesPage);
