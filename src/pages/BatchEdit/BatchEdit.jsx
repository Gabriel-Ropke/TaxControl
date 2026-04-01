import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageWithSidebar } from "../../components/PageWithSidebar/PageWithSidebar";
import { Button } from "../../components/ui/Button";
import { useCompaniesAndTaxes } from "../../hooks/useCompaniesAndTaxes";
import { useToast } from "../../contexts/ToastContext";
import { createTax, updateTax } from "../../services/api";
import { taxFields, FIELD_LABELS } from "../../utils/taxUtils";
import { formatCurrencyInput, parseCurrencyToFloat } from "../../utils/formatters";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { MonthSinglePicker } from "../../components/MonthSinglePicker/MonthSinglePicker";
import "./batchEdit.css";
// Reutilizamos as classes visuais de grid complexo da página de importação onde possível
import "../ImportData/importData.css";

const calculateRowTotal = (taxesRecord) => {
  let acc = 0;
  taxFields.forEach(field => {
    acc += parseCurrencyToFloat(taxesRecord[field] || "") || 0;
  });
  return acc > 0 ? formatCurrencyInput(acc.toFixed(2).replace(".", ",")) : "";
};

export function BatchEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { companies, taxes, loading: globalLoading } = useCompaniesAndTaxes();

  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(""); 
  const [editableTaxes, setEditableTaxes] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [pendingMonthSwitch, setPendingMonthSwitch] = useState(null);
  
  // Guardamos qual foi a primeira edição para mostrar na mensagem bonitinha do alerta
  const [firstEditInfo, setFirstEditInfo] = useState(null);

  const selectedIds = location.state?.selectedIds || [];
  
  // As empresas ativas nesta edição
  const targetCompanies = useMemo(() => {
    return companies.filter(c => selectedIds.includes(c.id));
  }, [companies, selectedIds]);

  // Define o mês inicial baseado no registro mais recente desse grupo
  useEffect(() => {
     if (globalLoading || currentMonth) return; // Se já escolheu o mes ou ta carregando, ignora
     if (targetCompanies.length === 0) {
        navigate("/enterprises");
        return;
     }
     
     // Caçar o último mês com dados pra essas empresas
     let latestMonth = "";
     targetCompanies.forEach(comp => {
       const entTaxes = taxes.filter(t => t.company_id === comp.id).sort((a,b) => new Date(a.date) - new Date(b.date));
       if (entTaxes.length > 0) {
         const lastDate = entTaxes[entTaxes.length - 1].date; // YYYY-MM-DD
         const yyyy_mm = lastDate.substring(0, 7);
         if (!latestMonth || yyyy_mm > latestMonth) {
            latestMonth = yyyy_mm;
         }
       }
     });
     
     if (!latestMonth) {
        // Fallback pro mês atual real se não tiver histórico
        const now = new Date();
        latestMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
     }
     
     setCurrentMonth(latestMonth);
  }, [globalLoading, targetCompanies, taxes, currentMonth, navigate]);

  // Popula o Grid sempre que o mês atual muda (e não há edição pendente)
  useEffect(() => {
    if (!currentMonth) return;
    const currentMonthFull = `${currentMonth}-01`;
    
    const newState = {};
    targetCompanies.forEach(comp => {
       const record = taxes.find(t => t.company_id === comp.id && t.date === currentMonthFull);
       newState[comp.id] = {};
       taxFields.forEach(f => {
          newState[comp.id][f] = (record && record[f] > 0) ? formatCurrencyInput(record[f].toFixed(2).replace(".", ",")) : "";
       });
    });

    setEditableTaxes(newState);
    setIsDirty(false);
    setFirstEditInfo(null);
  }, [currentMonth, targetCompanies, taxes]);


  const handleTaxChange = (compId, field, val) => {
    if (!isDirty && val !== editableTaxes[compId][field]) {
       setIsDirty(true);
       const compName = targetCompanies.find(c => c.id === compId)?.name || "Empresa";
       setFirstEditInfo({ company: compName, field: FIELD_LABELS[field] });
    }

    setEditableTaxes(prev => {
      const copy = { ...prev };
      copy[compId] = { ...copy[compId], [field]: formatCurrencyInput(val) };
      return copy;
    });
  };

  const shiftValue = (compId, currentFieldIdx, direction) => {
    const targetIdx = currentFieldIdx + direction;
    if (targetIdx < 0 || targetIdx >= taxFields.length) return;
    
    setEditableTaxes(prev => {
      const copy = { ...prev };
      const sourceField = taxFields[currentFieldIdx];
      const targetField = taxFields[targetIdx];
      
      const valToMove = copy[compId][sourceField];
      if (valToMove) { 
        if (!isDirty) {
          setIsDirty(true);
          const compName = targetCompanies.find(c => c.id === compId)?.name || "Empresa";
          setFirstEditInfo({ company: compName, field: FIELD_LABELS[sourceField] });
        }

        const targetFloat = parseCurrencyToFloat(copy[compId][targetField] || "0") || 0;
        const sourceFloat = parseCurrencyToFloat(valToMove) || 0;
        const totalMoved = targetFloat + sourceFloat;
        
        copy[compId] = { ...copy[compId] };
        copy[compId][targetField] = formatCurrencyInput(totalMoved.toFixed(2).replace(".", ","));
        copy[compId][sourceField] = "";
      }
      return copy;
    });
  };

  const executeSave = async (monthOverride = null) => {
    setLoading(true);
    let successCount = 0;
    const monthToSave = monthOverride || currentMonth;
    const dateFull = `${monthToSave}-01`;

    try {
      // Usaremos Promise.all para paralelisar as chamadas ou for loop sincrono
      for (const compId of Object.keys(editableTaxes)) {
         const compTaxes = editableTaxes[compId];
         const existingRecord = taxes.find(t => t.company_id === compId && t.date === dateFull);
         
         const payload = {};
         taxFields.forEach(f => {
            const val = parseCurrencyToFloat(compTaxes[f]) || 0;
            if (val > 0 || (existingRecord && existingRecord[f] !== 0)) {
               payload[f] = val; // Manda os que tem valor ou os que tinham valor outrora e agora foi zerado
            }
         });

         if (Object.keys(payload).length > 0) {
            if (existingRecord) {
               await updateTax(existingRecord.id, payload);
            } else {
               await createTax({ company_id: compId, date: dateFull, ...payload });
            }
            successCount++;
         } else if (existingRecord) {
            // Se ele apagou absolutamente TUDO, talvez mandar um update zerando, ou deletar o record.
            // Para segurança da rotina simplificada, enviamos zero para não apagar a row.
            const zeroPayload = {};
            taxFields.forEach(f => zeroPayload[f] = 0);
            await updateTax(existingRecord.id, zeroPayload);
         }
      }
      addToast(`Lote do mês de ${monthToSave} salvo!`, "success");
      setIsDirty(false);
      setFirstEditInfo(null);
    } catch (err) {
      console.error(err);
      addToast("Erro ao gravar os impostos das empresas.", "error");
      throw err; // Repassa pro catch de cima
    } finally {
      setLoading(false);
    }
  };

  const requestMonthChange = (newMonthValue) => {
     if (isDirty) {
        setPendingMonthSwitch(newMonthValue);
     } else {
        setCurrentMonth(newMonthValue);
     }
  };

  const handlePopupDiscard = () => {
     setCurrentMonth(pendingMonthSwitch);
     setPendingMonthSwitch(null);
     setIsDirty(false);
     setFirstEditInfo(null);
  };

  const handlePopupSave = async () => {
     try {
       await executeSave();
       setCurrentMonth(pendingMonthSwitch);
       setPendingMonthSwitch(null);
     } catch (e) {
       // Permanece no mes atual caso falhe
       setPendingMonthSwitch(null);
     }
  };

  if (globalLoading || !currentMonth) return <div>Carregando Banco de Lotes...</div>;

  return (
    <div className="import-page wizard-layout batch-edit-layout">
      
      {/* Pop-up Customizado do Usuário */}
      {pendingMonthSwitch && (
         <div className="batch-popup-overlay">
            <div className="batch-popup-card">
               <h3>Mudança de Mês Pendente</h3>
               <p>Você alterou o valor de <strong>{firstEditInfo?.field}</strong> da empresa <strong>{firstEditInfo?.company}</strong> (e possivelmente de outras).</p>
               <p>O que deseja fazer com as alterações antes de ir para {pendingMonthSwitch}?</p>
               <div className="batch-popup-actions">
                  <Button variant="secondary" className="discard-btn" onClick={handlePopupDiscard}>
                    Descartar Alterações
                  </Button>
                  <Button onClick={handlePopupSave} isLoading={loading}>
                    Salvar e Avançar
                  </Button>
               </div>
            </div>
         </div>
      )}

      <div className="import-header">
        <div className="title-group">
          <h1>Edição Exclusiva em Lote</h1>
          <p>Manipulação de {targetCompanies.length} empresas de forma super-síncrona.</p>
        </div>
        <div className="actions" style={{ display: 'flex', gap: '15px' }}>
          <div className="batch-month-area">
             <label className="batch-month-label">Mês de Apuração</label>
             <MonthSinglePicker
               value={currentMonth}
               onChange={(val) => requestMonthChange(val)}
             />
          </div>
          <Button variant="secondary" onClick={() => navigate("/enterprises")}>Sair do Lote</Button>
          <Button onClick={() => executeSave()} isLoading={loading} disabled={!isDirty}>
            <Save size={16}/> {isDirty ? "Salvar Base" : "Base Atualizada"}
          </Button>
        </div>
      </div>

      <div className="wizard-container">
         <div className="wizard-table-container">
            <table className="tax-grid-table">
               <thead>
                 <tr>
                   <th style={{ width: "250px" }}>Empresa</th>
                   {taxFields.map(tf => <th key={tf}>{FIELD_LABELS[tf]}</th>)}
                   <th>Total</th>
                 </tr>
               </thead>
               <tbody>
                  {targetCompanies.map(comp => (
                     <tr key={comp.id}>
                       <td className="company-col-wizard">
                         <strong>{comp.name}</strong>
                       </td>
                       {taxFields.map((field, idx) => {
                         const hasValue = !!editableTaxes[comp.id]?.[field];
                         return (
                           <td key={field} className="tax-input-cell">
                              <div className="hover-arrow-container">
                                 {idx > 0 && hasValue && (
                                    <button className="shift-btn shift-left" onClick={() => shiftValue(comp.id, idx, -1)}>
                                      <ChevronLeft size={12}/>
                                    </button>
                                 )}
                                 <input 
                                   type="text" 
                                   value={editableTaxes[comp.id]?.[field] || ""}
                                   onChange={(e) => handleTaxChange(comp.id, field, e.target.value)}
                                   placeholder="-"
                                   className={!editableTaxes[comp.id]?.[field] ? "empty-input" : ""}
                                 />
                                 {idx < taxFields.length - 1 && hasValue && (
                                    <button className="shift-btn shift-right" onClick={() => shiftValue(comp.id, idx, 1)}>
                                      <ChevronRight size={12}/>
                                    </button>
                                 )}
                              </div>
                           </td>
                         );
                       })}
                       <td className="total-cell">
                          {calculateRowTotal(editableTaxes[comp.id] || {})}
                       </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
