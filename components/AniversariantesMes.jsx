import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";

const AniversariantesMes = () => {
  const [aniversariantes, setAniversariantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [todosAniversariantes, setTodosAniversariantes] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Array com nomes dos meses em português
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const mesAtualNome = meses[new Date().getMonth()];

  useEffect(() => {
    const buscarAniversariantes = async () => {
      try {
        const mesAtual = new Date().getMonth() + 1;

        const { data, error } = await supabase
          .from("users")
          .select("nome, sobrenome,foto_perfil, data_nascimento, departamento")
          .eq("ativo", true)
          .not("email", "eq", "admin@sejavertical.com.br");
        if (error) throw error;

        const aniversariantesDoMes = data.filter((colaborador) => {
          if (!colaborador.data_nascimento) return false;
          const dataNascimento = new Date(colaborador.data_nascimento);
          return dataNascimento.getMonth() + 1 === mesAtual;
        });

        const aniversariantesFormatados = aniversariantesDoMes.map(
          (colaborador) => {
            const data = new Date(colaborador.data_nascimento);
            data.setDate(data.getDate() + 1); // Corrige o problema do fuso horário
            // Formata para DD/MM
            const dia = data.getDate().toString().padStart(2, "0");
            const mes = (data.getMonth() + 1).toString().padStart(2, "0");
            return {
              ...colaborador,
              foto: colaborador.foto_perfil,
              dataFormatada: `${dia}/${mes}`,
              departamento: colaborador.departamento,
            };
          },
        );

        // Ordena aniversariantes por data (dia/mês)
        aniversariantesFormatados.sort((a, b) => {
          const [diaA, mesA] = a.dataFormatada.split("/").map(Number);
          const [diaB, mesB] = b.dataFormatada.split("/").map(Number);
          if (mesA !== mesB) return mesA - mesB;
          return diaA - diaB;
        });

        setAniversariantes(aniversariantesFormatados);
      } catch (error) {
        console.error("Erro ao buscar aniversariantes:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarAniversariantes();
  }, []);

  const buscarTodosAniversariantes = async () => {
    setLoadingModal(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("nome, sobrenome, foto_perfil, data_nascimento, departamento")
        .eq("ativo", true)
        .not("email", "eq", "admin@sejavertical.com.br");

      if (error) throw error;

      const aniversariantesFormatados = data
        .filter((colaborador) => colaborador.data_nascimento)
        .map((colaborador) => {
          const data = new Date(colaborador.data_nascimento);
          data.setDate(data.getDate() + 1);
          const dia = data.getDate().toString().padStart(2, "0");
          const mes = (data.getMonth() + 1).toString().padStart(2, "0");
          return {
            ...colaborador,
            foto: colaborador.foto_perfil,
            dataFormatada: `${dia}/${mes}`,
            departamento: colaborador.departamento,
            mes: data.getMonth(),
          };
        })
        .sort((a, b) => {
          const [diaA, mesA] = a.dataFormatada.split("/").map(Number);
          const [diaB, mesB] = b.dataFormatada.split("/").map(Number);
          if (mesA !== mesB) return mesA - mesB;
          return diaA - diaB;
        });

      setTodosAniversariantes(aniversariantesFormatados);
    } catch (error) {
      console.error("Erro ao buscar todos os aniversariantes:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  const abrirModal = () => {
    setModalOpen(true);
    buscarTodosAniversariantes();
  };

  const fecharModal = () => {
    setModalOpen(false);
    setMesSelecionado(new Date().getMonth());
  };

  const aniversariantesFiltrados = todosAniversariantes.filter(
    (aniversariante) => aniversariante.mes === mesSelecionado,
  );

  if (loading) {
    return <div className="p-4">Carregando aniversariantes...</div>;
  }

  return (
    <>
      <div className="rounded-lg border-1 border-[var(--vertical-color)] bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--vertical-color)]">
            Aniversariantes de{" "}
            {mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1)} 🎂
          </h2>
          <button
            onClick={abrirModal}
            className="hover:bg-opacity-90 cursor-pointer rounded-md bg-[var(--vertical-color)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            Ver Todos
          </button>
        </div>
        {aniversariantes.length === 0 ? (
          <p>Não há aniversariantes este mês.</p>
        ) : (
          <div className="grid max-h-72 grid-cols-1 gap-4 overflow-y-scroll">
            {aniversariantes.slice(0).map((aniversariante, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 rounded-lg bg-gray-50 p-3"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <img
                    src={
                      aniversariante.foto || "https://via.placeholder.com/50"
                    }
                    alt={aniversariante.nome}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {aniversariante.nome} {aniversariante.sobrenome}
                  </p>
                  <p className="text-sm text-gray-600">
                    {aniversariante.departamento}
                  </p>
                  <p className="text-sm text-gray-600">
                    {aniversariante.dataFormatada}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para visualizar todos os aniversariantes */}
      {modalOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-[var(--vertical-color)]">
                Aniversariantes do Ano 🎂
              </h2>
              <button
                onClick={fecharModal}
                className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Selecione o mês:
                </label>
                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
                  className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                >
                  {meses.map((mes, index) => (
                    <option key={index} value={index}>
                      {mes.charAt(0).toUpperCase() + mes.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {loadingModal ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">
                    Carregando aniversariantes...
                  </div>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {aniversariantesFiltrados.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      Não há aniversariantes em {meses[mesSelecionado]}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {aniversariantesFiltrados.map((aniversariante, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
                            <img
                              src={
                                aniversariante.foto ||
                                "https://via.placeholder.com/50"
                              }
                              alt={aniversariante.nome}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">
                              {aniversariante.nome} {aniversariante.sobrenome}
                            </p>
                            <p className="truncate text-sm text-gray-600">
                              {aniversariante.departamento}
                            </p>
                            <p className="text-sm font-medium text-[var(--vertical-color)]">
                              {aniversariante.dataFormatada}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AniversariantesMes;
