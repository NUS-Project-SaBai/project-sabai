import MiniSearch from "minisearch";
import { formatPatientCode, formatPatientId } from "@/lib/utils/patient";

interface SearchablePatient {
  id: number;
  name: string;
  identificationNumber: string | null;
  villageCode: string | null;
}

const textFields = ["name", "identificationNumber"] as const;
const codeFields = [
  "formattedId",
  "patientCode",
  "unpaddedPatientCode",
] as const;

/** Builds an index and returns a search function for these patients. */
export function createPatientSearch<T extends SearchablePatient>(
  patients: T[],
) {
  const documents = patients.map((patient) => ({
    id: patient.id,
    name: patient.name,
    identificationNumber: patient.identificationNumber ?? "",
    formattedId: formatPatientId(patient.id),
    patientCode: formatPatientCode(patient.villageCode, patient.id),
    // Accept PC1 while displaying PC0001.
    unpaddedPatientCode: patient.villageCode
      ? `${patient.villageCode}${patient.id}`
      : "",
  }));
  const index = new MiniSearch({
    fields: [...textFields, ...codeFields],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      maxFuzzy: 2,
      combineWith: "AND",
      boost: {
        formattedId: 4,
        patientCode: 4,
        unpaddedPatientCode: 4,
        identificationNumber: 2,
      },
    },
  });
  index.addAll(documents);
  const villageCodes = new Set(
    patients.flatMap((patient) =>
      patient.villageCode ? [patient.villageCode.toLowerCase()] : [],
    ),
  );

  return (searchText: string): T[] => {
    const query = searchText.trim().toLowerCase();
    if (!query) return [];
    const isVillageQuery = villageCodes.has(query);

    // Only digit-containing, non-village queries search patient-code fields.
    const fields =
      /\d/.test(query) && !isVillageQuery
        ? [...textFields, ...codeFields]
        : [...textFields];
    // Unpadded aliases support exact, prefix and fuzzy matching only.
    const substringFields = fields.filter(
      (field) => field !== "unpaddedPatientCode",
    );
    const scores = new Map<number, number>(
      index
        .search(query, { fields })
        .map((result) => [Number(result.id), result.score]),
    );

    // Return each original patient once, even when multiple rules match.
    return patients
      .flatMap((patient, position) => {
        const document = documents[position];
        const substringMatch = substringFields.some((field) =>
          document[field].toLowerCase().includes(query),
        );
        const villageMatch = patient.villageCode?.toLowerCase() === query;
        const score = scores.get(patient.id) ?? 0;
        if (!substringMatch && !scores.has(patient.id) && !villageMatch) {
          return [];
        }

        const exactMatch = fields.some(
          (field) => document[field].toLowerCase() === query,
        );

        // Order: exact, substring, MiniSearch-only, then village-only.
        const rank = exactMatch
          ? 0
          : substringMatch
            ? 1
            : scores.has(patient.id)
              ? 2
              : 3;
        return [{ patient, rank, score }];
      })
      .sort(
        (a, b) =>
          a.rank - b.rank || b.score - a.score || a.patient.id - b.patient.id,
      )
      .map(({ patient }) => patient);
  };
}
