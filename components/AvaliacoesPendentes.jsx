import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseclient";
import { FaUsers, FaExclamationCircle } from "react-icons/fa";

const AvaliacoesPendentes = ({ onViewClick }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingCollaborators, setPendingCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, nome, avaliacoes_desempenho")
        .eq("ativo", true)
        .not("email", "eq", "admin@sejavertical.com.br");

      if (error) {
        throw error;
      }

      const pending = data.filter((colaborator) => {
        if (
          !colaborator.avaliacoes_desempenho ||
          colaborator.avaliacoes_desempenho.length === 0
        ) {
          // Se não há nenhuma avaliação, considera-se pendente se a data de admissão foi há mais de 6 meses (lógica a ser implementada se necessário)
          // Por agora, consideramos pendente se o array está vazio.
          return true;
        }

        // Encontra a data mais recente no array
        const mostRecentDate = new Date(
          Math.max(
            ...colaborator.avaliacoes_desempenho.map((date) => new Date(date)),
          ),
        );

        return mostRecentDate < sixMonthsAgo;
      });

      setPendingCount(pending.length);
      setPendingCollaborators(pending);
    } catch (err) {
      console.error("Erro ao buscar avaliações pendentes:", err);
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  return (
    <div className="flex h-full flex-col justify-center rounded-lg border-1 border-[var(--vertical-color)] bg-white p-6 shadow-md">
      <div className="flex flex-col items-center text-center">
        <div>
          <h3 className="text-2xs font-semibold whitespace-nowrap text-[var(--vertical-color)]">
            Avaliações Pendentes
          </h3>
          <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
        </div>
      </div>
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-500">
          <FaExclamationCircle className="mr-1" /> {error}
        </div>
      )}
      <button
        onClick={onViewClick}
        disabled={loading || !!error}
        className="mt-4 w-full cursor-pointer rounded-md bg-yellow-500 px-4 py-2 text-white transition duration-300 hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? "Carregando..." : "Gerenciar"}
      </button>
    </div>
  );
};

export default AvaliacoesPendentes;
