import { useEffect, useRef, useState } from "react";
import { Sidebar } from "../../components/Sidebar/Sidebar.jsx";
import "./enterprises.css";
import { X } from "lucide-react";
import { EnterpriseCard } from "../../components/EnterpriseCard/EnterpriseCard.jsx";
import { getCompanies, getTaxes } from "../../services/api.js";

export function Enterprises() {
  const [companies, setCompanies] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesData, taxesData] = await Promise.all([
          getCompanies(),
          getTaxes(),
        ]);
        setCompanies(companiesData);
        setTaxes(taxesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCompanies = companies.filter((enterprise) => {
    return enterprise.name.toLowerCase().includes(searchValue.toLowerCase());
  });

  /* Input Search */
  const inputRef = useRef(null);
  const [activeInputSearch, setActiveInputSeach] = useState(false);
  const closeSearch = () => {
    inputRef.current.value = "";
    setActiveInputSeach(false);
    setSearchValue("");
  };

  if (loading) return <span>Carregando...</span>;
  return (
    <>
      <Sidebar />
      <section id="enterpriseSection">
        <header className={activeInputSearch ? "search" : ""}>
          <span className="header-title">Empresas</span>
          <div className="input-search">
            <input
              ref={inputRef}
              type="text"
              id="inputSearchEnterprise"
              onChange={(e) => setSearchValue(e.target.value)}
              onClick={() => setActiveInputSeach(true)}
              onBlur={(e) =>
                e.target.value.length > 0
                  ? setActiveInputSeach(true)
                  : setActiveInputSeach(false)
              }
            />
            <label htmlFor="inputSearchEnterprise">Buscar Empresa</label>
            <X onClick={closeSearch} />
          </div>
          <button className="default add-enterprise">+ Nova Empresa</button>
        </header>
        <div id="enterprises">
          {filteredCompanies.map((empresa) => (
            <EnterpriseCard key={empresa.id} empresa={empresa} taxes={taxes} />
          ))}
        </div>
      </section>
    </>
  );
}
