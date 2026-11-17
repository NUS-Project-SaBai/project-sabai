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

  it("shows one row per visit with its patient, diagnoses and prescriptions", () => {
    // Given - one visit with two diagnoses and two pending orders
    render(<OrdersPage />);

    // Then - one row holds all of it
    const rows = getBodyRows();
    expect(rows).toHaveLength(1);
    const row = within(rows[0]);

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
});
