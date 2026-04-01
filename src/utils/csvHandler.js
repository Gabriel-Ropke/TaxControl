import { formatMonthShortPt } from "./formatters.js";
import { getTotalFromRecord } from "./taxUtils.js";

/**
 * Gera um arquivo CSV dinâmico em formato Pivô (Linhas = Empresas, Colunas = Meses).
 * Usamos ponto e vírgula (;) e conversão para vírgula no decimal para abrir lindamente no Excel BR.
 * 
 * @param {Array} companies Lista de empresas
 * @param {Array} taxes Lista de impostos
 * @param {String} targetField Qual campo exportar (ex: 'simple', 'pis', ou 'total')
 */
export function exportPivotCSV(companies, taxes, targetField = "total") {
  // 1. Encontrar todos os meses únicos já lançados, em ordem cronológica
  const uniqueDates = [...new Set(taxes.map(t => t.date))]
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b));

  // Cabeçalho: "Empresa;jan/26;fev/26;..."
  const headers = ["Empresa", ...uniqueDates.map(d => formatMonthShortPt(d))];

  // 2. Construir matriz de linhas
  const rows = companies.map(company => {
    const row = [company.name]; // Primeira coluna é o nome

    uniqueDates.forEach(date => {
      // Procura a exata célula de mês daquela empresa
      const record = taxes.find(t => t.company_id === company.id && t.date === date);
      
      let val = null;
      if (record) {
        if (targetField === "total") {
          val = getTotalFromRecord(record);
        } else {
          val = record[targetField];
        }
      }

      // Converte Float para formato Excel Brasileiro (Ex: 496.66 -> "496,66")
      if (val != null) {
        row.push(val.toFixed(2).replace(".", ","));
      } else {
        row.push("R$ -"); // Representação visual de nulo/vazio
      }
    });

    return row;
  });

  // 3. Compilar String CSV
  const csvContent = [
    headers.join(";"),
    ...rows.map(r => r.join(";"))
  ].join("\n");

  // 4. Disparar Download Programaticamente (UTF-8 BOM para garantir acentos no Excel)
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `Impostometro_Exportacao_${targetField}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
