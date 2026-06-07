import { render, screen, waitFor, within } from "@testing-library/react";

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

/**
 * Asserts that the breadcrumbs are rendered with the correct length and matches the text content of the params in the same order.
 * @param crumbs An array of strings matching the textcontent of each element in the BreadCrumb.
 */
export function assertBreadcrumbs(crumbs: string[]) {
  const nav = screen.getByRole("navigation");
  expect(nav).toBeInTheDocument();

  const links = within(nav).getAllByRole("link");

  expect(links).toHaveLength(crumbs.length - 1);

  for (let i = 0; i < crumbs.length - 1; i++) {
    expect(links[i]).toHaveTextContent(crumbs[i]);
  }

  const lastChild = nav.lastChild;
  expect(lastChild?.textContent).toEqual(crumbs[crumbs.length - 1]);
}
