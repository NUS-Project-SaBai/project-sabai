import { createPatientSearch } from "@/lib/utils/patient-search";

const patient = {
  id: 1,
  name: "Somchai Phuket",
  identificationNumber: "AB123456",
  villageCode: "PC",
  patientImageUrl: "/patient-1.webp",
};

describe("createPatientSearch", () => {
  const search = createPatientSearch([patient]);

  it.each([
    "1",
    "001",
    "0001",
    "pc00",
    "PC0001",
    "pc0001",
    "Pc0001",
    "  0001 ",
    "somchai",
    "PHUKET",
    "omch",
    "1234",
    "ab123456",
  ])("preserves the existing substring match for %s", (query) => {
    expect(search(query)).toEqual([patient]);
  });

  it("does not match a code from a village beyond the fuzzy allowance", () => {
    expect(search("CA0001")).toEqual([]);
  });

  it("does not match unrelated single digits", () => {
    const withoutIdentification = { ...patient, identificationNumber: null };
    expect(createPatientSearch([withoutIdentification])("2")).toEqual([]);
  });

  it.each(["Somchaj", "AB123457", "0002", "PC0002", "PD0001"])(
    "finds a patient with a typo in their name, identification number or code: %s",
    (query) => {
      expect(search(query)).toEqual([patient]);
    },
  );

  it("supports prefix matching across multiple name tokens", () => {
    expect(search("Phuk Somch")).toEqual([patient]);
  });

  it.each([
    [1, "PC1"],
    [12, "pc12"],
    [123, "  Pc123  "],
    [1234, "PC1234"],
    [12345, "PC12345"],
  ])("matches unpadded code %s / %s", (id, query) => {
    const unpadded = { ...patient, id };
    expect(createPatientSearch([unpadded])(query)).toEqual([unpadded]);
  });

  it("matches prefixes and typos in unpadded codes", () => {
    const unpadded = { ...patient, id: 123 };
    const searchUnpadded = createPatientSearch([unpadded]);
    expect(searchUnpadded("PC12")).toEqual([unpadded]);
    expect(searchUnpadded("PC124")).toEqual([unpadded]);
    expect(searchUnpadded("PD123")).toEqual([unpadded]);
  });

  it("puts an exact unpadded code before longer prefixes and fuzzy alternatives", () => {
    const prefix = { ...patient, id: 12 };
    const fuzzy = { ...patient, id: 2 };
    const results = createPatientSearch([prefix, fuzzy, patient])("PC1");
    expect(results[0]).toBe(patient);
    expect(results).toHaveLength(3);
    expect(new Set(results.map(({ id }) => id)).size).toBe(3);
  });

  it("boosts an unpadded code above an otherwise identical name match", () => {
    const code = { ...patient, name: "Unrelated" };
    const name = { ...patient, id: 9999, name: "PC1", villageCode: null };
    expect(createPatientSearch([name, code])("PC1")[0]).toBe(code);
  });

  it("requires all query tokens for additional MiniSearch results", () => {
    expect(search("Somch missing")).toEqual([]);
  });

  it("deduplicates substring and MiniSearch matches and preserves full objects", () => {
    const results = search("Somchai");
    expect(results).toHaveLength(1);
    expect(results[0]).toBe(patient);
    expect(results[0].patientImageUrl).toBe("/patient-1.webp");
  });

  it("puts an exact code ahead of substring and fuzzy matches", () => {
    const substring = { ...patient, id: 20, name: "Former PC0002 record" };
    const exact = { ...patient, id: 2 };
    const results = createPatientSearch([patient, substring, exact])("PC0002");
    expect(results.map(({ id }) => id)).toEqual([2, 20, 1]);
  });

  it("puts an exact formatted ID ahead of nearby IDs", () => {
    const exact = { ...patient, id: 2 };
    expect(
      createPatientSearch([patient, exact])("0002").map(({ id }) => id),
    ).toEqual([2, 1]);
  });

  it("boosts code and ID fields above an otherwise identical name match", () => {
    const code = { ...patient, name: "Unrelated" };
    const name = { ...patient, id: 9999, name: "PC0001", villageCode: null };
    expect(createPatientSearch([name, code])("PC0001")[0]).toBe(code);
    const idName = { ...name, name: "0001" };
    expect(createPatientSearch([idName, code])("0001")[0]).toBe(code);
  });

  it("finds patients by their complete village code regardless of case or whitespace", () => {
    const villageOnly = {
      ...patient,
      name: "Nok",
      identificationNumber: null,
      villageCode: "CA",
    };
    expect(createPatientSearch([villageOnly])("  ca  ")).toEqual([villageOnly]);
    expect(search("PC")).toEqual([patient]);
  });

  it("does not prefix-match or fuzzy-match a village-only query", () => {
    const villageOnly = { ...patient, name: "Nok", identificationNumber: null };
    const searchVillage = createPatientSearch([villageOnly]);
    expect(searchVillage("P")).toEqual([]);
    expect(searchVillage("PD")).toEqual([]);
    expect(searchVillage("PCC")).toEqual([]);

    const samePrefix = { ...villageOnly, id: 2, villageCode: "PCA" };
    expect(createPatientSearch([villageOnly, samePrefix])("PC")).toEqual([
      villageOnly,
    ]);
  });

  it("ranks exact, substring and fuzzy name matches ahead of village-only matches", () => {
    const villageOnly = {
      ...patient,
      name: "Nok",
      identificationNumber: null,
      villageCode: "SOM",
    };
    const exact = { ...villageOnly, id: 30, name: "Som", villageCode: null };
    const substring = { ...exact, id: 20, name: "Somchai" };
    const fuzzy = { ...exact, id: 10, name: "Sam" };
    const results = createPatientSearch([villageOnly, fuzzy, substring, exact])(
      "SOM",
    );
    expect(results.map(({ id }) => id)).toEqual([30, 20, 10, 1]);
  });

  it("deduplicates patients matching both a name and village and excludes patients with no village", () => {
    const both = { ...patient, name: "PCA" };
    const noVillage = {
      ...patient,
      id: 2,
      name: "Nok",
      identificationNumber: null,
      villageCode: null,
    };
    expect(createPatientSearch([both, noVillage])("PC")).toEqual([both]);
  });

  it("matches complete village codes containing digits without including nearby codes", () => {
    const exactVillage = {
      ...patient,
      id: 20,
      name: "Nok",
      identificationNumber: null,
      villageCode: "V001",
    };
    const samePrefix = { ...exactVillage, id: 21, villageCode: "V001X" };
    const fuzzyVillage = { ...exactVillage, id: 22, villageCode: "V002" };
    const nameMatch = {
      ...exactVillage,
      id: 30,
      name: "V001",
      villageCode: null,
    };
    const results = createPatientSearch([
      exactVillage,
      samePrefix,
      fuzzyVillage,
      nameMatch,
    ])("V001");
    expect(results.map(({ id }) => id)).toEqual([30, 20]);
  });

  it("still finds names and identification numbers with letters-only queries", () => {
    expect(search("phuket")).toEqual([patient]);
    expect(search("ab")).toEqual([patient]);
  });

  it("supports missing village codes and identification numbers", () => {
    const withoutVisit = {
      ...patient,
      id: 12,
      villageCode: null,
      identificationNumber: null,
    };
    const searchWithoutVisit = createPatientSearch([withoutVisit]);
    expect(searchWithoutVisit("0012")).toEqual([withoutVisit]);
    expect(searchWithoutVisit("0013")).toEqual([withoutVisit]);
    expect(searchWithoutVisit("PC0012")).toEqual([]);
    expect(searchWithoutVisit("PC12")).toEqual([]);
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(search("  sOMCHAJ  ")).toEqual([patient]);
  });

  it("preserves word-level case handling for non-English names", () => {
    const greekPatient = { ...patient, name: "\u039f\u03a3'\u0391" };
    expect(createPatientSearch([greekPatient])("\u03bf\u03c2")).toEqual([
      greekPatient,
    ]);
  });

  it.each(["", "   ", "zzzzzzzz", "!!!"])(
    "returns no results for blank or unrelated input: %s",
    (query) => {
      expect(search(query)).toEqual([]);
    },
  );

  it("handles an empty patient list", () => {
    expect(createPatientSearch([])("Somchai")).toEqual([]);
  });
});
