import { createClient } from "@supabase/supabase-js";

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

const companies = [
  { name: "AFS", tax_type: "simple" },
  { name: "Agenor", tax_type: "simple" },
  { name: "Barcelos", tax_type: "simple" },
  { name: "Bari", tax_type: "simple" },
  { name: "Dal Pont", tax_type: "simple" },
  { name: "Ferrara", tax_type: "presumed" },
  { name: "GHD", tax_type: "simple_payroll" },
  { name: "Giovana Pedroso", tax_type: "simple_payroll" },
];

const taxesByCompany = {
  AFS: [
    { m: 9, y: 2025, s: 640 },
    { m: 10, y: 2025, s: 620 },
    { m: 11, y: 2025, s: 590 },
    { m: 1, y: 2026, s: 560 },
    { m: 2, y: 2026, s: 530 },
    { m: 3, y: 2026, s: 547.47 },
  ],
  Agenor: [
    { m: 9, y: 2025, s: 18000 },
    { m: 10, y: 2025, s: 22000 },
    { m: 11, y: 2025, s: 24000 },
    { m: 1, y: 2026, s: 26500 },
    { m: 2, y: 2026, s: 28000 },
    { m: 3, y: 2026, s: 33300.95 },
  ],
  Barcelos: [
    { m: 9, y: 2025, s: 1800 },
    { m: 10, y: 2025, s: 1500 },
    { m: 11, y: 2025, s: 1200 },
    { m: 1, y: 2026, s: 900 },
    { m: 2, y: 2026, s: 600 },
    { m: 3, y: 2026, s: null },
  ],
  Bari: [
    { m: 9, y: 2025, s: 29000 },
    { m: 10, y: 2025, s: 28500 },
    { m: 11, y: 2025, s: 28000 },
    { m: 1, y: 2026, s: 27000 },
    { m: 2, y: 2026, s: 26500 },
    { m: 3, y: 2026, s: 25240.13 },
  ],
  "Dal Pont": [
    { m: 9, y: 2025, s: 20500 },
    { m: 10, y: 2025, s: 20200 },
    { m: 11, y: 2025, s: 19800 },
    { m: 1, y: 2026, s: 19600 },
    { m: 2, y: 2026, s: 19400 },
    { m: 3, y: 2026, s: 19239.47 },
  ],
  Ferrara: [
    { m: 9, y: 2025, p: 500, c: 2300, e: 8 },
    { m: 10, y: 2025, p: 560, c: 2600, e: 8.5 },
    { m: 11, y: 2025, p: 620, c: 2900, e: 9 },
    { m: 1, y: 2026, p: 680, c: 3100, e: 9.5 },
    { m: 2, y: 2026, p: 720, c: 3300, e: 9.8 },
    { m: 3, y: 2026, p: 779.05, c: 3595.6, e: 10.24 },
  ],
  GHD: [
    { m: 9, y: 2025, s: 480 },
    { m: 10, y: 2025, s: 465 },
    { m: 11, y: 2025, s: 455 },
    { m: 1, y: 2026, s: 445 },
    { m: 2, y: 2026, s: 441 },
    { m: 3, y: 2026, s: 427.98 },
  ],
  "Giovana Pedroso": [
    { m: 9, y: 2025, s: 2950 },
    { m: 10, y: 2025, s: 2920 },
    { m: 11, y: 2025, s: 2900 },
    { m: 1, y: 2026, s: 2880 },
    { m: 2, y: 2026, s: 2860 },
    { m: 3, y: 2026, s: 2829.83 },
  ],
};

const seed = async () => {
  console.log("Inserindo empresas...");

  const { data: insertedCompanies, error: companiesError } = await supabase
    .from("companies")
    .insert(companies)
    .select();

  if (companiesError) {
    console.error("Erro ao inserir empresas:", companiesError);
    return;
  }

  console.log(`${insertedCompanies.length} empresas inseridas!`);
  console.log("Inserindo impostos...");

  const taxes = insertedCompanies.flatMap((company) =>
    taxesByCompany[company.name].map(({ m, y, s, p, c, e }) => ({
      company_id: company.id,
      date: `${y}-${String(m).padStart(2, "0")}-01`,
      simple: s ?? null,
      pis: p ?? null,
      cofins: c ?? null,
      csll: null,
      irpj: null,
      iss_icms: null,
      efd_reinf: e ?? null,
    })),
  );

  const { error: taxesError } = await supabase.from("taxes").insert(taxes);

  if (taxesError) {
    console.error("Erro ao inserir impostos:", taxesError);
    return;
  }

  console.log(`${taxes.length} registros de impostos inseridos!`);
  console.log("Seed concluído!");
};

seed();
