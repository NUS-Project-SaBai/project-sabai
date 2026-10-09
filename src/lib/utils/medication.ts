import { RegisterOptions } from "react-hook-form";

/**
 * react-hook-form register options for the medication "fall below" threshold
 * field: parsed as a number and required to be positive.
 */
export const positiveNumberOptions: RegisterOptions = {
  valueAsNumber: true,
  min: {
    value: 1,
    message: "Please input only positive values.",
  },
  required: true,
};
