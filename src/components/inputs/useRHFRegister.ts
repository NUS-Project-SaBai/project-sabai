import { useFormContext } from "react-hook-form";

export function useRHFRegister(
  name: string,
  label: string,
  isRequired: boolean = false,
  registerOptions: Record<string, any> = {},
) {
  const { register } = useFormContext();
  const registerProps = register(name, {
    required: { message: `Missing ${label}!`, value: isRequired },
    ...registerOptions,
  });
  return registerProps;
}
