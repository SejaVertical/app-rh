import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseclient";

// === Config ===
const BUCKET_EVENTOS = "app-rh-eventos"; // bucket correto

// Utilitário para formatar data+hora em pt-BR
function formatarData(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const buscarEventos = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const { data, error } = await supabase
        .from("rh_eventos")
        .select(
          "id_evento, titulo_evento, descricao_evento, data_evento, capa_evento",
        )
        .order("data_evento", { ascending: false }); // mais recentes primeiro
      if (error) throw error;
      setEventos(data || []);
    } catch (e) {
      console.error("Erro ao buscar eventos:", e);
      setErro("Não foi possível carregar os eventos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarEventos();
  }, [buscarEventos]);

  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    titulo_evento: "",
    descricao_evento: "",
    data_evento: "",
    hora_evento: "", // campo de hora
    capa_file: null, // arquivo opcional (somente upload)
  });
  const [formErro, setFormErro] = useState("");

  // Modal de detalhes (visualização)
  const [detalheEvento, setDetalheEvento] = useState(null);
  const abrirDetalhes = (ev) => setDetalheEvento(ev);
  const fecharDetalhes = () => setDetalheEvento(null);

  // Modal de confirmação de exclusão
  const [eventoParaExcluir, setEventoParaExcluir] = useState(null);

  const resetForm = () => {
    setForm({
      titulo_evento: "",
      descricao_evento: "",
      data_evento: "",
      hora_evento: "",
      capa_file: null,
    });
    setFormErro("");
  };

  async function uploadCapa(file) {
    if (!file) return "";
    const ext = file.name.split(".").pop();
    const filePath = `capa_${Date.now()}.${ext}`;
    const { error: upError } = await supabase.storage
      .from(BUCKET_EVENTOS)
      .upload(filePath, file, { upsert: false });
    if (upError) throw upError;
    const { data } = supabase.storage
      .from(BUCKET_EVENTOS)
      .getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSalvarEvento(e) {
    e?.preventDefault?.();
    setFormErro("");

    if (!form.titulo_evento?.trim()) {
      setFormErro("Título é obrigatório.");
      return;
    }
    if (!form.data_evento) {
      setFormErro("Data do evento é obrigatória.");
      return;
    }
    if (!form.hora_evento) {
      setFormErro("Hora do evento é obrigatória.");
      return;
    }

    try {
      setSalvando(true);
      let capaFinal = "";
      if (form.capa_file) {
        capaFinal = await uploadCapa(form.capa_file);
      }
      const dataHoraISO = `${form.data_evento}T${form.hora_evento}:00`;

      const insertObj = {
        titulo_evento: form.titulo_evento.trim(),
        descricao_evento: form.descricao_evento?.trim() || "",
        data_evento: dataHoraISO,
        capa_evento: capaFinal || null, // apenas URL pública no banco
      };

      const { data, error } = await supabase
        .from("rh_eventos")
        .insert([insertObj])
        .select()
        .single();

      if (error) throw error;

      setEventos((prev) => [data, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error("Erro ao salvar evento:", e);
      setFormErro(e.message || "Falha ao salvar evento.");
    } finally {
      setSalvando(false);
    }
  }

  // Agora essa função só exclui; a confirmação vem do modal estilizado
  async function handleExcluirEvento(id) {
    try {
      const { error } = await supabase
        .from("rh_eventos")
        .delete()
        .eq("id_evento", id);
      if (error) throw error;
      setEventos((prev) => prev.filter((e) => e.id_evento !== id));
    } catch (e) {
      console.error("Erro ao excluir evento:", e);
      alert("Não foi possível excluir o evento.");
    }
  }

  return (
    <div className="rounded-lg border-1 border-[var(--vertical-color)] bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--vertical-color)]">
          Eventos e Avisos
        </h2>
        <button
          type="button"
          className="hover:bg-opacity-90 cursor-pointer rounded-xl bg-[var(--vertical-color)] px-4 py-2 text-sm font-medium text-white transition-colors"
          onClick={() => setShowModal(true)}
        >
          + Novo
        </button>
      </div>

      {/* Estado: Carregando */}
      {carregando && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border"
            >
              <div className="h-40 w-full bg-gray-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 bg-gray-200" />
                <div className="h-3 w-full bg-gray-200" />
                <div className="h-3 w-5/6 bg-gray-200" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Estado: Erro */}
      {!carregando && erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {erro}
        </div>
      )}

      {/* Estado: Vazio */}
      {!carregando && !erro && eventos.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
          Nenhum evento encontrado.
        </div>
      )}

      {/* Lista (3 por linha, 2 linhas, com overflow) */}
      {!carregando && !erro && eventos.length > 0 && (
        <div style={{ maxHeight: "720px", overflowY: "auto" }}>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((ev) => (
              <li
                key={ev.id_evento}
                className="group overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg"
              >
                <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                  <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                    {ev.capa_evento ? (
                      <img
                        src={ev.capa_evento || "/placeholder-evento.jpg"}
                        alt={ev.titulo_evento}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-evento.jpg";
                        }}
                      />
                    ) : null}
                  </div>
                  {ev.data_evento && (
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800 shadow">
                      {formatarData(ev.data_evento)}
                    </span>
                  )}
                  {ev.data_evento && (
                    <span className="absolute top-3 right-3 rounded-full bg-[var(--vertical-color)]/90 px-3 py-1 text-xs font-medium text-white shadow">
                      {(() => {
                        const agora = new Date();
                        const alvo = new Date(ev.data_evento);
                        const diffMs = alvo - agora;
                        const umDia = 1000 * 60 * 60 * 24;
                        if (diffMs > 0) {
                          const diffDias = Math.floor(diffMs / umDia);
                          const resto = diffMs % umDia;
                          const diffHoras = Math.ceil(resto / (1000 * 60 * 60));
                          if (diffDias >= 1) {
                            return diffDias === 1
                              ? "1 dia restante"
                              : `${diffDias} dias restantes`;
                          }
                          return diffHoras <= 1
                            ? "menos de 1h"
                            : `${diffHoras}h restantes`;
                        } else {
                          const diffDiasPassados = Math.floor(
                            Math.abs(diffMs) / umDia,
                          );
                          if (diffDiasPassados === 0) return "Hoje";
                          return diffDiasPassados === 1
                            ? "1 dia atrás"
                            : `${diffDiasPassados} dias atrás`;
                        }
                      })()}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
                    {ev.titulo_evento}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {ev.descricao_evento}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => abrirDetalhes(ev)}
                    >
                      Detalhes
                    </button>
                    <button
                      type="button"
                      className="ml-2 cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-gray-50"
                      onClick={() => setEventoParaExcluir(ev)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de detalhes do evento */}
      {detalheEvento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === "Escape" && fecharDetalhes()}
        >
          <div className="absolute inset-0" onClick={fecharDetalhes} />

          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-semibold text-[var(--vertical-color)]">
                {detalheEvento.titulo_evento}
              </h3>
              <button
                type="button"
                className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100"
                onClick={fecharDetalhes}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="px-4 pb-4">
              <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gray-100">
                {detalheEvento.capa_evento ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detalheEvento.capa_evento}
                    alt={detalheEvento.titulo_evento}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                {detalheEvento.data_evento && (
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800 shadow">
                    {formatarData(detalheEvento.data_evento)}
                  </span>
                )}
              </div>

              {detalheEvento.data_evento && (
                <div className="mt-3 text-xs text-gray-600">
                  {(() => {
                    const agora = new Date();
                    const alvo = new Date(detalheEvento.data_evento);
                    const diffMs = alvo - agora;
                    const umDia = 1000 * 60 * 60 * 24;
                    if (diffMs > 0) {
                      const diffDias = Math.floor(diffMs / umDia);
                      const resto = diffMs % umDia;
                      const diffHoras = Math.ceil(resto / (1000 * 60 * 60));
                      if (diffDias >= 1)
                        return diffDias === 1
                          ? "1 dia restante"
                          : `${diffDias} dias restantes`;
                      return diffHoras <= 1
                        ? "menos de 1h restante"
                        : `${diffHoras}h restantes`;
                    } else {
                      const diffDiasPassados = Math.floor(
                        Math.abs(diffMs) / umDia,
                      );
                      if (diffDiasPassados === 0) return "Hoje";
                      return diffDiasPassados === 1
                        ? "1 dia atrás"
                        : `${diffDiasPassados} dias atrás`;
                    }
                  })()}
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  Descrição
                </h4>
                <p className="mt-1 text-sm whitespace-pre-line text-gray-700">
                  {detalheEvento.descricao_evento || "Sem descrição."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={fecharDetalhes}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {eventoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setEventoParaExcluir(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirmar exclusão
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Tem certeza que deseja excluir o evento{" "}
              <span className="font-medium">
                {eventoParaExcluir.titulo_evento}
              </span>
              ? Essa ação não poderá ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => setEventoParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={async () => {
                  await handleExcluirEvento(eventoParaExcluir.id_evento);
                  setEventoParaExcluir(null);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cadastro (somente upload de arquivo) */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
        >
          <div
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
          />

          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <form onSubmit={handleSalvarEvento}>
              <div className="flex items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-[var(--vertical-color)]">
                  Novo evento
                </h3>
                <button
                  type="button"
                  className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100"
                  onClick={() => setShowModal(false)}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 p-4">
                {formErro && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {formErro}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Título *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--vertical-color)] focus:outline-none"
                    value={form.titulo_evento}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, titulo_evento: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Descrição
                  </label>
                  <textarea
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--vertical-color)] focus:outline-none"
                    rows={4}
                    value={form.descricao_evento}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        descricao_evento: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Data *
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--vertical-color)] focus:outline-none"
                      value={form.data_evento}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, data_evento: e.target.value }))
                      }
                      required
                    />
                    {/* Campo hora logo após a data (mantendo classes existentes) */}
                    <div className="mt-2">
                      <label className="mb-1 block text-sm font-medium">
                        Hora *
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--vertical-color)] focus:outline-none"
                        value={form.hora_evento}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            hora_evento: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Anexar capa (imagem)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="file:hover:bg-opacity-90 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[var(--vertical-color)] file:px-4 file:py-2 file:text-white"
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          capa_file: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Anexar a imagem em formato JPEG ou PNG
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t p-4">
                <p className="mt-1 text-xs text-gray-500">
                  Será disparado um email para todos os colaboradores vertical,
                  com informações sobre o evento
                </p>

                <button
                  type="button"
                  className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="hover:bg-opacity-90 cursor-pointer rounded-lg bg-[var(--vertical-color)] px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
