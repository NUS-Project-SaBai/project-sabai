import { RHFInput } from "./RHF/RHFInput";
import { RegisterOptions } from "react-hook-form";

interface EditableCellProps {
  value: string | number | undefined;
  name: string;
  label?: string;
  type: "text" | "number";
  isEditing: boolean;
  registerOptions?: RegisterOptions;
}

export default function EditableCell({
  value,
  name,
  label = "",
  type,
  isEditing,
  registerOptions = {},
}: EditableCellProps) {
  return (
    <>
      {isEditing ? (
        <RHFInput
          type={type}
          name={name}
          label={label}
          registerOptions={registerOptions}
        />
      ) : (
        value
      )}
    </>
  );
}
