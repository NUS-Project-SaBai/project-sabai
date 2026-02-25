import { RegisterOptions, useFormContext } from "react-hook-form";

export function useRHFRegister(
  name: string,
  label: string,
  isRequired: boolean = false,
  registerOptions: RegisterOptions = {},
) {
  const { register } = useFormContext();
  const registerProps = register(name, {
    required: { message: `Missing ${label}!`, value: isRequired },
    ...registerOptions,
  });
  return registerProps;
}
