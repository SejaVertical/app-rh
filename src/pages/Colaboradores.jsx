import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabaseclient";
import EditButton from "../components/EditButton";
import ViewButton from "../components/ViewButton";
import CadastroModal from "../components/CadastroModal";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import { InativarColaboradorModal } from "../components/InativarColaboradorModal";
import { ReativarColaboradorModal } from "../components/ReativarColaboradorModal";
import { FaExclamationTriangle } from "react-icons/fa";
import ExportCSV from "../components/ExportCSV";

const Colaboradores = () => {
  const [aba, setAba] = useState("ativos");
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);
  const [busca, setBusca] = useState("");
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState("");
  const [cargoSelecionado, setCargoSelecionado] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalInativarOpen, setModalInativarOpen] = useState(false);
  const [modalReativarOpen, setModalReativarOpen] = useState(false);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);

  // Função para formatar data no formato DD/MM/AAAA
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

  const getUltimaAvaliacao = (avaliacoes) => {
    if (!avaliacoes || avaliacoes.length === 0) {
      return "-";
    }
    const dataMaisRecente = new Date(
      Math.max(...avaliacoes.map((data) => new Date(data))),
    );
    return formatarData(dataMaisRecente);
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

  const handleEdit = (colaborador) => {
    setColaboradorSelecionado(colaborador);
    setIsEditModalOpen(true);
  };

  const handleView = (colaborador) => {
    setColaboradorSelecionado(colaborador);
    setIsViewModalOpen(true);
  };

  const handleInativarColaborador = (colab) => {
    setColaboradorSelecionado(colab);
    setModalInativarOpen(true);
  };

  const handleReativarColaborador = (colab) => {
    setColaboradorSelecionado(colab);
    setModalReativarOpen(true);
  };

  const handleInativacaoSuccess = async () => {
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

  const verificarDadosFaltantes = (colab) => {
    const dadosFaltantes = [];
    if (!colab.nome) dadosFaltantes.push("nome");
    if (!colab.sobrenome) dadosFaltantes.push("sobrenome");
    if (!colab.foto_perfil) dadosFaltantes.push("foto_perfil");
    if (!colab.departamento) dadosFaltantes.push("departamento");
    if (!colab.cargo) dadosFaltantes.push("cargo");
    if (!colab.inicio) dadosFaltantes.push("inicio");
    if (!colab.cpf) dadosFaltantes.push("cpf");
    if (!colab.cnpj) dadosFaltantes.push("cnpj");
    if (!colab.telefone) dadosFaltantes.push("telefone");
    if (!colab.email) dadosFaltantes.push("email");
    if (!colab.email_pessoal) dadosFaltantes.push("email_pessoal");
    if (!colab.data_nascimento) dadosFaltantes.push("data_nascimento");
    if (!colab.endereco) dadosFaltantes.push("endereco");
    if (!colab.cidade) dadosFaltantes.push("cidade");
    if (!colab.uf) dadosFaltantes.push("uf");
    if (colab.remuneracao == null || colab.remuneracao == 0)
      dadosFaltantes.push("remuneracao");
    if (colab.valor_beneficios == null || colab.valor_beneficios == 0)
      dadosFaltantes.push("valor_beneficios");
    if (
      colab.valor_total_remuneracao == null ||
      colab.valor_total_remuneracao == 0
    )
      dadosFaltantes.push("valor_total_remuneracao");
    if (!colab.regime_contratacao) dadosFaltantes.push("regime_contratacao");
    if (!colab.escolaridade) dadosFaltantes.push("escolaridade");
    if (!colab.beneficios || colab.beneficios.length === 0)
      dadosFaltantes.push("Benefícios");
    if (!colab.anexos || colab.anexos.length === 0)
      dadosFaltantes.push("Anexos");

    return dadosFaltantes;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col bg-gray-50 xl:ml-20">
        <div className="w-full">
          <h1 className="mb-6 ml-10 text-2xl font-bold text-[var(--vertical-color)]">
            Colaboradores
          </h1>
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
            <button
              onClick={() => {
                setIsOpen(true);
              }}
              className="cursor-pointer rounded-md bg-[var(--vertical-color)] px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Cadastrar Colaborador
            </button>
            <ExportCSV />
            <CadastroModal
              isOpen={isOpen}
              setModalClose={() => setIsOpen(false)}
            />
            <EditModal
              isOpen={isEditModalOpen}
              setModalClose={() => setIsEditModalOpen(false)}
              colaborador={colaboradorSelecionado}
            />
            <ViewModal
              isOpen={isViewModalOpen}
              setModalClose={() => setIsViewModalOpen(false)}
              colaborador={colaboradorSelecionado}
            />
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
                      Foto
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
                    {aba === "inativos" && (
                      <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                        Saída
                      </th>
                    )}
                    <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                      CPF
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                      CNPJ
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                      Telefone
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:px-4">
                      E-mail Corporativo
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase md:px-4">
                      Última A.D:
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
                    colaboradoresFiltrados.map((colab) => {
                      const dadosFaltantes = verificarDadosFaltantes(colab);
                      return (
                        <tr key={colab.id}>
                          <td className="px-2 py-3 whitespace-nowrap md:px-4">
                            <div>
                              {colab.nome} {colab.sobrenome}
                              {dadosFaltantes.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-orange-500">
                                  <FaExclamationTriangle />
                                  {dadosFaltantes.length}{" "}
                                  {dadosFaltantes.length === 1
                                    ? "campo"
                                    : "campos"}{" "}
                                  faltando
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            <img
                              className="h-8 w-8 rounded-full"
                              src={colab.foto_perfil}
                              alt="foto do colaborador"
                            />
                          </td>
                          <td className="px-2 py-3 md:px-4">
                            {colab.departamento}
                          </td>
                          <td className="px-2 py-3 md:px-4">{colab.cargo}</td>
                          <td className="px-2 py-3 md:px-4">
                            {formatarData(colab.inicio)}
                          </td>
                          {aba === "inativos" && (
                            <td className="px-2 py-3 md:px-4">
                              {formatarData(colab.saida)}
                            </td>
                          )}
                          <td className="px-2 py-3 whitespace-nowrap md:px-4">
                            {colab.cpf}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap md:px-4">
                            {colab.cnpj}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap md:px-4">
                            {colab.telefone}
                          </td>
                          <td className="px-2 py-3 md:px-4">{colab.email}</td>
                          <td className="px-2 py-3 md:px-4">
                            {getUltimaAvaliacao(colab.avaliacoes_desempenho)}
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
                              <button onClick={() => handleEdit(colab)}>
                                <EditButton />
                              </button>
                              <button onClick={() => handleView(colab)}>
                                <ViewButton />
                              </button>
                              {colab.ativo ? (
                                <button
                                  onClick={() =>
                                    handleInativarColaborador(colab)
                                  }
                                  className="cursor-pointer rounded-md bg-red-600 px-2 py-2 text-xs font-medium text-white hover:bg-red-700"
                                >
                                  Inativar
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleReativarColaborador(colab)
                                  }
                                  className="cursor-pointer rounded-md bg-green-600 px-2 py-2 text-xs font-medium text-white hover:bg-green-700"
                                >
                                  Reativar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <span className="ml-3 text-[var(--vertical-color)]">
                Total de colaboradores: {colaboradoresFiltrados.length}
              </span>
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
                    <img
                      className="h-12 w-12 rounded"
                      src={colab.foto_perfil}
                      alt="foto do colaborador"
                    />
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
                  {aba === "inativos" && (
                    <div className="text-xs text-gray-700">
                      <b>Saída:</b> {formatarData(colab.saida)}
                    </div>
                  )}
                  <div className="text-xs text-gray-700">
                    <b>CPF:</b> {colab.cpf}
                  </div>
                  <div className="text-xs text-gray-700">
                    <b>CNPJ:</b> {colab.cnpj}
                  </div>
                  <div className="text-xs text-gray-700">
                    <b>Telefone:</b> {colab.telefone}
                  </div>
                  <div className="text-xs text-gray-700">
                    <b>E-mail:</b> {colab.email}
                  </div>
                  <div className="text-xs text-gray-700">
                    <b>Última A.D:</b>{" "}
                    {getUltimaAvaliacao(colab.avaliacoes_desempenho)}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button onClick={() => handleEdit(colab)} className="">
                      <EditButton />
                    </button>
                    <button onClick={() => handleView(colab)} className="">
                      <ViewButton />
                    </button>
                    {colab.ativo ? (
                      <button
                        onClick={() => handleInativarColaborador(colab)}
                        className="cursor-pointer rounded-md bg-red-600 px-2 py-2 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Inativar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReativarColaborador(colab)}
                        className="cursor-pointer rounded-md bg-green-600 px-2 py-2 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      {colaboradorSelecionado && (
        <>
          <InativarColaboradorModal
            isOpen={modalInativarOpen}
            onClose={() => setModalInativarOpen(false)}
            colaborador={colaboradorSelecionado}
            onSuccess={handleInativacaoSuccess}
          />
          <ReativarColaboradorModal
            isOpen={modalReativarOpen}
            onClose={() => setModalReativarOpen(false)}
            colaborador={colaboradorSelecionado}
            onSuccess={handleInativacaoSuccess}
          />
        </>
      )}
    </div>
  );
};

export default Colaboradores;
