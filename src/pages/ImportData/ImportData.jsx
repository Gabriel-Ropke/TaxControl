import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud, Save, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useCompaniesAndTaxes } from "../../hooks/useCompaniesAndTaxes";
import { useToast } from "../../contexts/ToastContext";
import { createCompany, createTax, updateTax } from "../../services/api";
import { taxFields, FIELD_LABELS } from "../../utils/taxUtils";
import { formatCurrencyInput, parseCurrencyToFloat } from "../../utils/formatters";
import "./importData.css";

// Tenta interpretar "jan/26", etc.
const parseHeaderToDate = (headerStr) => {
  const mapPt = { jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06", jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12" };
  const letters = headerStr.toLowerCase().match(/[a-z]{3}/);
  const numbers = headerStr.match(/\d{2,4}/);
  
  if (letters && numbers) {
    const mm = mapPt[letters[0]];
    const yStr = numbers[0];
    const yyyy = yStr.length === 2 ? `20${yStr}` : yStr;
    if (mm) return `${yyyy}-${mm}-01`;
  }
  return null;
};

// Calcula Total de uma linha de impostos (objeto { simple: "R$ 10", pis: "" })
const calculateRowTotal = (taxesRecord) => {
  let acc = 0;
  taxFields.forEach(field => {
    acc += parseCurrencyToFloat(taxesRecord[field] || "") || 0;
  });
  return acc > 0 ? formatCurrencyInput(acc.toFixed(2).replace(".", ",")) : "";
};

