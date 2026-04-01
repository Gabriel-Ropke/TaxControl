import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageWithSidebar } from "../../components/PageWithSidebar/PageWithSidebar";
import "./enterprises.css";
import { X, DownloadCloud, UploadCloud, SlidersHorizontal, Trash2 } from "lucide-react";
import { EnterpriseCard } from "../../components/EnterpriseCard/EnterpriseCard.jsx";
import { useCompaniesAndTaxes } from "../../hooks/useCompaniesAndTaxes";
import { Button } from "../../components/ui/Button";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { EnterpriseModal } from "../../components/EnterpriseModal/EnterpriseModal";
import { exportPivotCSV } from "../../utils/csvHandler";
import { getTotalFromRecord } from "../../utils/taxUtils";
import { MonthMultiPicker } from "../../components/MonthMultiPicker/MonthMultiPicker";
import { deleteCompany } from "../../services/api";

export function Enterprises() {
  const navigate = useNavigate();
  const { companies, taxes, loading } = useCompaniesAndTaxes();
  
  // Persistências e estados de UI
  const [searchValue, setSearchValue] = useState("");
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  
  const [sortOption, setSortOption] = useState(() => localStorage.getItem('ent_sort') || 'name_asc');
  const [missingMonthFilter, setMissingMonthFilter] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ent_miss_month') || '[]'); } catch { return []; }
  });
  const [hasMonthFilter, setHasMonthFilter] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ent_has_month') || '[]'); } catch { return []; }
  });
  const [noRecordsOnly, setNoRecordsOnly] = useState(() => localStorage.getItem('ent_no_records') === 'true');

  // Persistir filtros
  useEffect(() => {
    localStorage.setItem('ent_sort', sortOption);
    localStorage.setItem('ent_miss_month', JSON.stringify(missingMonthFilter));
    localStorage.setItem('ent_has_month', JSON.stringify(hasMonthFilter));
    localStorage.setItem('ent_no_records', noRecordsOnly);
  }, [sortOption, missingMonthFilter, hasMonthFilter, noRecordsOnly]);

  // Motores de Memória e Filtro
  const companyStats = useMemo(() => {
    const stats = {};
    companies.forEach(emp => {
      const entTaxes = taxes.filter(t => String(t.company_id) === String(emp.id)).sort((a,b) => new Date(a.date) - new Date(b.date));
      let allTimeTotal = 0;
      entTaxes.forEach(t => allTimeTotal += getTotalFromRecord(t));
      stats[emp.id] = {
        allTimeTotal,
        taxes: entTaxes,
        lastRecordDate: entTaxes.length > 0 ? entTaxes[entTaxes.length - 1].date : null,
      };
    });
    return stats;
  }, [companies, taxes]);

  const filteredAndSorted = useMemo(() => {
    let result = companies.filter((emp) => emp.name.toLowerCase().includes(searchValue.toLowerCase()));

    if (missingMonthFilter.length > 0) {
      result = result.filter(emp => {
        // Empresa ausente = nenhum dos meses selecionados tem registro com valor > 0
        return missingMonthFilter.every(monthKey => {
          return !companyStats[emp.id].taxes.some(t => t.date.startsWith(monthKey) && getTotalFromRecord(t) > 0);
        });
      });
    }

    if (hasMonthFilter.length > 0) {
      result = result.filter(emp => {
        // Empresa presente = tem registro com valor > 0 em TODOS os meses selecionados
        return hasMonthFilter.every(monthKey => {
          return companyStats[emp.id].taxes.some(t => t.date.startsWith(monthKey) && getTotalFromRecord(t) > 0);
        });
      });
    }

    if (noRecordsOnly) {
      result = result.filter(emp => {
        const stats = companyStats[emp.id];
        return !stats || stats.taxes.length === 0 || stats.allTimeTotal === 0;
      });
    }

    result.sort((a, b) => {
      const statsA = companyStats[a.id];
      const statsB = companyStats[b.id];

      switch (sortOption) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'total_desc': return statsB.allTimeTotal - statsA.allTimeTotal;
        case 'date_desc': 
          if (!statsA.lastRecordDate) return 1;
          if (!statsB.lastRecordDate) return -1;
          return new Date(statsB.lastRecordDate) - new Date(statsA.lastRecordDate);
        case 'date_asc':
          if (!statsA.lastRecordDate) return 1;
          if (!statsB.lastRecordDate) return -1;
          return new Date(statsA.lastRecordDate) - new Date(statsB.lastRecordDate);
        default: return 0;
      }
    });

    return result;
  }, [companies, searchValue, missingMonthFilter, hasMonthFilter, sortOption, noRecordsOnly, companyStats]);

  const toggleSelection = (empId) => {
    setSelectedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const activeFilterCount = (sortOption !== 'name_asc' ? 1 : 0) + 
                             missingMonthFilter.length + 
                             hasMonthFilter.length +
                             (noRecordsOnly ? 1 : 0);

  const handleDeleteSelected = async () => {
    const count = selectedCompanies.size;
    if (!window.confirm(`Tem certeza que deseja excluir ${count} empresa${count > 1 ? 's' : ''}? Todos os registros de impostos serão apagados permanentemente.`)) return;
    try {
      for (const compId of selectedCompanies) {
        await deleteCompany(compId);
      }
      setSelectedCompanies(new Set());
      setIsSelectionMode(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir uma ou mais empresas.");
    }
  };

  const inputRef = useRef(null);
  const [activeInputSearch, setActiveInputSearch] = useState(false);
  const closeSearch = () => {
    inputRef.current.value = "";
    setActiveInputSearch(false);
    setSearchValue("");
  };

  if (loading) return (
    <PageWithSidebar>
      <section id="enterpriseSection">
        <header>
          <span className="header-title">Carregando...</span>
        </header>
        <div id="enterprises" style={{ padding: '40px' }}>
          <SkeletonLoader type="card" count={6} />
        </div>
      </section>
    </PageWithSidebar>
  );

  return (
    <PageWithSidebar>
      <section id="enterpriseSection">
        <header className={activeInputSearch ? "search" : ""}>
          <span className="header-title">Empresas</span>
          <div className="input-search">
            <input
              ref={inputRef}
              type="text"
              id="inputSearchEnterprise"
              onChange={(e) => setSearchValue(e.target.value)}
              onClick={() => setActiveInputSearch(true)}
              onBlur={(e) =>
                e.target.value.length > 0
                  ? setActiveInputSearch(true)
                  : setActiveInputSearch(false)
              }
            />
            <label htmlFor="inputSearchEnterprise">Buscar Empresa</label>
            <X onClick={closeSearch} />
          </div>

          <Button className="add-enterprise" onClick={() => setIsEnterpriseModalOpen(true)}>
            + Nova Empresa
          </Button>
        </header>

        {/* TOOLBAR SLIM */}
        <div className="enterprises-toolbar">
          <button
            className={`filter-trigger-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            onClick={() => setFilterPanelOpen(true)}
          >
            <SlidersHorizontal size={16} />
            Filtros e Ordenação
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>

          <div className="toolbar-actions">
            <Button variant="secondary" onClick={() => exportPivotCSV(companies, taxes, "total")}>
              <DownloadCloud size={16} /> Exportar
            </Button>
            <Button variant="secondary" onClick={() => navigate("/enterprises/import")}>
              <UploadCloud size={16} /> Importar
            </Button>
            <Button
              variant={isSelectionMode ? "primary" : "secondary"}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedCompanies(new Set());
              }}
            >
              {isSelectionMode ? "Cancelar Seleção" : "Selecionar"}
            </Button>
          </div>
        </div>
        {/* PAINEL SLIDE DE FILTROS */}
        <div className={`filter-slide-panel ${filterPanelOpen ? 'open' : ''}`}>
          <div className="filter-panel-backdrop" onClick={() => setFilterPanelOpen(false)} />
          <div className="filter-panel-content">
            <div className="filter-panel-header">
              <h3>Filtros e Ordenação</h3>
              <button onClick={() => setFilterPanelOpen(false)} className="panel-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="filter-panel-section">
              <label className="filter-section-label">Ordenar por</label>
              <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="glass-select full-width">
                <option value="name_asc">A → Z</option>
                <option value="name_desc">Z → A</option>
                <option value="total_desc">Maior Receita Histórica</option>
                <option value="date_desc">Registro Mais Recente</option>
                <option value="date_asc">Registro Mais Antigo</option>
              </select>
            </div>

            <div className="filter-panel-section">
              <label className="filter-section-label">Ausente em</label>
              <MonthMultiPicker
                label="Selecionar meses"
                selected={missingMonthFilter}
                onChange={setMissingMonthFilter}
              />
            </div>

            <div className="filter-panel-section">
              <label className="filter-section-label">Presente em</label>
              <MonthMultiPicker
                label="Selecionar meses"
                selected={hasMonthFilter}
                onChange={setHasMonthFilter}
              />
            </div>

            <div className="filter-panel-section">
               <label className="filter-checkbox-row">
                  <input type="checkbox" checked={noRecordsOnly} onChange={e => setNoRecordsOnly(e.target.checked)} />
                  <span>Apenas sem nenhum registro</span>
               </label>
            </div>

            {activeFilterCount > 0 && (
              <button className="clear-all-filters-btn" onClick={() => {
                setSortOption('name_asc');
                setMissingMonthFilter([]);
                setHasMonthFilter([]);
                setNoRecordsOnly(false);
              }}>
                Limpar todos os filtros
              </button>
            )}
          </div>
        </div>

        <div id="enterprises">
          {filteredAndSorted.map((empresa) => (
            <div key={empresa.id} className={`enterprise-wrapper ${selectedCompanies.has(empresa.id) ? 'selected' : ''}`}>
               {isSelectionMode && (
                 <div className="card-selector" onClick={(e) => { e.stopPropagation(); toggleSelection(empresa.id); }}>
                    <input type="checkbox" checked={selectedCompanies.has(empresa.id)} readOnly />
                 </div>
               )}
               <EnterpriseCard empresa={empresa} taxes={taxes} />
            </div>
          ))}
        </div>

        {selectedCompanies.size > 0 && (
           <div className="bulk-action-bar">
              <span>{selectedCompanies.size} empresa{selectedCompanies.size > 1 ? 's' : ''} selecionada{selectedCompanies.size > 1 ? 's' : ''}</span>
              <Button onClick={() => navigate("/enterprises/batch-edit", { state: { selectedIds: Array.from(selectedCompanies) }})}>
                 Editar Mês a Mês
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteSelected}
                style={{ background: 'rgba(220,53,69,0.15)', border: '1px solid rgba(220,53,69,0.5)', color: '#ff6b6b' }}
              >
                <Trash2 size={14} /> Excluir Selecionadas
              </Button>
           </div>
        )}
      </section>

      <EnterpriseModal
        isOpen={isEnterpriseModalOpen}
        onClose={() => setIsEnterpriseModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </PageWithSidebar>
  );
}
