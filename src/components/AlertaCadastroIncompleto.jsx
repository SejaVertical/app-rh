import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseclient"; // Ajuste o caminho se necessário
import { FaExclamationTriangle, FaArrowRight } from "react-icons/fa";

const AlertaCadastroIncompleto = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [incompleteColaboratorsDetails, setIncompleteColaboratorsDetails] =
    useState([]);

  const verificarDadosFaltantes = (colaborador) => {
    const dadosFaltantes = [];
    if (!colaborador.nome || colaborador.nome.trim() === "")
      dadosFaltantes.push("Nome");
    if (!colaborador.sobrenome || colaborador.sobrenome.trim() === "")
      dadosFaltantes.push("Sobrenome");
    if (!colaborador.foto_perfil || colaborador.foto_perfil.trim() === "")
      dadosFaltantes.push("Foto de Perfil");
    if (!colaborador.departamento || colaborador.departamento.trim() === "")
      dadosFaltantes.push("Departamento");
    if (!colaborador.cargo || colaborador.cargo.trim() === "")
      dadosFaltantes.push("Cargo");
    if (!colaborador.inicio || colaborador.inicio.trim() === "")
      dadosFaltantes.push("Data de Início");
    if (!colaborador.cpf || colaborador.cpf.trim() === "")
      dadosFaltantes.push("CPF");
    if (!colaborador.cnpj || colaborador.cnpj.trim() === "")
      dadosFaltantes.push("CNPJ");
    if (!colaborador.telefone || colaborador.telefone.trim() === "")
      dadosFaltantes.push("Telefone");
    if (!colaborador.email || colaborador.email.trim() === "")
      dadosFaltantes.push("E-mail Corporativo");
    if (!colaborador.email_pessoal || colaborador.email_pessoal.trim() === "")
      dadosFaltantes.push("E-mail Pessoal");
    if (
      !colaborador.data_nascimento ||
      colaborador.data_nascimento.trim() === ""
    )
      dadosFaltantes.push("Data de Nascimento");
    if (!colaborador.endereco || colaborador.endereco.trim() === "")
      dadosFaltantes.push("Endereço");
    if (!colaborador.cidade || colaborador.cidade.trim() === "")
      dadosFaltantes.push("Cidade");
    if (!colaborador.uf || colaborador.uf.trim() === "")
      dadosFaltantes.push("UF");
    if (colaborador.remuneracao == null || colaborador.remuneracao == 0)
      dadosFaltantes.push("Remuneração");
    if (
      colaborador.valor_beneficios == null ||
      colaborador.valor_beneficios == 0
    )
      dadosFaltantes.push("Valor dos Benefícios");
    if (
      colaborador.valor_total_remuneracao == null ||
      colaborador.valor_total_remuneracao == 0
    )
      dadosFaltantes.push("Valor Total da Remuneração");
    if (
      !colaborador.regime_contratacao ||
      colaborador.regime_contratacao.trim() === ""
    )
      dadosFaltantes.push("Regime de Contratação");
    if (!colaborador.escolaridade || colaborador.escolaridade.trim() === "")
      dadosFaltantes.push("Escolaridade");
    if (!colaborador.beneficios || colaborador.beneficios.length === 0)
      dadosFaltantes.push("Benefícios");
    if (!colaborador.anexos || colaborador.anexos.length === 0)
      dadosFaltantes.push("Anexos");

    return dadosFaltantes;
  };

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .not("email", "eq", "admin@sejavertical.com.br");
        if (error) {
          throw error;
        }
        setColaboradores(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchColaboradores();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-orange-500 bg-white p-4 shadow-md">
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-red-500 bg-white p-4 text-red-500 shadow-md">
        <p>Erro ao carregar dados: {error.message}</p>
      </div>
    );
  }

  const activeColaboradores = colaboradores.filter((colab) => colab.ativo);
  const activeIncompleteColaboradores = activeColaboradores.filter(
    (colab) => verificarDadosFaltantes(colab).length > 0,
  );
  const activeCompleteColaboradores = activeColaboradores.filter(
    (colab) => verificarDadosFaltantes(colab).length == 0,
  );

  const countActiveIncomplete = activeIncompleteColaboradores.length;
  const countActiveComplete = activeCompleteColaboradores.length;
  const totalActiveColaboradores = activeColaboradores.length;

  // Porcentagem de cadastros incompletos
  const porcentagemIncompleta =
    totalActiveColaboradores > 0
      ? ((countActiveIncomplete / totalActiveColaboradores) * 100).toFixed(0)
      : 0;
  const porcentagemCompleta =
    totalActiveColaboradores > 0
      ? ((countActiveComplete / totalActiveColaboradores) * 100).toFixed(0)
      : 0;

  // Apenas exibe o componente se houver colaboradores incompletos
  if (countActiveIncomplete === 0) {
    return null;
  }

  return (
    <div className="flex flex-col rounded-lg border border-orange-500 bg-white p-4 text-orange-800 shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-lg font-semibold">Pontos de Atenção!</h3>
        <FaExclamationTriangle className="text-orange-600" />
      </div>

      <p className="mb-4 text-xl font-bold">
        Existem {countActiveIncomplete} colaboradores com cadastro incompleto.
      </p>

      <div className="mb-3 h-2.5 w-full rounded-full bg-orange-200">
        <div
          className="h-2.5 rounded-full bg-orange-500"
          style={{ width: `${porcentagemCompleta}%` }}
        ></div>
      </div>
      <div className="mb-4 text-sm text-orange-700">
        {porcentagemCompleta}% | {countActiveComplete} colaboradores de{" "}
        {totalActiveColaboradores} completos
      </div>

      <button
        onClick={() => {
          const details = activeIncompleteColaboradores.map((colab) => {
            const missingFields = verificarDadosFaltantes(colab);
            return {
              nome: `${colab.nome || ""} ${colab.sobrenome || ""}`.trim(),
              missingCount: missingFields.length,
              missingFields: missingFields,
            };
          });
          setIncompleteColaboratorsDetails(details);
          setShowDetailsPopup(true);
        }}
        className="flex cursor-pointer items-center justify-center gap-2 rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
      >
        Verificar <FaArrowRight />
      </button>

      {showDetailsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--vertical-color)]">
                Detalhes de Cadastro Incompleto
              </h2>
              <button
                onClick={() => setShowDetailsPopup(false)}
                className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-80 space-y-4 overflow-y-auto">
              {incompleteColaboratorsDetails.length > 0 ? (
                incompleteColaboratorsDetails.map((detail, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    <h3 className="font-semibold text-gray-800">
                      {detail.nome} ({detail.missingCount} informações faltando)
                    </h3>
                    <ul className="list-inside list-disc text-sm text-gray-600">
                      {detail.missingFields.map((field, fieldIndex) => (
                        <li key={fieldIndex}>{field}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">
                  Nenhum colaborador com cadastro incompleto encontrado.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsPopup(false)}
                className="cursor-pointer rounded-md bg-[var(--vertical-color)] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertaCadastroIncompleto;
