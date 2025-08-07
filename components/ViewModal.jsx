import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";

const ViewModal = ({ isOpen, setModalClose, colaborador }) => {
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    departamento: "",
    cargo: "",
    inicio: "",
    data_nascimento: "",
    cpf: "",
    cnpj: "",
    telefone: "",
    email: "",
    email_pessoal: "",
    ativo: true,
    foto_perfil: "",
    remuneracao: 0,
    valor_beneficios: 0,
    valor_total_remuneracao: 0,
    regime_contratacao: "",
    escolaridade: "",
    beneficios: [],
    endereco: "",
    cidade: "",
    uf: "",
    observacoes: "",
    anexos: [],
  });

  const formatarData = (dataString) => {
    if (!dataString || typeof dataString !== "string") {
      console.log("Data não definida ou não é string:", dataString); // DEBUG
      return "Não definida";
    }
    try {
      console.log("Tentando formatar data:", dataString); // DEBUG
      const date = new Date(dataString);

      if (isNaN(date.getTime())) {
        console.log("Data é NaN após new Date():", dataString); // DEBUG
        return "Data inválida";
      }

      // Extrair ano, mês e dia UTC para garantir que a data seja interpretada corretamente no fuso horário local
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth(); // Mês é 0-indexed
      const day = date.getUTCDate();

      // Criar uma nova data com os componentes UTC, que será interpretada no fuso horário local
      const localDate = new Date(year, month, day);

      return localDate.toLocaleDateString("pt-BR");
    } catch (error) {
      console.error("Erro ao formatar data (exceção):", error); // DEBUG
      return "Erro ao formatar";
    }
  };

  // Nova função para calcular o tempo de empresa
  const getTempoDeEmpresa = (dataInicio) => {
    if (!dataInicio) return "Não informado";
    const inicio = new Date(dataInicio);
    const hoje = new Date();

    const diffAnos = hoje.getFullYear() - inicio.getFullYear();
    const diffMeses = hoje.getMonth() - inicio.getMonth();

    let totalMeses = diffAnos * 12 + diffMeses;

    if (hoje.getDate() < inicio.getDate()) {
      totalMeses--;
    }

    if (totalMeses <= 0) {
      return "Menos de 1 mês";
    } else if (totalMeses === 1) {
      return "1 Mês de Empresa";
    } else if (totalMeses < 12) {
      return `${totalMeses} Meses de Empresa`;
    } else {
      const anos = Math.floor(totalMeses / 12);
      const meses = totalMeses % 12;
      let resultado = `${anos} Ano${anos > 1 ? "s" : ""}`;
      if (meses > 0) {
        resultado += ` e ${meses} Mê${meses > 1 ? "ses" : ""}`;
      }
      return resultado + " de Empresa";
    }
  };

  useEffect(() => {
    if (colaborador) {
      setFormData({
        nome: colaborador.nome || "",
        sobrenome: colaborador.sobrenome || "",
        departamento: colaborador.departamento || "",
        cargo: colaborador.cargo || "",
        inicio: colaborador.inicio || "",
        data_nascimento: colaborador.data_nascimento || "",
        cpf: colaborador.cpf || "",
        cnpj: colaborador.cnpj || "",
        telefone: colaborador.telefone || "",
        email: colaborador.email || "",
        email_pessoal: colaborador.email_pessoal || "",
        ativo: colaborador.ativo || false,
        foto_perfil: colaborador.foto_perfil || "",
        remuneracao: parseFloat(colaborador.remuneracao) || 0,
        valor_beneficios: parseFloat(colaborador.valor_beneficios) || 0,
        valor_total_remuneracao:
          parseFloat(colaborador.valor_total_remuneracao) || 0,
        regime_contratacao: colaborador.regime_contratacao || "",
        escolaridade: colaborador.escolaridade || "",
        beneficios: colaborador.beneficios || [],
        endereco: colaborador.endereco || "",
        cidade: colaborador.cidade || "",
        uf: colaborador.uf || "",
        observacoes: colaborador.observacoes || "",
        anexos: colaborador.anexos || [],
      });
    }
  }, [colaborador]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
      <div className="w-full max-w-6xl flex-col rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--vertical-color)]">
            Visualizar Colaborador
          </h2>
          <button
            onClick={setModalClose}
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

        {/* Main Content Area: Flex for two columns */}
        <div className="flex max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Left Profile Section */}
          <div className="mr-6 flex w-1/3 flex-shrink-0 flex-col items-center rounded-lg bg-gray-50 p-6">
            <div className="mb-4">
              {/* Profile Image */}
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-gray-300">
                {formData.foto_perfil ? (
                  <img
                    src={formData.foto_perfil}
                    alt="Foto de Perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-20 w-20 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
            </div>
            <h3 className="mb-1 text-center text-2xl font-bold text-gray-800">
              {formData.nome} {formData.sobrenome}
            </h3>
            <p className="mb-1 text-center text-gray-600">{formData.cargo}</p>
            <p className="mb-1 text-center text-gray-600">
              {formData.departamento}
            </p>
            <p className="text-center text-sm text-gray-500">
              {getTempoDeEmpresa(formData.inicio)}
            </p>
          </div>

          {/* Right Details Section */}
          <div className="w-2/3 flex-grow overflow-y-auto">
            {/* First Block: Personal Info and Contact */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-gray-600">Nome</p>
                  <p className="text-base text-gray-800">
                    {formData.nome} {formData.sobrenome}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-gray-600">CPF</p>
                  <p className="text-base text-gray-800">{formData.cpf}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-gray-600">
                    Data de Nascimento
                  </p>
                  <p className="text-base text-gray-800">
                    {formatarData(formData.data_nascimento)}
                  </p>
                </div>
                <div className="col-span-full">
                  <p className="text-sm font-semibold text-gray-600">
                    Endereço
                  </p>
                  <p className="text-base text-gray-800">
                    {formData.endereco}
                    {formData.cidade ? `, ${formData.cidade}` : ""}
                    {formData.uf ? ` - ${formData.uf}` : ""}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-gray-600">
                    Data de Início
                  </p>
                  <p className="text-base text-gray-800">
                    {formatarData(formData.inicio)}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-gray-600">CNPJ</p>
                  <p className="text-base text-gray-800">
                    {formData.cnpj || "Não definido"}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-gray-600">
                    Telefone
                  </p>
                  <p className="text-base text-gray-800">{formData.telefone}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Benefícios, Regime de Contratação, E-mails, Escolaridade */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Benefícios
                  </p>
                  <p className="text-base text-gray-800">
                    {formData.beneficios.length > 0
                      ? formData.beneficios.join(", ")
                      : "Não informados"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Regime de Contratação
                  </p>
                  <p className="text-base text-gray-800">
                    {formData.regime_contratacao || "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    E-mail Corporativo
                  </p>
                  <p className="text-base text-gray-800">{formData.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    E-mail Pessoal
                  </p>
                  <p className="text-base text-gray-800">
                    {formData.email_pessoal || "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Escolaridade
                  </p>
                  <p className="text-base text-gray-800">
                    {formData.escolaridade || "Não informada"}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Remuneração, Documentos, Observações */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Remuneração
                  </p>
                  <p className="text-base text-gray-800">
                    R${" "}
                    {parseFloat(formData.remuneracao).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Valor dos Benefícios
                  </p>
                  <p className="text-base text-gray-800">
                    R${" "}
                    {parseFloat(formData.valor_beneficios).toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Valor Total
                  </p>
                  <p className="text-base text-gray-800">
                    R${" "}
                    {parseFloat(
                      formData.valor_total_remuneracao,
                    ).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="col-span-full">
                  <p className="mb-2 text-sm font-semibold text-gray-600">
                    Documentos
                  </p>
                  {formData.anexos && formData.anexos.length > 0 ? (
                    <div className="space-y-2">
                      {formData.anexos.map((anexo, index) => {
                        const fileUrl =
                          typeof anexo === "string" ? anexo : anexo.url || "#";
                        const fileName =
                          typeof anexo === "string" && anexo.includes("/")
                            ? anexo.split("/").pop()
                            : anexo.name || `Documento ${index + 1}`;

                        return (
                          <a
                            key={index}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            <svg
                              className="mr-2 h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a3 3 0 10-4.243-4.243l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a3 3 0 10-4.243-4.243z"
                              />
                            </svg>
                            Documento {index + 1}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-base text-gray-800">
                      Nenhum documento anexado.
                    </p>
                  )}
                </div>
                <div className="col-span-full">
                  <p className="text-sm font-semibold text-gray-600">
                    Observações
                  </p>
                  <p className="text-base text-gray-800">
                    {formData.observacoes || "Nenhuma observação."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
