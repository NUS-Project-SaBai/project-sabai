import { RHFDateInput } from "@/components/interactive/RHF/RHFDateInput";
import { FormProvider, useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
function Form({ submit }: { submit: (data: { date: string }) => void }) {
  const form = useForm({ defaultValues: { date: "01/01/2000" } });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(submit)}>
        <RHFDateInput name="date" label="Date" isRequired />
        <button type="submit">Save</button>
        <button
          type="button"
          onClick={() => form.reset({ date: "02/02/2002" })}
        >
          Reset
        </button>
      </form>
    </FormProvider>
  );
}
it("validates input and reflects reset values", async () => {
  const user = userEvent.setup();
  const submit = vi.fn();
  render(<Form submit={submit} />);
  const date = screen.getByPlaceholderText("DD/MM/YYYY");
  await user.clear(date);
  await user.type(date, "31/02/2024");
  await user.click(screen.getByText("Save"));
  expect(await screen.findByText(/Enter a valid date/)).toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
  await user.clear(date);
  await user.click(screen.getByText("Save"));
  expect(await screen.findByText("Missing Date!")).toBeInTheDocument();
  await user.click(screen.getByText("Reset"));
  expect(date).toHaveValue("02/02/2002");
  await user.click(screen.getByText("Save"));
  expect(submit).toHaveBeenCalledWith(
    { date: "02/02/2002" },
    expect.anything(),
  );
});
