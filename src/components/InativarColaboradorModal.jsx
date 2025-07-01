import { useState } from "react";
import { supabase } from "../lib/supabaseclient";

export const InativarColaboradorModal = ({
  isOpen,
  onClose,
  colaborador,
  onSuccess,
}) => {
  const [dataSaida, setDataSaida] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          ativo: false,
          saida: dataSaida,
        })
        .eq("id", colaborador.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao inativar colaborador:", error);
      alert("Erro ao inativar colaborador. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-[var(--vertical-color)]">
          Inativar Colaborador
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Você está prestes a inativar o colaborador {colaborador.nome}{" "}
          {colaborador.sobrenome}. Por favor, informe a data de saída.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Data de Saída
            </label>
            <input
              type="date"
              required
              className="w-full rounded-md border px-3 py-2"
              value={dataSaida}
              onChange={(e) => setDataSaida(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Confirmar Inativação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
