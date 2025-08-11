import { useState } from "react";
import { supabase } from "../lib/supabaseclient";

export const ReativarColaboradorModal = ({
  isOpen,
  onClose,
  colaborador,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          ativo: true,
          saida: null, // Remove a data de saída
        })
        .eq("id", colaborador.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao reativar colaborador:", error);
      alert("Erro ao reativar colaborador. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-[var(--vertical-color)]">
          Reativar Colaborador
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Você está prestes a reativar o colaborador {colaborador.nome}{" "}
          {colaborador.sobrenome}. Esta ação irá remover a data de saída e
          restaurar o acesso do colaborador.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="cursor-pointer rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Confirmar Reativação"}
          </button>
        </div>
      </div>
    </div>
  );
};
