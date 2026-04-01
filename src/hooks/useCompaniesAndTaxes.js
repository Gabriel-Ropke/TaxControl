import { useEffect, useState } from "react";
import { getCompanies, getTaxes } from "../services/api";

export function useCompaniesAndTaxes() {
  const [companies, setCompanies] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [companiesData, taxesData] = await Promise.all([
          getCompanies(),
          getTaxes(),
        ]);
        if (!cancelled) {
          setCompanies(companiesData);
          setTaxes(taxesData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { companies, taxes, loading };
}
