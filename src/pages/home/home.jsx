import { useState } from "react";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { impostos, mesesDisponiveis, empresas } from "../../mock/data";
import "./home.css";
import { ChevronDown } from "lucide-react";
export function Home() {
  const colunas = [
    { key: "nome", label: "Empresa" },
    { key: "tributacao", label: "Tributação" },
    { key: "simples", label: "Simples" },
    { key: "pis", label: "PIS" },
    { key: "cofins", label: "COFINS" },
    { key: "csll", label: "CSLL" },
    { key: "irpj", label: "IRPJ" },
    { key: "iss_icms", label: "ISS/ICMS" },
    { key: "efd_reinf", label: "EFD Reinf" },
  ];
  const tributacaoBadge = {
    Simples: "badge-simples",
    Presumido: "badge-presumido",
    "Simples c/ Folha": "badge-folha",
    "Presumido s/ Mov.": "badge-sem-movimento",
  };
  const meses = mesesDisponiveis.map(({ mes, ano }) => ({
    value: `${mes}-${ano}`,
    label: new Date(ano, mes - 1).toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
  }));
  const [selectedMonth, setSelectedMonth] = useState(meses[0]);
  const [selectIsOpen, setSelectIsOpen] = useState(false);
  console.log(meses);
  const handleSelect = (month) => {
    setSelectedMonth(month);
    setSelectIsOpen(false);
  };
  return (
    <>
      <Sidebar />
      <section id="homeContainer">
        <header>
          <span className="header-title">Visão Geral</span>
          <div className="select-custom">
            <div
              className="select-trigger"
              onClick={() => setSelectIsOpen((prev) => !prev)}
            >
              <span>{selectedMonth.label}</span>
              <ChevronDown size={24} className={selectIsOpen ? "open" : ""} />
            </div>
            <div className="wrapper">
              <ul role="listbox" className={selectIsOpen ? "open" : ""}>
                {meses.map((month) => {
                  return (
                    <li
                      key={month.value}
                      role="option"
                      className={
                        selectedMonth.value === month.value ? "active" : ""
                      }
                      onClick={() => handleSelect(month)}
                    >
                      <span>{month.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <button className="add-enterprise">+ Adicionar Empresa</button>
        </header>
        <div className="general-container">
          <div className="resume-cards">
            <div className="card">
              <span className="title">Total do Mês</span>
              <span className="value">R$ 84.320</span>
              <span className="alert negative">
                +12% em comparação com o mês passado
              </span>
            </div>
            <div className="card">
              <span className="title">Total do Mês</span>
              <span className="value">R$ 84.320</span>
              <span className="alert negative">
                +12% em comparação com o mês passado
              </span>
            </div>
            <div className="card">
              <span className="title">Total do Mês</span>
              <span className="value">R$ 84.320</span>
              <span className="alert negative">
                +12% em comparação com o mês passado
              </span>
            </div>
            <div className="card">
              <span className="title">Total do Mês</span>
              <span className="value">R$ 84.320</span>
              <span className="alert negative">
                +12% em comparação com o mês passado
              </span>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {colunas.map(({ key, label }) => (
                    <th key={key}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => {
                  const imposto = impostos.find(
                    (i) => i.empresa_id === empresa.id,
                  );
                  return (
                    <tr key={empresa.id}>
                      {colunas.map(({ key }) => (
                        <td key={key}>
                          {key === "tributacao" ? (
                            <span
                              className={tributacaoBadge[empresa.tributacao]}
                            >
                              {empresa.tributacao}
                            </span>
                          ) : (
                            (empresa[key] ?? imposto?.[key] ?? "—")
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
