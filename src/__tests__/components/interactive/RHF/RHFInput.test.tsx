import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

/** Wraps children in a FormProvider, as RHFInput requires a form context. */
function FormWrapper({ children }: { children: ReactNode }) {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
}

function renderNumberInput() {
  return render(
    <FormWrapper>
      <RHFInput name="amount" label="Amount" type="number" />
    </FormWrapper>,
  );
}

describe("RHFInput numeric validation", () => {
  it("blocks the 'e' character on keydown", async () => {
    const user = userEvent.setup();
    renderNumberInput();

    const input = screen.getByLabelText(/Amount/) as HTMLInputElement;
    await user.type(input, "12e3");

    expect(input.value).toBe("123");
  });

  it("blocks the 'E' character on keydown", async () => {
    const user = userEvent.setup();
    renderNumberInput();

    const input = screen.getByLabelText(/Amount/) as HTMLInputElement;
    await user.type(input, "1E2");

    expect(input.value).toBe("12");
  });

  it("still calls a user-provided onKeyDown handler", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <FormWrapper>
        <RHFInput
          name="amount"
          label="Amount"
          type="number"
          onKeyDown={onKeyDown}
        />
      </FormWrapper>,
    );

    await user.type(screen.getByLabelText(/Amount/), "5");

    expect(onKeyDown).toHaveBeenCalled();
  });

  it("does not block letters for text inputs", async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper>
        <RHFInput name="note" label="Note" type="text" />
      </FormWrapper>,
    );

    const input = screen.getByLabelText(/Note/) as HTMLInputElement;
    await user.type(input, "NKDA");

    expect(input.value).toBe("NKDA");
  });
});
