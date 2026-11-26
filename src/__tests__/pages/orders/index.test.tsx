import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import OrdersPage from "@/pages/orders";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
} from "@/__tests__/utils/helper-functions";

// Hoisted so the mock factory and the tests share one typed object.
const mockTrpc = vi.hoisted(() => ({
  useUtils: vi.fn(() => ({
    ordersRouter: { listPending: { invalidate: vi.fn() } },
    medicationStockRouter: { invalidate: vi.fn() },
  })),
  ordersRouter: {
    listPending: { useQuery: vi.fn() },
    resolve: { useMutation: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const MOCK_VISITS = [
  {
    visitId: 7,
    visitDate: new Date("2026-10-07T23:19:00"),
    patientId: 1,
    patientName: "Alice Tan",
    patientImageUrl: "https://img/p/alice",
    villageCode: "TT",
    villageColorHex: "#27AE60",
    diagnoses: [
      { id: 1, category: "Musculoskeletal", details: "Back pain" },
      { id: 2, category: null, details: "Cough" },
    ],
    orders: [
      {
        id: 31,
        quantity: 10,
        dosageInstructions: "1 tab daily",
        activeIngredientName: "Paracetamol 500mg",
        unitOfMeasurement: "tablets",
        items: [
          {
            stockId: 101,
            brandName: "Panadol",
            expiry: new Date("2027-03-31T00:00:00"),
            location: "Shelf A",
            quantity: 4,
          },
          {
            stockId: 102,
            brandName: "Panadol",
            expiry: new Date("2027-12-31T00:00:00"),
            location: "Shelf B",
            quantity: 6,
          },
        ],
      },
      {
        id: 32,
        quantity: 3,
        dosageInstructions: "As needed",
        activeIngredientName: null,
        unitOfMeasurement: null,
        items: [],
      },
    ],
  },
  // A different patient seen between Alice's two visits, with no diagnoses.
  {
    visitId: 8,
    visitDate: new Date("2026-10-10T10:00:00"),
    patientId: 2,
    patientName: "Bob Lim",
    patientImageUrl: null,
    villageCode: "TT",
    villageColorHex: "#27AE60",
    diagnoses: [],
    orders: [
      {
        id: 34,
        quantity: 5,
        dosageInstructions: "1 tab after meals",
        activeIngredientName: "Ibuprofen 200mg",
        unitOfMeasurement: "tablets",
        items: [
          {
            stockId: 104,
            brandName: "Nurofen",
            expiry: new Date("2027-09-30T00:00:00"),
            location: "Shelf D",
            quantity: 5,
          },
        ],
      },
    ],
  },
  // Alice's second visit: its own diagnosis and order, on a later date.
  {
    visitId: 9,
    visitDate: new Date("2026-10-14T09:30:00"),
    patientId: 1,
    patientName: "Alice Tan",
    patientImageUrl: "https://img/p/alice",
    villageCode: "TT",
    villageColorHex: "#27AE60",
    diagnoses: [{ id: 3, category: "Respiratory", details: "Sore throat" }],
    orders: [
      {
        id: 33,
        quantity: 21,
        dosageInstructions: "1 cap three times daily",
        activeIngredientName: "Amoxicillin 500mg",
        unitOfMeasurement: "capsules",
        items: [
          {
            stockId: 103,
            brandName: "Amoxil",
            expiry: new Date("2027-06-30T00:00:00"),
            location: "Shelf C",
            quantity: 21,
          },
        ],
      },
    ],
  },
];

const mutate = vi.fn();

function mockList(result: Record<string, unknown>) {
  mockTrpc.ordersRouter.listPending.useQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...result,
  });
}

function getBodyRows() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").slice(1);
}

describe("OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpc.ordersRouter.resolve.useMutation.mockReturnValue({
      mutate,
      isPending: false,
    });
    mockList({ data: MOCK_VISITS });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the title and breadcrumbs", () => {
    render(<OrdersPage />);
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    assertBreadcrumbs(["Home", "Orders"]);
  });

  it("shows a loading spinner while orders load", () => {
    mockList({ isLoading: true });
    render(<OrdersPage />);
    assertLoadingSpinner("Loading orders...");
  });

  it("shows an error message when loading fails", () => {
    mockList({ isError: true });
    render(<OrdersPage />);
    expect(screen.getByText("An error has occurred!")).toBeInTheDocument();
  });

  it("shows an empty state when nothing is pending", () => {
    mockList({ data: [] });
    render(<OrdersPage />);
    expect(
      screen.getByText(
        "No pending orders. Orders placed during consults will appear here.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a visit's patient, diagnoses and prescriptions in one row", () => {
    // Given - Alice's first visit has two diagnoses and two pending orders
    render(<OrdersPage />);

    // Then - its row holds all of it
    const row = within(getBodyRows()[0]);

    expect(row.getByText("TT0001")).toBeInTheDocument();
    expect(row.getByText("Alice Tan")).toBeInTheDocument();

    expect(row.getByText("Diagnosis 1")).toBeInTheDocument();
    expect(row.getByText("Category: Musculoskeletal")).toBeInTheDocument();
    expect(row.getByText("Back pain")).toBeInTheDocument();
    expect(row.getByText("Diagnosis 2")).toBeInTheDocument();
    expect(row.getByText("Cough")).toBeInTheDocument();

    // Brands are deduplicated; each reserved stock gets an expiry-location-qty line
    expect(row.getByText("Paracetamol 500mg (Panadol)")).toBeInTheDocument();
    expect(
      row.getByText("31/03/2027 - Shelf A - 4 tablets"),
    ).toBeInTheDocument();
    expect(
      row.getByText("31/12/2027 - Shelf B - 6 tablets"),
    ).toBeInTheDocument();
    expect(row.getByText("1 tab daily")).toBeInTheDocument();

    // An order with no reserved stock still shows, flagged as such
    expect(row.getByText("Unknown medication")).toBeInTheDocument();
    expect(row.getByText("No stock reserved - 3")).toBeInTheDocument();
  });

  it("approves an order with the tick button", () => {
    render(<OrdersPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Approve Paracetamol 500mg" }),
    );
    expect(mutate).toHaveBeenCalledWith({ orderId: 31, status: "APPROVED" });
  });

  it("cancels an order with the cross button", () => {
    render(<OrdersPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel Paracetamol 500mg" }),
    );
    expect(mutate).toHaveBeenCalledWith({ orderId: 31, status: "CANCELLED" });
  });

  it("disables the buttons while an order is being resolved", () => {
    mockTrpc.ordersRouter.resolve.useMutation.mockReturnValue({
      mutate,
      isPending: true,
    });
    render(<OrdersPage />);
    expect(
      screen.getByRole("button", { name: "Approve Paracetamol 500mg" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancel Paracetamol 500mg" }),
    ).toBeDisabled();
  });

  describe("grouping by patient and visit date", () => {
    it("shows one row per visit, oldest visit first", () => {
      render(<OrdersPage />);

      const rows = getBodyRows();
      expect(rows).toHaveLength(3);

      expect(within(rows[0]).getByText("Alice Tan")).toBeInTheDocument();
      expect(within(rows[0]).getByText(/7 October 2026/)).toBeInTheDocument();

      expect(within(rows[1]).getByText("Bob Lim")).toBeInTheDocument();
      expect(within(rows[1]).getByText(/10 October 2026/)).toBeInTheDocument();

      expect(within(rows[2]).getByText("Alice Tan")).toBeInTheDocument();
      expect(within(rows[2]).getByText(/14 October 2026/)).toBeInTheDocument();
    });

    it("gives a patient with several visits a separate row for each visit date", () => {
      render(<OrdersPage />);

      const aliceRows = getBodyRows().filter((row) =>
        within(row).queryByText("Alice Tan"),
      );
      expect(aliceRows).toHaveLength(2);
      for (const row of aliceRows) {
        expect(within(row).getByText("TT0001")).toBeInTheDocument();
      }
      expect(
        within(aliceRows[0]).getByText(/7 October 2026/),
      ).toBeInTheDocument();
      expect(
        within(aliceRows[1]).getByText(/14 October 2026/),
      ).toBeInTheDocument();
    });

    it("shows only the diagnoses and orders made during that visit", () => {
      render(<OrdersPage />);
      const [firstVisit, , secondVisit] = getBodyRows().map((row) =>
        within(row),
      );

      // First visit: its own diagnoses and orders, none from the later visit
      expect(firstVisit.getByText("Back pain")).toBeInTheDocument();
      expect(
        firstVisit.getByText("Paracetamol 500mg (Panadol)"),
      ).toBeInTheDocument();
      expect(firstVisit.queryByText("Sore throat")).not.toBeInTheDocument();
      expect(
        firstVisit.queryByText("Amoxicillin 500mg (Amoxil)"),
      ).not.toBeInTheDocument();

      // Second visit: only what was made on 14 October
      expect(
        secondVisit.getByText("Category: Respiratory"),
      ).toBeInTheDocument();
      expect(secondVisit.getByText("Sore throat")).toBeInTheDocument();
      expect(
        secondVisit.getByText("Amoxicillin 500mg (Amoxil)"),
      ).toBeInTheDocument();
      expect(
        secondVisit.getByText("30/06/2027 - Shelf C - 21 capsules"),
      ).toBeInTheDocument();
      expect(
        secondVisit.getByText("1 cap three times daily"),
      ).toBeInTheDocument();
      expect(secondVisit.queryByText("Back pain")).not.toBeInTheDocument();
      expect(secondVisit.queryByText("Cough")).not.toBeInTheDocument();
      expect(
        secondVisit.queryByText("Paracetamol 500mg (Panadol)"),
      ).not.toBeInTheDocument();
      expect(
        secondVisit.queryByText("Unknown medication"),
      ).not.toBeInTheDocument();
    });

    it("numbers diagnoses from 1 within each visit", () => {
      render(<OrdersPage />);
      const secondVisit = within(getBodyRows()[2]);

      expect(secondVisit.getByText("Diagnosis 1")).toBeInTheDocument();
      expect(secondVisit.queryByText("Diagnosis 2")).not.toBeInTheDocument();
      expect(secondVisit.queryByText("Diagnosis 3")).not.toBeInTheDocument();
    });

    it("shows a placeholder for a visit with no diagnoses", () => {
      render(<OrdersPage />);
      const bobVisit = within(getBodyRows()[1]);

      expect(bobVisit.getByText("No diagnoses recorded")).toBeInTheDocument();
      expect(
        bobVisit.getByText("Ibuprofen 200mg (Nurofen)"),
      ).toBeInTheDocument();
    });

    it("resolves the order from the visit whose button was pressed", () => {
      render(<OrdersPage />);
      const secondVisit = within(getBodyRows()[2]);

      fireEvent.click(
        secondVisit.getByRole("button", { name: "Approve Amoxicillin 500mg" }),
      );
      expect(mutate).toHaveBeenCalledWith({ orderId: 33, status: "APPROVED" });

      fireEvent.click(
        secondVisit.getByRole("button", { name: "Cancel Amoxicillin 500mg" }),
      );
      expect(mutate).toHaveBeenCalledWith({ orderId: 33, status: "CANCELLED" });
    });
  });
});
