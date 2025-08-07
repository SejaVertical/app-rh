import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseclient";
import {
  FaTimes,
  FaPlusCircle,
  FaSpinner,
  FaCheckCircle,
  FaHistory,
  FaSave,
  FaWindowClose,
  FaExclamationTriangle,
  FaTrash,
  FaPaperclip,
  FaEye,
} from "react-icons/fa";

const AvaliacoesPendentesModal = ({ isOpen, onClose, onUpdate }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [loadingId, setLoadingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [addingForId, setAddingForId] = useState(null);
  const [viewingHistoryForId, setViewingHistoryForId] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newAnexo, setNewAnexo] = useState(null);
  const [newAnexoPreview, setNewAnexoPreview] = useState(null);

  const processAndSortCollaborators = (data) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const processed = data.map((c) => {
      let isPending = false;
      let lastReviewDate = null;

      if (!c.avaliacoes_desempenho || c.avaliacoes_desempenho.length === 0) {
        isPending = true;
      } else {
        lastReviewDate = new Date(
          Math.max(...c.avaliacoes_desempenho.map((date) => new Date(date))),
        );
        if (lastReviewDate < sixMonthsAgo) {
          isPending = true;
        }
      }
      return { ...c, isPending, lastReviewDate };
    });

    processed.sort((a, b) => {
      if (a.isPending && !b.isPending) return -1;
      if (!a.isPending && b.isPending) return 1;
      return a.nome.localeCompare(b.nome);
    });

    return processed;
  };

  const fetchCollaborators = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, nome, sobrenome, ativo, avaliacoes_desempenho, avaliacoes_desempenho_anexos",
        )
        .eq("ativo", true)
        .not("email", "eq", "admin@sejavertical.com.br");
      if (error) throw error;

      const sortedData = processAndSortCollaborators(data);
      setCollaborators(sortedData);
    } catch (err) {
      console.error("Erro ao buscar colaboradores:", err);
      setError("Falha ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleUpdate = () => {
    fetchCollaborators(); // Refresca a lista do modal
    onUpdate(); // Refresca o card do dashboard
  };

  const handleAnexoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewAnexo(e.target.files[0]);
      setNewAnexoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSaveReview = async (collaborator) => {
    if (!newDate) {
      alert("Por favor, selecione uma data.");
      return;
    }
    setLoadingId(collaborator.id);
    setSuccessId(null);

    const dateToSave = new Date(newDate).toISOString();
    const currentReviews = collaborator.avaliacoes_desempenho || [];
    const newReviews = [...currentReviews, dateToSave];

    // --- Upload do anexo ---
    let anexoUrl = null;
    if (newAnexo) {
      const fileExt = newAnexo.name.split(".").pop();
      const fileName = `${collaborator.id}-${Date.now()}-${newAnexo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avaliacoes-desempenho")
        .upload(fileName, newAnexo);
      if (uploadError) {
        alert("Erro ao fazer upload do anexo: " + uploadError.message);
        setLoadingId(null);
        return;
      }
      anexoUrl = supabase.storage
        .from("avaliacoes-desempenho")
        .getPublicUrl(fileName).data.publicUrl;
    }

    // --- Atualizar anexos ---
    let currentAnexos = collaborator.avaliacoes_desempenho_anexos || [];
    let newAnexos = [...currentAnexos, anexoUrl];

    try {
      const { error } = await supabase
        .from("users")
        .update({
          avaliacoes_desempenho: newReviews,
          avaliacoes_desempenho_anexos: newAnexos,
        })
        .eq("id", collaborator.id);

      if (error) throw error;

      setSuccessId(collaborator.id);
      handleUpdate();
      setAddingForId(null);
      setNewAnexo(null);
      setNewAnexoPreview(null);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err) {
      console.error("Erro ao adicionar avaliação:", err);
      alert("Falha ao adicionar avaliação. Tente novamente.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteReview = async (collaborator, dateToDelete) => {
    if (!window.confirm("Tem certeza que deseja excluir esta avaliação?")) {
      return;
    }
    setLoadingId(collaborator.id);
    setDeletingIndex(dateToDelete);

    // Encontrar o índice da avaliação a ser removida
    const indexToDelete = collaborator.avaliacoes_desempenho.findIndex(
      (date) => date === dateToDelete,
    );

    // Remover a data e o anexo correspondente
    const newReviews = collaborator.avaliacoes_desempenho.filter(
      (date) => date !== dateToDelete,
    );
    let newAnexos = collaborator.avaliacoes_desempenho_anexos || [];
    let anexoToDelete = null;
    if (newAnexos.length > indexToDelete && indexToDelete !== -1) {
      anexoToDelete = newAnexos[indexToDelete];
      newAnexos = newAnexos.filter((_, i) => i !== indexToDelete);
    }

    try {
      // Se houver anexo, remover do bucket
      if (anexoToDelete) {
        // Extrair o nome do arquivo da URL
        const urlParts = anexoToDelete.split("/");
        const fileName = urlParts[urlParts.length - 1].split("?")[0];
        const { error: removeError } = await supabase.storage
          .from("avaliacoes-desempenho")
          .remove([fileName]);
        if (removeError) {
          console.error("Erro ao remover anexo do bucket:", removeError);
          alert("Erro ao remover anexo do bucket: " + removeError.message);
        }
      }

      const { error } = await supabase
        .from("users")
        .update({
          avaliacoes_desempenho: newReviews,
          avaliacoes_desempenho_anexos: newAnexos,
        })
        .eq("id", collaborator.id);

      if (error) throw error;

      handleUpdate();
    } catch (err) {
      console.error("Erro ao excluir avaliação:", err);
      alert("Falha ao excluir avaliação. Tente novamente.");
    } finally {
      setLoadingId(null);
      setDeletingIndex(null);
    }
  };

  const handleToggleHistory = (id) => {
    setViewingHistoryForId((currentId) => (currentId === id ? null : id));
    setAddingForId(null);
  };

  const handleShowAddForm = (id) => {
    setAddingForId(id);
    setNewDate(new Date().toISOString().split("T")[0]);
    setViewingHistoryForId(null);
  };

  const handleCancelAdd = () => {
    setAddingForId(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-xs">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--vertical-color)]">
            Gerenciar Avaliações
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-gray-800"
          >
            <FaTimes size={24} />
          </button>
        </div>
        <div className="overflow-y-auto">
          {loading && <p>Carregando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <ul className="divide-y divide-gray-200">
              {collaborators.map((c) => (
                <li key={c.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">
                        {c.nome} {c.sobrenome}
                      </span>
                      <div className="flex items-center text-sm">
                        {c.isPending ? (
                          <span className="flex items-center gap-1 font-bold text-yellow-600">
                            <FaExclamationTriangle />
                            Pendente
                          </span>
                        ) : (
                          <span className="font-bold text-green-600">
                            Em dia
                          </span>
                        )}
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-500">
                          Última:{" "}
                          {c.lastReviewDate
                            ? new Date(c.lastReviewDate).toLocaleDateString(
                                "pt-BR",
                                { timeZone: "UTC" },
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    {addingForId !== c.id && successId !== c.id && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShowAddForm(c.id)}
                          className="flex cursor-pointer items-center rounded-md bg-[var(--vertical-color)] px-3 py-1 text-sm text-white transition duration-300 hover:bg-amber-600"
                        >
                          <FaPlusCircle className="mr-2" />
                          Adicionar
                        </button>
                        <button
                          onClick={() => handleToggleHistory(c.id)}
                          className="flex cursor-pointer items-center rounded-md bg-gray-500 px-3 py-1 text-sm text-white transition duration-300 hover:bg-gray-600"
                        >
                          <FaHistory className="mr-2" />
                          Histórico
                        </button>
                      </div>
                    )}
                    {successId === c.id && (
                      <div className="flex items-center text-green-500">
                        <FaCheckCircle className="mr-2" />
                        <span>Salvo com sucesso!</span>
                      </div>
                    )}
                  </div>
                  {addingForId === c.id && (
                    <div className="animate-fade-in-down mt-3 flex flex-col gap-2 rounded-lg bg-gray-50 p-3 md:flex-row md:items-center md:justify-between md:gap-0">
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="focus:ring-opacity-50 mb-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 md:mb-0"
                      />
                      <div className="flex items-center">
                        <label
                          htmlFor="anexo-upload"
                          className="mr-2 flex cursor-pointer items-center rounded-md border border-blue-300 bg-blue-100 px-3 py-1 text-sm text-blue-700 transition hover:bg-blue-200"
                        >
                          <FaPaperclip className="mr-2" />
                          {newAnexo ? newAnexo.name : "Adicionar anexo"}
                          <input
                            id="anexo-upload"
                            type="file"
                            onChange={handleAnexoChange}
                            className="hidden"
                          />
                        </label>
                        {newAnexoPreview && (
                          <a
                            href={newAnexoPreview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-blue-600 underline"
                          >
                            Pré-visualizar
                          </a>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 md:mt-0">
                        <button
                          onClick={() => handleSaveReview(c)}
                          disabled={loadingId === c.id}
                          className="flex items-center rounded-md bg-green-500 px-3 py-1 text-sm text-white transition duration-300 hover:bg-green-600 disabled:bg-gray-400"
                        >
                          {loadingId === c.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaSave className="mr-2" />
                          )}
                          Salvar
                        </button>
                        <button
                          onClick={handleCancelAdd}
                          className="flex items-center rounded-md bg-red-500 px-3 py-1 text-sm text-white transition duration-300 hover:bg-red-600"
                        >
                          <FaWindowClose className="mr-2" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {viewingHistoryForId === c.id && (
                    <div className="animate-fade-in-down mt-3 rounded-lg bg-gray-50 p-3">
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">
                        Histórico de Avaliações:
                      </h4>
                      {c.avaliacoes_desempenho &&
                      c.avaliacoes_desempenho.length > 0 ? (
                        <ul className="list-inside list-disc space-y-1">
                          {[...c.avaliacoes_desempenho]
                            .sort((a, b) => new Date(b) - new Date(a))
                            .map((date, index) => {
                              // Encontrar o índice original da data (pois o array foi ordenado)
                              const originalIndex =
                                c.avaliacoes_desempenho.findIndex(
                                  (d) => d === date,
                                );
                              const anexoUrl =
                                c.avaliacoes_desempenho_anexos &&
                                c.avaliacoes_desempenho_anexos[originalIndex];
                              return (
                                <li
                                  key={index}
                                  className="flex items-center justify-between text-gray-600"
                                >
                                  <span className="flex items-center gap-2">
                                    {new Date(date).toLocaleDateString(
                                      "pt-BR",
                                      {
                                        timeZone: "UTC",
                                      },
                                    )}
                                    {anexoUrl && (
                                      <a
                                        href={anexoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 flex items-center gap-1 text-blue-600 hover:underline"
                                        title="Visualizar anexo"
                                      >
                                        <FaEye />{" "}
                                        <span className="hidden md:inline">
                                          Anexo
                                        </span>
                                      </a>
                                    )}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteReview(c, date)}
                                    disabled={loadingId === c.id}
                                    className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                                  >
                                    {loadingId === c.id &&
                                    deletingIndex === date ? (
                                      <FaSpinner className="animate-spin" />
                                    ) : (
                                      <FaTrash />
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Nenhuma avaliação encontrada.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvaliacoesPendentesModal;