export function ImportData() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { companies, taxes } = useCompaniesAndTaxes();

  const [loading, setLoading] = useState(false);
  
  // importData = { rawFile: string, months: [date1, date2], companies: [ { _uid, name, action, conflictCompanyId, taxes: { [date]: { simple: "", pis: "", ... } } } ] }
  const [importData, setImportData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const processParsedData = (dataMatrix, fileName) => {
    try {
      let headerRowIndex = -1;
      let validHeaders = [];
      let headerDates = [];

      for (let i = 0; i < Math.min(dataMatrix.length, 20); i++) {
        const row = dataMatrix[i];
        if (!row) continue;
        const tempValid = [];
        const tempDates = [];
        row.forEach((cellVal, idx) => {
          if (!cellVal) return;
          const parsedDate = parseHeaderToDate(String(cellVal));
          if (parsedDate) {
            tempValid.push(idx);
            tempDates.push(parsedDate);
          }
        });
        if (tempDates.length > 0) {
          headerRowIndex = i;
          validHeaders = tempValid;
          headerDates = tempDates;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("Não encontramos as colunas de meses (ex: jan/26) nas linhas iniciais do arquivo.");
      }

      const parsedCompanies = [];
      const firstDateCol = validHeaders[0];
      
      for (let i = headerRowIndex + 1; i < dataMatrix.length; i++) {
        const row = dataMatrix[i];
        if (!row || row.length === 0) continue;
        
        let compName = "";
        for (let c = 0; c < firstDateCol; c++) {
          if (row[c] && String(row[c]).trim()) {
            compName = String(row[c]).trim();
            break;
          }
        }
        
        if (!compName) continue;
        
        const exactMatch = companies.find(c => c.name.toLowerCase() === compName.toLowerCase());
        let action = exactMatch ? "merge" : "create";
        
        let monthHasAnyValueGlobally = false;
        let taxesObj = {};
        
        validHeaders.forEach((colIdx, countIdx) => {
          const rawVal = row[colIdx];
          const masked = rawVal ? formatCurrencyInput(String(rawVal)) : "";
          const floatVal = parseCurrencyToFloat(masked) || 0;
          
          taxesObj[headerDates[countIdx]] = {
            simple: floatVal > 0 ? masked : "",
            pis: "", cofins: "", csll: "", irpj: "", iss_icms: "", efd_reinf: ""
          };
        });

        // Nós inserimos a empresa se tiver algo, mas o filtro real de "mês vazio" faremos a seguir.
        parsedCompanies.push({
          _uid: Math.random().toString(36).substr(2, 9),
          name: compName,
          action: action,
          conflictCompanyId: exactMatch ? exactMatch.id : null,
          taxes: taxesObj
        });
      }

      // Agora, vamos filtrar do array de `months` (headerDates) os meses que deram ZERO na planilha INTEIRA.
      const activeMonths = headerDates.filter(month => {
         return parsedCompanies.some(comp => {
            return taxFields.some(f => (parseCurrencyToFloat(comp.taxes[month][f]) || 0) > 0);
         });
      });

      if (activeMonths.length === 0) {
         throw new Error("Nenhuma movimentação financeira real (valor > 0) foi encontrada nos meses do arquivo.");
      }

      setImportData({ 
        rawFile: fileName, 
        months: activeMonths, 
        companies: parsedCompanies 
      });
      setCurrentStep(0);
    } catch(err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      Papa.parse(file, {
        complete: (results) => processParsedData(results.data, file.name),
        error: () => { addToast("Houve um erro indesejado na leitura do CSV", "error"); setLoading(false); }
      });
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const dataMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
        processParsedData(dataMatrix, file.name);
      } catch (err) {
        addToast("Erro Excel.", "error"); setLoading(false);
      }
    }
  };

  const handleActionChange = (uid, action) => {
    setImportData(prev => {
      const copy = { ...prev };
      const comp = copy.companies.find(c => c._uid === uid);
      if (comp) comp.action = action;
      return copy;
    });
  };

  const handleTaxChange = (uid, month, field, val) => {
    setImportData(prev => {
      const copy = { ...prev };
      const comp = copy.companies.find(c => c._uid === uid);
      if (comp) {
        comp.taxes[month][field] = formatCurrencyInput(val);
      }
      return copy;
    });
  };

  // Move o valor de um input para o lado (se possível)
  const shiftValue = (uid, month, currentFieldIdx, direction) => {
    const targetIdx = currentFieldIdx + direction;
    if (targetIdx < 0 || targetIdx >= taxFields.length) return; // Fora dos limites
    
    setImportData(prev => {
      const copy = { ...prev };
      const comp = copy.companies.find(c => c._uid === uid);
      if (comp) {
        const sourceField = taxFields[currentFieldIdx];
        const targetField = taxFields[targetIdx];
        
        const valToMove = comp.taxes[month][sourceField];
        if (valToMove) { // só move se tiver string
          // Se o destino já tem valor, soma os dois!
          const targetFloat = parseCurrencyToFloat(comp.taxes[month][targetField] || "0") || 0;
          const sourceFloat = parseCurrencyToFloat(valToMove) || 0;
          const totalMoved = targetFloat + sourceFloat;
          
          comp.taxes[month][targetField] = formatCurrencyInput(totalMoved.toFixed(2).replace(".", ","));
          comp.taxes[month][sourceField] = ""; // Limpa a origem
        }
      }
      return copy;
    });
  };

  const handleSubmitBatch = async () => {
    setLoading(true);
    let successCount = 0;
    try {
      for (const comp of importData.companies) {
        let targetCompId = null;
        if (comp.action === "merge" && comp.conflictCompanyId) {
          targetCompId = comp.conflictCompanyId;
        } else if (comp.action === "create") {
          const newComp = await createCompany({ name: comp.name, tax_type: "simple" });
          targetCompId = newComp.id;
        }
        if (!targetCompId) continue;

        for (const month of importData.months) {
          const taxesOfThisMonth = comp.taxes[month];
          const hasAnyData = taxFields.some(f => (parseCurrencyToFloat(taxesOfThisMonth[f]) || 0) > 0);
          if (!hasAnyData) continue;

          // Processamento do Imposto
          const existingRecord = taxes.find(t => t.company_id === targetCompId && t.date === month);

          const payload = {};
          taxFields.forEach(f => {
            const val = parseCurrencyToFloat(taxesOfThisMonth[f]) || 0;
            if (val > 0 || (existingRecord && existingRecord[f] !== 0)) {
               // Atualiza injetando os valores lidos da UI. Somente preenche o payload os não-nulos digitados ou os que já preencheu.
               if (val > 0) payload[f] = val;
            }
          });
          
          if (Object.keys(payload).length === 0) continue;

          if (existingRecord) {
            await updateTax(existingRecord.id, payload);
          } else {
            await createTax({ company_id: targetCompId, date: month, ...payload });
          }
        }
        successCount++;
      }
      addToast(`Sucesso! Exportamos impostos para ${successCount} empresas!`, "success");
      navigate("/enterprises");
    } catch (e) {
      console.error(e);
      addToast("Erro catástrofico ao subir os lote.", "error");
    } finally {
      setLoading(false);
    }
  };


  // --- RENDERS DO WIZARD ---

  const renderMonthStep = () => {
    const currentMonthDate = importData.months[currentStep];
    const monthStr = new Date(currentMonthDate).toLocaleString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }); // fuso UTC evita escorregar dia
    // Filtramos empresas que tem ALGUM dinheiro no Simple/PIS...etc de acordo com a memoria
    const companiesToDisplay = importData.companies.filter(c => {
       return taxFields.some(f => (parseCurrencyToFloat(c.taxes[currentMonthDate][f]) || 0) > 0);
    });

    return (
      <div className="wizard-step">
        <div className="step-header">
           <h2>Valores de {monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}</h2>
           <p>Valide e edite (se necessário) a distribuição dos tributos coletados nas colunas deste mês.</p>
        </div>

        {companiesToDisplay.length === 0 ? (
          <div className="empty-month-state">Nenhuma movimentação identificada neste mês.</div>
        ) : (
          <div className="wizard-table-container">
            <table className="tax-grid-table">
              <thead>
                <tr>
                  <th style={{ width: "250px" }}>Empresa Encontrada</th>
                  {taxFields.map(tf => <th key={tf}>{FIELD_LABELS[tf]}</th>)}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {companiesToDisplay.map(comp => (
                  <tr key={comp._uid}>
                    <td className="company-col-wizard">
                      <strong>{comp.name}</strong>
                      {comp.conflictCompanyId ? (
                         <select 
                           className={`conflict-resolver ${comp.action === 'merge' ? 'resolved-merge' : ''}`}
                           value={comp.action}
                           onChange={(e) => handleActionChange(comp._uid, e.target.value)}
                         >
                           <option value="merge">✓ Mesclar</option>
                           <option value="create">+ Criar Nova</option>
                         </select>
                      ) : (
                         <span className="status-badge">Nova</span>
                      )}
                    </td>

                    {/* RENDERIZADOR DOS CAMPOS MAIS AS SETINHAS NO HOVER */}
                    {taxFields.map((field, idx) => {
                      const hasValue = !!comp.taxes[currentMonthDate][field];
                      return (
                        <td key={field} className="tax-input-cell">
                           <div className="hover-arrow-container">
                              {idx > 0 && hasValue && (
                                 <button className="shift-btn shift-left" onClick={() => shiftValue(comp._uid, currentMonthDate, idx, -1)}>
                                   <ChevronLeft size={12}/>
                                 </button>
                              )}
                              <input 
                                type="text" 
                                value={comp.taxes[currentMonthDate][field]}
                                onChange={(e) => handleTaxChange(comp._uid, currentMonthDate, field, e.target.value)}
                                placeholder="-"
                                className={!comp.taxes[currentMonthDate][field] ? "empty-input" : ""}
                              />
                              {idx < taxFields.length - 1 && hasValue && (
                                 <button className="shift-btn shift-right" onClick={() => shiftValue(comp._uid, currentMonthDate, idx, 1)}>
                                   <ChevronRight size={12}/>
                                 </button>
                              )}
                           </div>
                        </td>
                      );
                    })}

                    <td className="total-cell">
                      {calculateRowTotal(comp.taxes[currentMonthDate])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderFinalReview = () => {
    return (
      <div className="wizard-step wizard-final">
        <div className="step-header">
           <h2>Revisão Final Magnífica</h2>
           <p>Todas os meses foram processados e revisados nas tabelas anteriores. Confira o retrato global abaixo antes de aplicar oficialmente na base de dados.</p>
        </div>
        
        <div className="review-stacks">
           {importData.months.map(month => {
             const mStr = new Date(month).toLocaleString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
             
             const activeCompsList = importData.companies.filter(c => {
               const rowTaxes = c.taxes[month];
               let rowSum = 0;
               taxFields.forEach(f => { rowSum += parseCurrencyToFloat(rowTaxes[f] || "") || 0 });
               return rowSum > 0;
             });

             if (activeCompsList.length === 0) return null;
             
             const totalMoney = activeCompsList.reduce((acc, c) => acc + (parseCurrencyToFloat(calculateRowTotal(c.taxes[month])) || 0), 0);

             return (
               <div key={month} className="review-month-card">
                 <div className="card-header">
                   <h3><CheckCircle2 size={16} color="var(--positive-color)"/> {mStr.toUpperCase()}</h3>
                   <span>{activeCompsList.length} Empresa(s) apurada(s)</span>
                 </div>
                 
                 <div className="review-table-preview">
                    {activeCompsList.map(comp => {
                      const fieldsPopulated = taxFields.filter(f => (parseCurrencyToFloat(comp.taxes[month][f] || "") || 0) > 0);
                      return (
                         <div key={comp._uid} className="review-row">
                            <strong>{comp.action === 'merge' ? '✓ ' : '+ '}{comp.name}</strong>
                            <div className="review-taxes-tags">
                               {fieldsPopulated.map(f => (
                                 <span key={f}>{FIELD_LABELS[f]}: {comp.taxes[month][f]}</span>
                               ))}
                            </div>
                         </div>
                      );
                    })}
                 </div>

                 <h2 className="card-total-money">{formatCurrencyInput(totalMoney.toFixed(2).replace(".", ","))} Total do Mês</h2>
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="import-page wizard-layout">
      <div className="import-header">
        <div className="title-group">
          <h1>Importador Inteligente Mês a Mês</h1>
          {importData && <p>Planilha Ocupada: {importData.rawFile}</p>}
        </div>
        <div className="actions">
          {!importData && <Button variant="secondary" onClick={() => navigate("/enterprises")}>Voltar para Empresas</Button>}
        </div>
      </div>

      {!importData && (
        <label className="csv-upload-box">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            onChange={handleFileUpload} 
            onClick={(e) => { e.target.value = null; }} 
          />
          <UploadCloud size={40} color="var(--color-accent)"/>
          <p>Clique ou arraste a planilha (CSV ou XLSX) para iniciar o mapeamento.</p>
          <span style={{ fontSize: "11px", color: "var(--tertiary-text)"}}>Iniciaremos um assistente onde você moldará mês a mês.</span>
        </label>
      )}

      {importData && (
         <div className="wizard-container">
            {/* INDICADOR DE PASSOS */}
            <div className="wizard-stepper">
               {importData.months.map((m, idx) => (
                  <div key={m} className={`stepper-dot ${idx === currentStep ? "active" : idx < currentStep ? "done" : ""}`}>
                     <span className="dot"></span>
                     {new Date(m).toLocaleString("pt-BR", { month: "short", timeZone: "UTC" })}
                  </div>
               ))}
               <div className={`stepper-dot ${currentStep === importData.months.length ? "active" : ""}`}>
                  <span className="dot"></span> Revisão
               </div>
            </div>

            {/* CONTEUDO DO WIZARD */}
            <div className="wizard-stage">
              {currentStep < importData.months.length ? renderMonthStep() : renderFinalReview()}
            </div>

            {/* CONTROLES DO RODAPE */}
            <div className="wizard-controls">
               <Button variant="secondary" onClick={() => {
                 if (window.confirm("Isso reverterá todo o seu rascunho de importação. Deseja sair?")) setImportData(null);
               }}>Cancelar Importação</Button>

               <div className="nav-buttons">
                  {currentStep > 0 && (
                     <Button variant="link" onClick={() => setCurrentStep(prev => prev - 1)}>
                       Voltar um mês
                     </Button>
                  )}
                  
                  {currentStep < importData.months.length ? (
                     <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                       Guardar e Avançar Mês <ChevronRight size={16}/>
                     </Button>
                  ) : (
                     <Button onClick={handleSubmitBatch} isLoading={loading}>
                       <Save size={16}/> Processar Importação Mestre
                     </Button>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
