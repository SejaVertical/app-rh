import { useState } from "react";

export const HistoricoFeriasModal = ({ isOpen, onClose, colaborador }) => {
  const [loading] = useState(false);

  const formatarData = (data) => {
    if (!data) return "-";
    try {
      // Se já estiver no formato correto, retorna como está
      if (typeof data === "string" && data.includes("/")) {
        return data;
      }
      // Tenta criar uma data válida
      const dataObj = new Date(data);
      // Verifica se a data é válida
      if (isNaN(dataObj.getTime())) {
        return data; // Retorna o valor original se não conseguir converter
      }
      // Usa UTC para evitar problemas de fuso horário
      const dia = dataObj.getUTCDate().toString().padStart(2, "0");
      const mes = (dataObj.getUTCMonth() + 1).toString().padStart(2, "0");
      const ano = dataObj.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return data; // Retorna o valor original em caso de erro
    }
  };

  const calcularDiasFerias = (inicio, fim) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 para incluir o dia inicial
  };

  if (!isOpen) return null;

  // Agrupa as datas em pares (início e fim)
  const historico = [];
  const datas = colaborador?.data_ferias || [];

  for (let i = 0; i < datas.length; i += 2) {
    if (i + 1 < datas.length) {
      historico.push({
        inicio: datas[i],
        fim: datas[i + 1],
        dias: calcularDiasFerias(datas[i], datas[i + 1]),
      });
    }
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--vertical-color)]">
            Histórico de Férias
          </h2>
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>

        {loading ? (
          <div className="text-center">Carregando...</div>
        ) : historico.length === 0 ? (
          <div className="text-center text-gray-500">
            Nenhum registro de férias encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Período
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Dias
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historico.map((registro, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      {formatarData(registro.inicio)} -{" "}
                      {formatarData(registro.fim)}
                    </td>
                    <td className="px-4 py-2">{registro.dias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
