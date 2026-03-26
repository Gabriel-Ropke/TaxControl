export const taxFields = [
  "simple",
  "pis",
  "cofins",
  "csll",
  "irpj",
  "iss_icms",
  "efd_reinf",
];

export const getTotalFromRecord = (record) =>
  taxFields.reduce((sum, field) => sum + (record?.[field] ?? 0), 0);
