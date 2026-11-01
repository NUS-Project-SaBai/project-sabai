import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, type TRPCLink } from "@trpc/client";
import { createTRPCReact, getQueryKey } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import EditPatientForm from "@/components/patient/EditPatientForm";
import RegistrationPage from "@/components/scanFace/RegistrationPage";
import MatchingPatients from "@/components/scanFace/MatchingPatients";
import PatientsBasePage from "@/pages/patient";
import type { AppRouter } from "@/server/routers/_app";
import type {
  PatientsRouterListWithLatestVisitItem,
  PatientsRouterListWithLatestVisitOutput,
} from "@/utils/trpc-types";

vi.mock("@/lib/context/VillageCodeContext", () => ({
  useVillageCode: () => ({ selectedVillageCodeId: 2 }),
}));
vi.mock("@/components/interactive/inputs/WebcamInput", () => ({
  WebcamInput: () => null,
}));

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
  extraContent?: React.ReactNode,
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
          {extraContent}
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

function PatientDetailName() {
  const { data } = testTrpc.patientsRouter.getById.useQuery({ id: 1 });
  return <output aria-label="Patient detail name">{data?.name}</output>;
}

function DismissibleEditForm() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(false)}>Close edit form</button>
      {open && <EditPatientForm patient={patient} />}
    </>
  );
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

  it("refreshes the table and current search when a patient is edited", async () => {
    let patients = [patient];
    const { requests, queryClient, container } = renderSharedPage(
      (path, input) => {
        if (path === "patientsRouter.update") {
          patients = [{ ...patient, name: (input as { name: string }).name }];
          return patients[0];
        }
        if (path === "patientsRouter.getById") return patients[0];
        return patients;
      },
      <>
        <EditPatientForm patient={patient} />
        <PatientDetailName />
      </>,
    );
    await screen.findByRole("table");
    searchFor("Somchai");
    await waitFor(() => expect(searchResultIds()).toEqual([1]));
    fireEvent.change(container.querySelector('input[name="name"]')!, {
      target: { value: "Nok" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(tableNames()).toEqual(["Nok"]));
    await waitFor(() =>
      expect(screen.getByLabelText("Patient detail name")).toHaveTextContent(
        "Nok",
      ),
    );
    expect(
      await screen.findByText("No matching patients found."),
    ).toBeInTheDocument();
    expect(
      queryClient.getQueryData<PatientsRouterListWithLatestVisitOutput>(
        patientListKey,
      )?.[0].name,
    ).toBe("Nok");
    expect(
      requests.filter((path) => path === "patientsRouter.listWithLatestVisit"),
    ).toHaveLength(2);
  });

  it("adds a newly registered patient to both consumers", async () => {
    let patients = [patient];
    const { container } = renderSharedPage(
      (path, input) => {
        if (path === "patientsRouter.create") {
          const created = {
            ...patient,
            id: 20,
            name: (input as { name: string }).name,
          };
          patients = [created, ...patients];
          return created;
        }
        return patients;
      },
      <RegistrationPage
        imgDetails="data:image/jpeg;base64,test"
        setImgDetails={vi.fn()}
        setMode={vi.fn()}
      />,
    );
    await screen.findByRole("table");
    searchFor("PC");
    await waitFor(() => expect(searchResultIds()).toEqual([1]));
    const values = {
      name: "New Patient",
      identificationNumber: "NEW20",
      contactNo: "1234567",
      drugAllergy: "None",
      dateOfBirth: "1990-01-01",
    };
    for (const [name, value] of Object.entries(values)) {
      fireEvent.change(container.querySelector(`input[name="${name}"]`)!, {
        target: { value },
      });
    }
    fireEvent.click(
      container.querySelector('button[name="gender-dropdown-button"]')!,
    );
    fireEvent.click(
      container.querySelector('button[name="gender-male-dropdown-option"]')!,
    );
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() =>
      expect(tableNames()).toEqual(["Somchai Phuket", "New Patient"]),
    );
    await waitFor(() => expect(searchResultIds()).toEqual([1, 20]));
  });

  it("refreshes shared data if the edit form closes before the save finishes", async () => {
    let patients = [patient];
    let finishSave!: () => void;
    const pending = new Promise<PatientsRouterListWithLatestVisitItem>(
      (resolve) => {
        finishSave = () => {
          patients = [{ ...patient, name: "Nok" }];
          resolve(patients[0]);
        };
      },
    );
    const { container, requests } = renderSharedPage(
      (path) => {
        if (path === "patientsRouter.update") return pending;
        if (path === "patientsRouter.getById") return patients[0];
        return patients;
      },
      <>
        <DismissibleEditForm />
        <PatientDetailName />
      </>,
    );
    await screen.findByRole("table");
    searchFor("Somchai");
    await waitFor(() => expect(searchResultIds()).toEqual([1]));
    fireEvent.change(container.querySelector('input[name="name"]')!, {
      target: { value: "Nok" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(requests).toContain("patientsRouter.update"));
    fireEvent.click(screen.getByRole("button", { name: "Close edit form" }));
    expect(container.querySelector("form")).not.toBeInTheDocument();
    finishSave();
    await waitFor(() => expect(tableNames()).toEqual(["Nok"]));
    await waitFor(() =>
      expect(screen.getByLabelText("Patient detail name")).toHaveTextContent(
        "Nok",
      ),
    );
    expect(
      await screen.findByText("No matching patients found."),
    ).toBeInTheDocument();
  });

  it("updates village searches after a new visit changes the latest village", async () => {
    let patients = [patient];
    const { requests, queryClient } = renderSharedPage(
      (path) => {
        if (path === "patientsRouter.searchPatientsByPicture") return [patient];
        if (path === "visitsRouter.hasRecentVisit")
          return { hasRecentVisit: false, existingVisitDate: null };
        if (path === "visitsRouter.create") {
          patients = [{ ...patient, villageCode: "CA" }];
          return { id: 99, patientId: 1, villageCodeId: 2, date: new Date() };
        }
        return patients;
      },
      <MatchingPatients
        imgDetails="data:image/jpeg;base64,test"
        setMode={vi.fn()}
      />,
    );
    await screen.findByRole("button", { name: "Create Visit" });
    searchFor("PC");
    await waitFor(() => expect(searchResultIds()).toEqual([1]));
    fireEvent.click(screen.getByRole("button", { name: "Create Visit" }));
    expect(
      await screen.findByText("No matching patients found."),
    ).toBeInTheDocument();
    expect(
      queryClient.getQueryData<PatientsRouterListWithLatestVisitOutput>(
        patientListKey,
      )?.[0].villageCode,
    ).toBe("CA");
    searchFor("CA");
    await waitFor(() => expect(searchResultIds()).toEqual([1]));
    expect(
      requests.filter((path) => path === "patientsRouter.listWithLatestVisit"),
    ).toHaveLength(2);
  });
});
