import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import "./home.css";
import { ChevronDown } from "lucide-react";
import { getCompanies, getTaxes } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { ResumeCard } from "../../components/resumeCard/ResumeCard";

export function Home() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesData, taxesData] = await Promise.all([
          getCompanies(),
          getTaxes(),
        ]);
        setCompanies(companiesData);
        setTaxes(taxesData);

        const latest = getAvailableMonths(taxesData).at(-1);
        setSelectedMonth(latest ?? null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getAvailableMonths = (taxesData) => {
    const uniqueDates = [...new Set(taxesData.map((t) => t.date))].sort();
    return uniqueDates.map((date) => {
      const [year, month] = date.split("-");
      return {
        value: date,
        label: new Date(year, month - 1).toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
      };
    });
  };

  const months = getAvailableMonths(taxes);

  const columns = [
    { key: "name", label: "Empresa" },
    { key: "tax_type", label: "Tributação" },
    { key: "simple", label: "Simples" },
    { key: "pis", label: "PIS" },
    { key: "cofins", label: "COFINS" },
    { key: "csll", label: "CSLL" },
    { key: "irpj", label: "IRPJ" },
    { key: "iss_icms", label: "ISS/ICMS" },
    { key: "efd_reinf", label: "EFD Reinf" },
  ];

  const taxBadgeClass = {
    simple: "badge-simples",
    presumed: "badge-presumido",
    simple_payroll: "badge-folha",
    presumed_no_movement: "badge-sem-movimento",
  };

  const taxBadgeLabel = {
    simple: "Simples",
    presumed: "Presumido",
    simple_payroll: "Simples c/ Folha",
    presumed_no_movement: "Presumido s/ Mov.",
  };

  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
    setIsSelectOpen(false);
  };

  const formatCurrency = (value) => {
    if (value == null) return "—";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (loading) return <span>Carregando...</span>;

  return (
    <>
      <Sidebar />
      <section id="homeContainer">
        <header>
          <span className="header-title">Visão Geral</span>
          <div className="select-custom">
            <div
              className="select-trigger"
              onClick={() => setIsSelectOpen((prev) => !prev)}
            >
              <span>{selectedMonth?.label ?? "Selecione um mês"}</span>
              <ChevronDown size={24} className={isSelectOpen ? "open" : ""} />
            </div>
            <div className="wrapper">
              <ul role="listbox" className={isSelectOpen ? "open" : ""}>
                {months.map((month) => (
                  <li
                    key={month.value}
                    role="option"
                    className={
                      selectedMonth?.value === month.value ? "active" : ""
                    }
                    onClick={() => handleSelectMonth(month)}
                  >
                    <span>{month.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button className="default add-enterprise">
            + Adicionar Empresa
          </button>
        </header>
        <div className="general-container">
          <div className="resume-cards">
            <ResumeCard
              title="Total mais Recente"
              value="1.522.000"
              percent={-10}
              type="comparative"
            />
            <ResumeCard
              title="Total mais Recente"
              value="33.300"
              percent={-10}
              type="comparative"
            />
            <ResumeCard
              title="Total mais Recente"
              value="33.300"
              percent={-10}
              type="comparative"
            />
            <ResumeCard
              title="Total mais Recente"
              value="33.300"
              date="26 de fev"
              type="date"
            />
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {columns.map(({ key, label }) => (
                    <th key={key}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => {
                  const tax = taxes.find(
                    (t) =>
                      t.company_id === company.id &&
                      t.date === selectedMonth?.value,
                  );
                  return (
                    <tr key={company.id}>
                      {columns.map(({ key }) => (
                        <td key={key}>
                          {key === "tax_type" ? (
                            <span className={taxBadgeClass[company.tax_type]}>
                              {taxBadgeLabel[company.tax_type]}
                            </span>
                          ) : key === "name" ? (
                            <span
                              onClick={() =>
                                navigate(`/enterprise/${company.id}`)
                              }
                            >
                              {company.name}
                            </span>
                          ) : (
                            formatCurrency(tax?.[key])
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
