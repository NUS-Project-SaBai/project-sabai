import { RHFInput } from "./RHF/RHFInput";
import { RHFTextArea } from "./RHF/RHFTextArea";
import { RegisterOptions } from "react-hook-form";

interface EditableCellProps {
  value: string | number | undefined;
  name: string;
  label?: string;
  type: "text" | "number";
  isEditing: boolean;
  registerOptions?: RegisterOptions;
  /**
   * Edit long free-text fields (such as remarks) in a short, scrollable
   * `<textarea>` instead of a single-line input. When viewing, the value
   * still wraps fully within the table cell.
   */
  multiline?: boolean;
}

export default function EditableCell({
  value,
  name,
  label = "",
  type,
  isEditing,
  registerOptions = {},
  multiline = false,
}: EditableCellProps) {
  if (isEditing) {
    return multiline ? (
      <RHFTextArea
        name={name}
        label={label}
        rows={2}
        registerOptions={registerOptions}
      />
    ) : (
      <RHFInput
        type={type}
        name={name}
        label={label}
        registerOptions={registerOptions}
      />
    );
  }

  return <>{value}</>;
}
