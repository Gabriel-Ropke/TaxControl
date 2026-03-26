import { supabase } from "../lib/supabase";

// Busca todas as empresas
export const getCompanies = async () => {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
};

export const getCompanyById = async (id) => {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Busca todos os impostos
export const getTaxes = async () => {
  const { data, error } = await supabase
    .from("taxes")
    .select("*")
    .order("date");

  if (error) throw error;
  return data;
};

export const getTaxesByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from("taxes")
    .select("*")
    .eq("company_id", companyId)
    .order("date");

  if (error) throw error;
  return data;
};

// Busca impostos de um mês específico
export const getTaxesByDate = async (date) => {
  const { data, error } = await supabase
    .from("taxes")
    .select("*")
    .eq("date", date);

  if (error) throw error;
  return data;
};
