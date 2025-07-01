import React from "react";
import { supabase } from "../lib/supabaseclient";
import Papa from "papaparse";

async function exportCSV() {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, nome, sobrenome, telefone, cargo, departamento, data_nascimento, observacoes, ativo, inicio, cpf, cnpj, endereco, cidade, uf, remuneracao, regime_contratacao, escolaridade, saida, valor_beneficios, valor_total_remuneracao, email_pessoal, beneficios, ultima_avaliacao_desempenho, anos_empresa, ferias_totais, ferias_tiradas, saldo_ferias, data_ferias",
    );

  if (error) {
    console.error("Erro ao buscar dados:", error);
    return;
  }

  try {
    const csv = Papa.unparse(data); // papaparse exporta JSON para CSV

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "colaboradores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erro ao converter para CSV:", error);
  }
}

const ExportCSV = () => {
  return (
    <button
      className="inline-flex cursor-pointer rounded-md bg-[var(--vertical-color)] px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-600"
      onClick={exportCSV}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 16v-8m0 8l-3-3m3 3l3-3M4 20h16"
        />
      </svg>
      Exportar CSV
    </button>
  );
};

export default ExportCSV;
