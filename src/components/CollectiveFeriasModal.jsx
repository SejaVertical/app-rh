import React, { useState } from "react";
import { supabase } from "../lib/supabaseclient";

export const CollectiveFeriasModal = ({
  isOpen,
  onClose,
  colaboradores,
  onSuccess,
}) => {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const calcularDias = () => {
    if (!inicio || !fim) return 0;
    const start = new Date(inicio);
    const end = new Date(fim);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleAgendar = async () => {
    setLoading(true);
    setErro(null);
    const dias = calcularDias();

    if (dias <= 0) {
      setErro("Selecione um intervalo de datas válido.");
      setLoading(false);
      return;
    }

    // Filtra colaboradores elegíveis
    const inicioDate = new Date(inicio);
    const colaboradoresElegiveis = colaboradores.filter((colab) => {
      if (!colab.inicio || !colab.ativo) return false;
      const dataInicioColab = new Date(colab.inicio);
      return dataInicioColab <= inicioDate;
    });

    if (colaboradoresElegiveis.length === 0) {
      setErro(
        "Nenhum colaborador está elegível para este período de férias coletivas.",
      );
      setLoading(false);
      return;
    }

    try {
      // Atualiza apenas os colaboradores elegíveis
      const updates = colaboradoresElegiveis.map(async (colab) => {
        const novoUsado = (colab.ferias_tiradas || 0) + dias;
        const novoSaldo = (colab.saldo_ferias || 0) - dias;

        // Garante que data_ferias é array
        let datasFerias = Array.isArray(colab.data_ferias)
          ? [...colab.data_ferias]
          : [];
        datasFerias.push(inicio, fim);

        // Atualiza o colaborador
        await supabase
          .from("users")
          .update({
            ferias_tiradas: novoUsado,
            saldo_ferias: novoSaldo,
            data_ferias: datasFerias, // Salva como array igual ao individual
          })
          .not("email", "eq", "admin@sejavertical.com.br")
          .eq("id", colab.id)
          .eq("ativo", true);

        // Opcional: você pode registrar o histórico de férias coletivas em outra tabela
      });

      await Promise.all(updates);
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      setErro("Erro ao agendar férias coletivas.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-[var(--vertical-color)]">
          Agendar Descanso Coletivo
        </h2>
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-sm font-medium">Início</label>
          <input
            type="date"
            className="rounded border px-3 py-2"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
          <label className="text-sm font-medium">Fim</label>
          <input
            type="date"
            className="rounded border px-3 py-2"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
          <div className="mt-2 text-xs text-gray-500">
            Dias de descanso coletivo: <b>{calcularDias()}</b>
          </div>
        </div>
        {erro && (
          <div className="mb-2 rounded bg-red-100 px-3 py-2 text-sm text-red-600">
            {erro}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            className="cursor-pointer rounded bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="cursor-pointer rounded bg-[var(--vertical-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            onClick={handleAgendar}
            disabled={loading}
          >
            {loading ? "Agendando..." : "Agendar Descanso Coletivo"}
          </button>
        </div>
      </div>
    </div>
  );
};
