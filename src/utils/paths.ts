export const paths = {
  home: () => "/",
  login: () => "/login",
  patient: () => "/patient",
  patientDetail: (patientId: number) => `/patient/${patientId}`,
  scanFace: () => "/scan-face",
  vitals: () => "/vitals",
  vitalsDetail: (patientId: number) => `/vitals/${patientId}`,
  vision: () => "/vision",
  visionUpdateGlasses: (patientId: number) =>
    `/vision/update-glasses/${patientId}`,
  consults: () => "/consults",
  consultsDetail: (patientId: number) => `/consults/${patientId}`,
  medicationStock: () => "/medication-stock",
  medicationBrands: () => "/medication-brands",
  medicationActiveIngredients: () => "/medication-active-ingredients",
  settings: () => "/settings/village-codes",
};
