import { render, screen, waitFor } from "@testing-library/react";

/**
 * Asserts that the LoadingSpinner component is being used.
 * @param text Message displayed on the LoadingSpinner
 */
export function assertLoadingSpinner(text: string) {
  const element = screen.getByText(text);
  expect(element.tagName).toBe("DIV");
  expect(element.firstChild).toHaveClass("animate-spin");

  expect(screen.getByText(text)).toBeInTheDocument();
}
