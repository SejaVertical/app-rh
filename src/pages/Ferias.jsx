import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabaseclient";
import EditButton from "../components/EditButton";
import ViewButton from "../components/ViewButton";
import { AgendarFeriasModal } from "../components/AgendarFeriasModal";
import { HistoricoFeriasModal } from "../components/HistoricoFeriasModal";
import ExportCSV from "../components/ExportCSV";
import { CollectiveFeriasModal } from "../components/CollectiveFeriasModal";

export const Ferias = () => {
  const [aba, setAba] = useState("ativos");
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);
  const [busca, setBusca] = useState("");
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState("");
  const [cargoSelecionado, setCargoSelecionado] = useState("");
  const [modalAgendarOpen, setModalAgendarOpen] = useState(false);
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);
  const [modalColetivoOpen, setModalColetivoOpen] = useState(false);

  // Função para calcular anos de empresa
  const calcularAnosEmpresa = (dataInicio) => {
    if (!dataInicio) return 0;

    const inicio = new Date(dataInicio);
    const hoje = new Date();

    // Se a data de início ainda não chegou, retorna 0
    if (inicio > hoje) {
      return 0;
    }

    let anos = hoje.getFullYear() - inicio.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesInicio = inicio.getMonth();

    // Ajusta o ano se ainda não completou o aniversário no ano atual
    if (
      mesAtual < mesInicio ||
      (mesAtual === mesInicio && hoje.getDate() < inicio.getDate())
    ) {
      anos--;
    }

    return anos < 0 ? 0 : anos; // Garante que não retorne negativo
  };

  // Função para calcular dias de férias totais
  const calcularDiasFerias = (anosEmpresa) => {
    return anosEmpresa * 30;
  };

  // Função para atualizar os dados no banco
  const atualizarDadosFerias = async (colaborador) => {
    const anosEmpresa = calcularAnosEmpresa(colaborador.inicio);
    const feriasTotais = calcularDiasFerias(anosEmpresa);
    const saldoFerias = feriasTotais - (colaborador.ferias_tiradas || 0);

    const { error } = await supabase
      .from("users")
      .update({
        anos_empresa: anosEmpresa < 0 ? 0 : anosEmpresa,
        ferias_totais: feriasTotais < 0 ? 0 : feriasTotais,
        saldo_ferias: saldoFerias,
      })
      .eq("id", colaborador.id);

    if (error) {
      console.error("Erro ao atualizar dados de férias:", error);
    }
  };

  // Função para formatar data no formato DD/MM/AAAA (cópia exata do Colaboradores.jsx)
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

  const departamentos = [
    ...new Set(colaboradores.map((c) => c.departamento).filter(Boolean)),
  ];
  const cargos = [
    ...new Set(colaboradores.map((c) => c.cargo).filter(Boolean)),
  ];

  //Habilitar quando for consumir os dados do supabase. Comentei para não ficar fazendo requisições infinitas

  useEffect(() => {
    async function fetchColaboradores() {
      const { data, error } = await supabase
        .from("users") // nome da sua tabela no Supabase
        .select("*")
        .not("email", "eq", "admin@sejavertical.com.br");
      if (!error) {
        setColaboradores(data);
        // Atualiza os dados de férias para cada colaborador
        data.forEach((colaborador) => {
          atualizarDadosFerias(colaborador);
        });
      } else {
        alert("Erro ao buscar colaboradores, o banco de dados está offline");
      }
    }
    fetchColaboradores();
  }, []);

  useEffect(() => {
    let filtrados = colaboradores;

    if (busca.trim() !== "") {
      filtrados = filtrados.filter((colab) =>
        `${colab.nome} ${colab.sobrenome}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      );
    }
    if (departamentoSelecionado) {
      filtrados = filtrados.filter(
        (colab) => colab.departamento === departamentoSelecionado,
      );
    }
    if (cargoSelecionado) {
      filtrados = filtrados.filter((colab) => colab.cargo === cargoSelecionado);
    }
    // Filtro de ativos/inativos
    if (aba === "ativos") {
      filtrados = filtrados.filter((colab) => colab.ativo);
    } else if (aba === "inativos") {
      filtrados = filtrados.filter((colab) => !colab.ativo);
    }

    // Ordenação alfabética pelo nome
    filtrados.sort((a, b) => {
      const nomeA = `${a.nome} ${a.sobrenome}`.toLowerCase();
      const nomeB = `${b.nome} ${b.sobrenome}`.toLowerCase();
      return nomeA.localeCompare(nomeB);
    });

    setColaboradoresFiltrados(filtrados);
  }, [busca, colaboradores, departamentoSelecionado, cargoSelecionado, aba]);

  const handleAgendarFerias = (colab) => {
    setColaboradorSelecionado(colab);
    setModalAgendarOpen(true);
  };

  const handleVerHistorico = (colab) => {
    setColaboradorSelecionado(colab);
    setModalHistoricoOpen(true);
  };

  const handleAgendamentoSuccess = async () => {
    // Recarrega os dados do colaborador
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", colaboradorSelecionado.id)
      .single();

    if (!error && data) {
      setColaboradores((prev) =>
        prev.map((colab) => (colab.id === data.id ? data : colab)),
      );
    }
  };

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex flex-1 flex-col bg-gray-50 xl:ml-20">
          <div className="w-full">
            <h1 className="mb-6 ml-10 text-2xl font-bold text-[var(--vertical-color)]">
              Descanso Remunerado
            </h1>
            {/* Botão para férias coletivas */}

            {/* Filtros, abas e ações em uma única div flex */}
            <div className="mb-4 flex flex-wrap items-center justify-center-safe gap-4">
              {/* Abas */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAba("ativos")}
                  className={`rounded-t-md border-b-2 px-4 py-2 font-semibold transition-colors ${
                    aba === "ativos"
                      ? "border-[var(--vertical-color)] bg-white text-[var(--vertical-color)]"
                      : "cursor-pointer border-transparent bg-gray-100 text-gray-500"
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setAba("inativos")}
                  className={`rounded-t-md border-b-2 px-4 py-2 font-semibold transition-colors ${
                    aba === "inativos"
                      ? "border-[var(--vertical-color)] bg-white text-[var(--vertical-color)]"
                      : "cursor-pointer border-transparent bg-gray-100 text-gray-500"
                  }`}
                >
                  Inativos
                </button>
              </div>
              {/* Pesquisas */}
              <input
                type="text"
                placeholder="Pesquisar Colaborador"
                className="w-44 rounded-md border px-3 py-2 text-sm md:w-44"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <select
                className="w-36 rounded-md border px-3 py-2 text-sm md:w-50"
                value={departamentoSelecionado}
                onChange={(e) => setDepartamentoSelecionado(e.target.value)}
              >
                <option value="">Todos Departamentos</option>
                {departamentos.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
              <select
                className="w-36 rounded-md border px-3 py-2 text-sm md:w-40"
                value={cargoSelecionado}
                onChange={(e) => setCargoSelecionado(e.target.value)}
              >
                <option value="">Todos Cargos</option>
                {cargos.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
              {/* Botões */}
              <ExportCSV />
              <button
                className="flex cursor-pointer items-center gap-2 rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-orange-600"
                onClick={() => setModalColetivoOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-9V4m0 0a9 9 0 100 16V4z"
                  />
                </svg>
                Agendar Férias Coletivas
              </button>
            </div>

            {/* Tabela responsiva para telas médias e grandes */}
            <div className="hidden w-full rounded-lg bg-white shadow xl:block">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Nome
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Departamento
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Cargo
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Data Contratação
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Anos
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Descanso Total
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Descanso Usado
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Saldo
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Saída
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Status
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white text-xs">
                    {colaboradoresFiltrados.length === 0 ? (
                      <tr>
                        <td
                          className="px-2 py-4 text-center text-gray-400 md:px-4"
                          colSpan="13"
                        >
                          Nenhum colaborador cadastrado.
                        </td>
                      </tr>
                    ) : (
                      colaboradoresFiltrados.map((colab) => (
                        <tr key={colab.id}>
                          <td className="px-2 py-3 whitespace-nowrap md:px-4">
                            {colab.nome} {colab.sobrenome}
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            {colab.departamento}
                          </td>
                          <td className="px-2 py-3 md:px-4">{colab.cargo}</td>
                          <td className="px-2 py-3 md:px-4">
                            {formatarData(colab.inicio)}
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            {colab.anos_empresa}
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            {colab.ferias_totais}
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            {colab.ferias_tiradas}
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            <span
                              className={`${
                                colab.saldo_ferias < 0
                                  ? "font-semibold text-red-600"
                                  : colab.saldo_ferias > 0
                                    ? "font-semibold text-green-600"
                                    : ""
                              }`}
                            >
                              {colab.saldo_ferias}
                            </span>
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            {formatarData(colab.saida)}
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            {
                              <span
                                className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                                  colab.ativo
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {colab.ativo ? "Ativo" : "Inativo"}
                              </span>
                            }
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAgendarFerias(colab)}
                                className="cursor-pointer rounded-md bg-[var(--vertical-color)] px-2 py-2 text-xs font-medium text-white hover:bg-orange-600"
                              >
                                Agendar
                              </button>
                              <button
                                onClick={() => handleVerHistorico(colab)}
                                className="cursor-pointer rounded-md bg-gray-200 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-300"
                              >
                                Histórico
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards responsivos para telas pequenas */}
            <div className="block w-full xl:hidden">
              {colaboradoresFiltrados.length === 0 ? (
                <div className="rounded-lg bg-white py-4 text-center text-gray-400 shadow">
                  Nenhum colaborador cadastrado.
                </div>
              ) : (
                colaboradoresFiltrados.map((colab) => (
                  <div
                    key={colab.id}
                    className="mb-4 flex flex-col gap-2 rounded-lg bg-white p-4 shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold text-[var(--vertical-color)]">
                          {colab.nome} {colab.sobrenome}
                        </div>
                        <div className="text-xs text-gray-500">
                          {colab.cargo} - {colab.departamento}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-700">
                      <b>Data Contratação:</b> {formatarData(colab.inicio)}
                    </div>
                    <div className="text-xs text-gray-700">
                      <b>Anos de Empresa:</b> {colab.anos_empresa}
                    </div>
                    <div className="text-xs text-gray-700">
                      <b>Descanso Total:</b> {colab.ferias_totais}
                    </div>
                    <div className="text-xs text-gray-700">
                      <b>Descanso Usado:</b> {colab.ferias_tiradas}
                    </div>
                    <div className="text-xs text-gray-700">
                      <b>Saldo:</b>{" "}
                      <span
                        className={`${
                          colab.saldo_ferias < 0
                            ? "font-semibold text-red-600"
                            : colab.saldo_ferias > 0
                              ? "font-semibold text-green-600"
                              : ""
                        }`}
                      >
                        {colab.saldo_ferias}
                      </span>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleAgendarFerias(colab)}
                        className="rounded-md bg-[var(--vertical-color)] px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
                      >
                        Agendar
                      </button>
                      <button
                        onClick={() => handleVerHistorico(colab)}
                        className="rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                      >
                        Histórico
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
      <CollectiveFeriasModal
        isOpen={modalColetivoOpen}
        onClose={() => setModalColetivoOpen(false)}
        colaboradores={colaboradores}
        onSuccess={() => {
          // Recarregue os colaboradores após agendamento coletivo
          window.location.reload();
        }}
      />
      {colaboradorSelecionado && (
        <>
          <AgendarFeriasModal
            isOpen={modalAgendarOpen}
            onClose={() => setModalAgendarOpen(false)}
            colaborador={colaboradorSelecionado}
            onSuccess={handleAgendamentoSuccess}
          />
          <HistoricoFeriasModal
            isOpen={modalHistoricoOpen}
            onClose={() => setModalHistoricoOpen(false)}
            colaborador={colaboradorSelecionado}
          />
        </>
      )}
    </>
  );
};
