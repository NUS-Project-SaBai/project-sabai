import { cleanup, render, screen, within } from "@testing-library/react";
import { PatientCard, PatientCardList } from "@/components/PatientCard";

describe("PatientCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the patient's photo, code, name and actions in a list item", () => {
    // Given - a patient card with an action inside a card list
    render(
      <PatientCardList>
        <PatientCard
          pictureUrl="https://img/p/alice"
          patientCode="SB0012"
          name="Alice Tan"
        >
          <button type="button">Start Consult</button>
        </PatientCard>
      </PatientCardList>,
    );
    // Then - the card is a list item with the photo, code, name and action
    const card = within(screen.getByRole("listitem"));
    expect(card.getByAltText("Patient Photo")).toHaveAttribute(
      "src",
      "https://img/p/alice",
    );
    expect(card.getByText("SB0012")).toBeInTheDocument();
    expect(card.getByText("Alice Tan")).toBeInTheDocument();
    expect(
      card.getByRole("button", { name: "Start Consult" }),
    ).toBeInTheDocument();
  });

  it("falls back to the default photo when the patient has none", () => {
    // Given - a patient without a photo
    render(
      <PatientCardList>
        <PatientCard pictureUrl={null} patientCode="SB0013" name="Bob Lim" />
      </PatientCardList>,
    );
    // Then - the default profile image shows
    expect(screen.getByAltText("Patient Photo")).toHaveAttribute(
      "src",
      "/default-profile.webp",
    );
  });

  it("hides the card list from the md breakpoint up", () => {
    // Given - an empty card list
    render(<PatientCardList>{null}</PatientCardList>);
    // Then - it is hidden on tablet and desktop, where the table shows
    expect(screen.getByRole("list")).toHaveClass("md:hidden");
  });
});
