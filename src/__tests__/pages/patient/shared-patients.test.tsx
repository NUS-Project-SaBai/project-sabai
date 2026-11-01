import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, type TRPCLink } from "@trpc/client";
import { createTRPCReact, getQueryKey } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import PatientsBasePage from "@/pages/patient";
import type { AppRouter } from "@/server/routers/_app";
import type {
  PatientsRouterListWithLatestVisitItem,
  PatientsRouterListWithLatestVisitOutput,
} from "@/utils/trpc-types";

const testTrpc = createTRPCReact<AppRouter>();
const patient: PatientsRouterListWithLatestVisitItem = {
  id: 1,
  name: "Somchai Phuket",
  identificationNumber: "AB123456",
  contactNo: "1234567",
  gender: "male",
  dateOfBirth: new Date("1990-01-01"),
  drugAllergy: "None",
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImagePublicId: "",
  patientImageUrl: null,
  rekognitionFaceId: null,
  villageCode: "PC",
  villageColorHex: "#ff0000",
};
const patientListKey = getQueryKey(
  testTrpc.patientsRouter.listWithLatestVisit,
  undefined,
  "query",
);
const clients: QueryClient[] = [];

function renderSharedPage(
  handleOperation: (path: string, input: unknown) => unknown | Promise<unknown>,
) {
  const requests: string[] = [];
  const link: TRPCLink<AppRouter> =
    () =>
    ({ op }) =>
      observable((observer) => {
        requests.push(op.path);
        let active = true;
        Promise.resolve()
          .then(() => handleOperation(op.path, op.input))
          .then(
            (data) => {
              if (!active) return;
              observer.next({ result: { data } });
              observer.complete();
            },
            (error) => {
              if (active) observer.error(TRPCClientError.from(error));
            },
          );
        return () => {
          active = false;
        };
      });
  const client = testTrpc.createClient({ links: [link] });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(queryClient);
  const view = render(
    <QueryClientProvider client={queryClient}>
      <testTrpc.Provider client={client} queryClient={queryClient}>
        <PatientTopMenuLayout>
          <PatientsBasePage />
        </PatientTopMenuLayout>
      </testTrpc.Provider>
    </QueryClientProvider>,
  );
  return { ...view, requests, queryClient };
}

function searchFor(query: string) {
  fireEvent.change(screen.getByPlaceholderText("Search patients..."), {
    target: { value: query },
  });
}

function searchResultIds() {
  return screen.queryAllByRole("link").flatMap((link) => {
    const match = link.getAttribute("href")?.match(/^\/patient\/(\d+)$/);
    return match ? [Number(match[1])] : [];
  });
}

function tableNames() {
  return within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[1].textContent);
}

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe("shared patient query", () => {
  it("shares one in-flight fetch and sorts only the table's copy", async () => {
    const source = [
      { ...patient, id: 12, name: "Nok" },
      { ...patient, id: 2, name: "Niran" },
      patient,
    ];
    let resolvePatients!: (
      value: PatientsRouterListWithLatestVisitOutput,
    ) => void;
    const pending = new Promise<PatientsRouterListWithLatestVisitOutput>(
      (resolve) => {
        resolvePatients = resolve;
      },
    );
    const { requests, queryClient } = renderSharedPage(() => pending);
    expect(screen.getByText("Loading patients...")).toBeInTheDocument();
    searchFor("PC1");
    await waitFor(() =>
      expect(screen.getAllByText("Loading patients...")).toHaveLength(2),
    );
    resolvePatients(source);
    await waitFor(() => expect(searchResultIds()[0]).toBe(1));
    expect(tableNames()).toEqual(["Somchai Phuket", "Niran", "Nok"]);
    expect(
      queryClient
        .getQueryData<PatientsRouterListWithLatestVisitOutput>(patientListKey)
        ?.map(({ id }) => id),
    ).toEqual([12, 2, 1]);
    expect(source.map(({ id }) => id)).toEqual([12, 2, 1]);
    expect(requests).toEqual(["patientsRouter.listWithLatestVisit"]);
    expect(new Set(searchResultIds()).size).toBe(searchResultIds().length);
  });

  it("shows errors in both consumers instead of treating a failure as no matches", async () => {
    const { requests } = renderSharedPage(() => {
      throw new Error("Test query failed");
    });
    searchFor("PC1");
    expect(
      await screen.findByText("An error has occurred!"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Unable to load patients. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No matching patients found."),
    ).not.toBeInTheDocument();
    expect(requests).toEqual(["patientsRouter.listWithLatestVisit"]);
  });

  it("handles an empty patient list in both consumers", async () => {
    renderSharedPage(() => []);
    searchFor("PC1");
    expect(
      await screen.findByText(
        "No patients found. Seed the database or add a new record.",
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("No matching patients found."),
    ).toBeInTheDocument();
  });

  it("preserves all search modes when reading the shared cache", async () => {
    const { requests } = renderSharedPage(() => [patient]);
    await screen.findByRole("table");
    for (const query of [
      "Somchai Phuket",
      "Somch",
      "omch",
      "Somchaj",
      "Phuk Somch",
      "0001",
      "001",
      "PC0001",
      "PC1",
      "PC0",
      "PD0001",
      "AB123456",
      "AB123457",
      "  pC1  ",
      "PC",
      " pc ",
    ]) {
      searchFor(query);
      await waitFor(() => expect(searchResultIds(), query).toEqual([1]));
      searchFor("");
      await waitFor(() => expect(searchResultIds(), query).toEqual([]));
    }
    for (const query of ["PD", "zzzzzyyyyyxxxx", "   "]) {
      searchFor(query);
      if (query.trim()) {
        expect(
          await screen.findByText("No matching patients found."),
        ).toBeInTheDocument();
      } else {
        await waitFor(() =>
          expect(
            screen.queryByText("No matching patients found."),
          ).not.toBeInTheDocument(),
        );
      }
      expect(searchResultIds(), query).toEqual([]);
    }
    expect(requests).toEqual(["patientsRouter.listWithLatestVisit"]);
  }, 20000);
});
