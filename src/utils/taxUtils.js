import { formatMonthLongPt, formatMonthShortPt } from "./formatters.js";

export const taxFields = [
  "simple",
  "pis",
  "cofins",
  "csll",
  "irpj",
  "iss_icms",
  "efd_reinf",
];

export const FIELD_LABELS = {
  simple: "Simples",
  pis: "PIS",
  cofins: "COFINS",
  csll: "CSLL",
  irpj: "IRPJ",
  iss_icms: "ISS/ICMS",
  efd_reinf: "EFD Reinf",
};

export const taxTypeConfig = {
  simple: { label: "Simples", badge: "badge-simples" },
  presumed: { label: "Presumido", badge: "badge-presumido" },
  simple_payroll: { label: "Simples c/ Folha", badge: "badge-folha" },
  presumed_no_movement: {
    label: "Presumido s/ Mov.",
    badge: "badge-sem-movimento",
  },
};

export const homeTableColumns = [
  { key: "name", label: "Empresa" },
  { key: "tax_type", label: "Tributação" },
  ...taxFields.map((key) => ({ key, label: FIELD_LABELS[key] })),
];

export const getTotalFromRecord = (record) =>
  taxFields.reduce((sum, field) => sum + (record?.[field] ?? 0), 0);

/** Meses únicos ordenados; `style: "long"` para o seletor da Home, `"short"` para Relatórios */
export function getMonthOptionsFromTaxes(taxes, { style = "short" } = {}) {
  const dates = [...new Set(taxes.map((t) => t.date))].sort(
    (a, b) => new Date(a) - new Date(b),
  );
  return dates.map((date) => ({
    date,
    label:
      style === "long" ? formatMonthLongPt(date) : formatMonthShortPt(date),
  }));
}
