import { RHFInput } from "./RHF/RHFInput";

interface EditableCellProps {
  value: string | number | undefined;
  name: string;
  label?: string;
  type: "text" | "number";
  isEditing: boolean;
}

export default function EditableCell({
  value,
  name,
  label = "",
  type,
  isEditing,
}: EditableCellProps) {
  return (
    <>
      {isEditing ? <RHFInput type={type} name={name} label={label} /> : value}
    </>
  );
}
