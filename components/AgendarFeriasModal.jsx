import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseclient";

function formatarData(data) {
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
}

// Função utilitária para garantir formato YYYY-MM-DD
function toInputDateString(date) {
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const AgendarFeriasModal = ({
  isOpen,
  onClose,
  colaborador,
  onSuccess,
}) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [anosEmpresa, setAnosEmpresa] = useState(0);
  const [feriasTotais, setFeriasTotais] = useState(0);
  const [feriasTiradas, setFeriasTiradas] = useState(0);
  const [saldoFerias, setSaldoFerias] = useState(0);
  const [datasFerias, setDatasFerias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [novoInicio, setNovoInicio] = useState("");
  const [novoFim, setNovoFim] = useState("");

  useEffect(() => {
    if (colaborador) {
      setAnosEmpresa(colaborador.anos_empresa || 0);
      setFeriasTotais(colaborador.ferias_totais || 0);
      setFeriasTiradas(colaborador.ferias_tiradas || 0);
      setSaldoFerias(colaborador.saldo_ferias || 0);
      setDatasFerias(colaborador.data_ferias || []);
    }
  }, [colaborador]);

  // Resetar campos ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setDataInicio("");
      setDataFim("");
      setEditando(false);
      setNovoInicio("");
      setNovoFim("");
    }
  }, [isOpen]);

  const calcularDiasFerias = (inicio, fim) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 para incluir o dia inicial
  };

  // Agendar novas férias (apenas datas)
  const handleAgendar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let novasDatasFerias = [...datasFerias];
      let novoFeriasTiradas = feriasTiradas;
      let novoSaldoFerias = saldoFerias;
      if (dataInicio && dataFim) {
        const diasFerias = calcularDiasFerias(dataInicio, dataFim);
        novasDatasFerias = [...novasDatasFerias, dataInicio, dataFim];
        novoFeriasTiradas = Number(novoFeriasTiradas) + diasFerias;
        novoSaldoFerias = Number(feriasTotais) - Number(novoFeriasTiradas);
      }
      const { error } = await supabase
        .from("users")
        .update({
          ferias_tiradas: Number(novoFeriasTiradas),
          saldo_ferias: Number(novoSaldoFerias),
          data_ferias: novasDatasFerias,
        })
        .eq("id", colaborador.id);
      if (error) throw error;
      await onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao agendar férias:", error);
      alert("Erro ao agendar férias. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Editar informações completas
  const handleEditar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          anos_empresa: Number(anosEmpresa),
          ferias_totais: Number(feriasTotais),
          ferias_tiradas: Number(feriasTiradas),
          saldo_ferias: Number(saldoFerias),
          data_ferias: datasFerias,
        })
        .eq("id", colaborador.id);
      if (error) throw error;
      await onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar informações de férias:", error);
      alert(
        "Erro ao salvar informações de férias. Por favor, tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar um período do histórico
  const handleEditarPeriodo = (idx, campo, valor) => {
    setDatasFerias((prev) => {
      const novo = [...prev];
      novo[idx] = valor;
      return novo;
    });
  };

  // Função para remover um período do histórico
  const handleRemoverPeriodo = (idx) => {
    setDatasFerias((prev) => {
      const novo = [...prev];
      novo.splice(idx, 2); // Remove o par (início e fim)
      return novo;
    });
  };

  // Função para adicionar novo período manualmente
  const handleAdicionarPeriodo = () => {
    if (novoInicio && novoFim) {
      setDatasFerias((prev) => [...prev, novoInicio, novoFim]);
      setNovoInicio("");
      setNovoFim("");
    }
  };

  if (!isOpen) return null;

  // Pega a última férias tirada (último par de datas)
  let ultimaFerias = null;
  if (datasFerias.length >= 2) {
    const len = datasFerias.length;
    ultimaFerias = [datasFerias[len - 2], datasFerias[len - 1]];
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-[var(--vertical-color)]">
          Agendar Descanso de {colaborador.nome}
        </h2>
        {!editando ? (
          <form onSubmit={handleAgendar}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Último Descanso Remunerado:
              </label>
              {ultimaFerias ? (
                <div className="text-sm text-gray-700">
                  {formatarData(ultimaFerias[0])} até{" "}
                  {formatarData(ultimaFerias[1])}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Nenhum período registrado
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Data de Início
              </label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Data de Fim
              </label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="cursor-pointer rounded-md bg-orange-200 px-4 py-2 text-sm font-medium text-orange-800 hover:bg-orange-300"
              >
                Editar informações adicionais
              </button>
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer rounded-md bg-[var(--vertical-color)] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Agendar"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEditar}>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Anos de Empresa
              </label>
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={anosEmpresa}
                onChange={(e) => setAnosEmpresa(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Descanso Total
              </label>
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={feriasTotais}
                onChange={(e) => setFeriasTotais(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Descanso Usado
              </label>
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={feriasTiradas}
                onChange={(e) => setFeriasTiradas(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Saldo de Descanso
              </label>
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={saldoFerias}
                onChange={(e) => setSaldoFerias(e.target.value)}
              />
            </div>
            {/* Histórico editável */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Histórico
              </label>
              {datasFerias.length === 0 && (
                <div className="text-xs text-gray-500">
                  Nenhum período registrado
                </div>
              )}
              {datasFerias.map((data, idx) =>
                idx % 2 === 0 ? (
                  <div key={idx} className="mb-2 flex items-center gap-2">
                    <input
                      type="date"
                      className="rounded-md border px-2 py-1 text-xs"
                      value={toInputDateString(data)}
                      onChange={(e) =>
                        handleEditarPeriodo(idx, "inicio", e.target.value)
                      }
                    />
                    <span className="text-xs">até</span>
                    <input
                      type="date"
                      className="rounded-md border px-2 py-1 text-xs"
                      value={toInputDateString(datasFerias[idx + 1])}
                      onChange={(e) =>
                        handleEditarPeriodo(idx + 1, "fim", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="ml-2 cursor-pointer rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
                      onClick={() => handleRemoverPeriodo(idx)}
                    >
                      Remover
                    </button>
                  </div>
                ) : null,
              )}
              {/* Adicionar novo período manualmente */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  className="rounded-md border px-2 py-1 text-xs"
                  value={novoInicio}
                  onChange={(e) => setNovoInicio(e.target.value)}
                  placeholder="Início"
                />
                <span className="text-xs">até</span>
                <input
                  type="date"
                  className="rounded-md border px-2 py-1 text-xs"
                  value={novoFim}
                  onChange={(e) => setNovoFim(e.target.value)}
                  placeholder="Fim"
                />
                <button
                  type="button"
                  className="ml-2 cursor-pointer rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
                  onClick={handleAdicionarPeriodo}
                >
                  Adicionar
                </button>
              </div>
            </div>
            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer rounded-md bg-[var(--vertical-color)] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
