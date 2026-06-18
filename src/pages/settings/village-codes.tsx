import { useState, useEffect, ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import { useSaveOnWrite } from "@/hooks/useSaveOnWrite";
import { VillageCode, NewVillageCode } from "@/db/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import Modal from "@/components/interactive/Modal";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { toast } from "react-hot-toast";

const DEFAULT_FORM: NewVillageCode = {
  code: "",
  name: "",
  colorHex: "#3b82f6", // Default blue
  isVisible: true,
};

type FormFields = {
  id?: number;
  name: string;
  code: string;
  colorHex: string;
  isVisible: boolean | undefined;
};

function ChangeModal({
  onClose,
  activeForm,
}: {
  onClose: () => void;
  activeForm: FormFields | null;
}) {
  const utils = trpc.useUtils();
  const [formData, setFormData, clearFormData] = useSaveOnWrite<NewVillageCode>(
    "village-codes-form",
    DEFAULT_FORM,
    [], // No dependencies
  );

  const isEditing = !!(activeForm && activeForm.id);

  // only use the saved data when creating a village code
  const currentValues = isEditing
    ? activeForm
    : {
        name: formData.name,
        code: formData.code,
        colorHex: formData.colorHex,
        isVisible: formData.isVisible,
      };

  const form = useForm<FormFields>({
    values: currentValues,
  });

  // Useful link for subscription mechanism: https://react-hook-form.com/docs/useform/subscribe
  useEffect(() => {
    if (isEditing) return;

    return form.subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        setFormData({
          name: values?.name ?? DEFAULT_FORM.name,
          code: values?.code ?? DEFAULT_FORM.code,
          colorHex: values?.colorHex ?? DEFAULT_FORM.colorHex,
          isVisible: values?.isVisible ?? DEFAULT_FORM.isVisible,
        });
      },
    });
  }, [form, isEditing, setFormData]);

  const createMutation = trpc.villageCodesRouter.create.useMutation({
    onSuccess: () => {
      utils.villageCodesRouter.list.invalidate();
      form.reset();
      clearFormData();
      onClose();
      toast.success("Village code created!");
    },
  });

  const updateMutation = trpc.villageCodesRouter.update.useMutation({
    onSuccess: () => {
      utils.villageCodesRouter.list.invalidate();
      form.reset();
      onClose();
      toast.success("Village code updated!");
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const handleSubmit: SubmitHandler<FormFields> = async (data) => {
    if (activeForm && activeForm.id) {
      updateMutation.mutate({
        ...data,
        id: activeForm.id,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">
        {activeForm?.id ? "Edit Village Code" : "New Village Code"}
      </h2>
      <FormProvider {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }}
        >
          <RHFInput
            name="code"
            label="Code"
            type="text"
            placeholder="e.g. V001"
            defaultValue={DEFAULT_FORM.code}
          />
          <RHFInput
            name="name"
            label="Name"
            type="text"
            placeholder="Central Village"
            defaultValue={DEFAULT_FORM.name}
          />
          <div className="flex gap-2 mt-1 items-center">
            <RHFInput
              name="colorHex"
              label="Color"
              type="color"
              className="w-full"
              defaultValue={DEFAULT_FORM.colorHex}
            />
            <input
              defaultValue={DEFAULT_FORM.colorHex}
              id="color-value"
              readOnly
              className="h-10 block w-full rounded-md border border-slate-300 px-3 bg-slate-50 text-slate-500"
            />
          </div>
          <RHFInput
            name="isVisible"
            label="Is Visible?"
            type="checkbox"
            className="flex flex-row-reverse"
          />
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
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
      </FormProvider>
    </Modal>
  );
}

function Wrapper({ children }: { children: ReactNode }) {
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
        {children}
      </div>
    </div>
  );
}

function Content({
  showHidden,
  openEdit,
}: {
  showHidden: boolean;
  openEdit: (code: VillageCode) => void;
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
          <RowContent code={code} openEdit={openEdit} key={code.id} />
        ))}
      </tbody>
    </table>
  );
}

function VillageCodesPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeForm, setActiveForm] = useState<FormFields | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const closeForm = () => {
    setIsEditing(false);
    setActiveForm(null);
  };

  const openEdit = (code: VillageCode) => {
    setIsEditing(true);
    setActiveForm(code);
  };

  return (
    <Wrapper>
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
              setIsEditing(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            New Village Code
          </button>
        </div>
      </div>
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          {isEditing && (
            <ChangeModal onClose={closeForm} activeForm={activeForm} />
          )}
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <Content openEdit={openEdit} showHidden={showHidden} />
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

function RowContent({
  code,
  openEdit,
}: {
  code: VillageCode;
  openEdit: (code: VillageCode) => void;
}) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.villageCodesRouter.delete.useMutation({
    onSuccess: () => {
      utils.villageCodesRouter.list.invalidate();
      toast.success("Village code deleted!");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this code?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
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
      </TableCell>
    </TableRow>
  );
}

export default VillageCodesPage;
