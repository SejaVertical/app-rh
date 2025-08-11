import { useState } from "react";
import { IMaskInput } from "react-imask";
import { supabase } from "../lib/supabaseclient";
import SucessScreen from "./SucessScreen";

const CadastroModal = ({ isOpen, setModalClose }) => {
  const [imagem, setImagem] = useState(null);
  const [imagemFile, setImagemFile] = useState(null);
  const [anexos, setAnexos] = useState([]);
  const [anexosFiles, setAnexosFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucessCadastro, setSucessCadastro] = useState(false);

  // Estados para cada campo
  const [email, setEmail] = useState("");
  const [email_pessoal, setEmailPessoal] = useState("");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [data_nascimento, setDataNascimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [inicio, setInicio] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [remuneracao, setRemuneracao] = useState("");
  const [remuneracaoNumero, setRemuneracaoNumero] = useState(0);
  const [valor_beneficios, setValorBeneficios] = useState("");
  const [valorBeneficiosNumero, setValorBeneficiosNumero] = useState(0);
  const [valor_total_remuneracao, setValorTotalRemuneracao] = useState("");
  const [valorTotalRemuneracaoNumero, setValorTotalRemuneracaoNumero] =
    useState(0);
  const [regime_contratacao, setRegimeContratacao] = useState("");
  const [escolaridade, setEscolaridade] = useState("");
  const [beneficios, setBeneficios] = useState([]);
  const [showBeneficios, setShowBeneficios] = useState(false);

  const handleImagemChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagem(URL.createObjectURL(e.target.files[0]));
      setImagemFile(e.target.files[0]);
    }
  };

  const handleAnexosChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAnexosFiles((prevFiles) => [...prevFiles, ...filesArray]);

      // Criar URLs para preview
      const newAnexos = filesArray.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      setAnexos((prevAnexos) => [...prevAnexos, ...newAnexos]);
    }
  };

  const removeAnexo = (index) => {
    setAnexosFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setAnexos((prevAnexos) => prevAnexos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    let foto_perfil_url = "";
    let anexos_urls = [];

    // Upload da imagem se houver
    if (imagemFile) {
      const fileExt = imagemFile.name.split(".").pop();
      const fileName = `${email}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, imagemFile);
      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        setErro("Erro ao fazer upload da imagem: " + uploadError.message);
        alert("Erro ao fazer upload da imagem: " + uploadError.message);
        setLoading(false);
        return;
      }
      foto_perfil_url = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName).data.publicUrl;
    }

    // Upload dos anexos
    if (anexosFiles.length > 0) {
      for (const file of anexosFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${email}-${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("anexos-colaboradores")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Erro no upload do anexo:", uploadError);
          setErro(
            "Erro ao fazer upload de um dos anexos: " + uploadError.message,
          );
          alert(
            "Erro ao fazer upload de um dos anexos: " + uploadError.message,
          );
          setLoading(false);
          return;
        }

        const anexoUrl = supabase.storage
          .from("anexos-colaboradores")
          .getPublicUrl(fileName).data.publicUrl;

        anexos_urls.push(anexoUrl);
      }
    }

    // Inserir no banco
    const { error } = await supabase.from("users").insert([
      {
        email,
        email_pessoal,
        nome,
        sobrenome,
        telefone,
        cargo,
        data_nascimento,
        foto_perfil: foto_perfil_url,
        observacoes,
        departamento,
        inicio,
        cpf,
        cnpj,
        endereco,
        cidade,
        uf,
        remuneracao: remuneracaoNumero,
        valor_beneficios: valorBeneficiosNumero,
        valor_total_remuneracao: valorTotalRemuneracaoNumero,
        regime_contratacao,
        escolaridade,
        beneficios,
        anexos: anexos_urls,
      },
    ]);

    if (error) {
      setErro("Erro ao cadastrar colaborador.");
    } else {
      setModalClose();
      // Limpar campos
      setEmail("");
      setEmailPessoal("");
      setNome("");
      setSobrenome("");
      setTelefone("");
      setCargo("");
      setDataNascimento("");
      setObservacoes("");
      setDepartamento("");
      setInicio("");
      setCpf("");
      setCnpj("");
      setEndereco("");
      setCidade("");
      setUf("");
      setRemuneracao("");
      setRemuneracaoNumero(0);
      setValorBeneficios("");
      setValorBeneficiosNumero(0);
      setValorTotalRemuneracao("");
      setValorTotalRemuneracaoNumero(0);
      setRegimeContratacao("");
      setEscolaridade("");
      setBeneficios([]);
      setImagem(null);
      setImagemFile(null);
      setAnexos([]);
      setAnexosFiles([]);
      setSucessCadastro(true);
    }
    setLoading(false);
  };

  if (sucessCadastro) {
    return <SucessScreen />;
  }

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
      <div className="h-11/12 w-full max-w-4xl overflow-y-scroll rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--vertical-color)]">
            Cadastrar Colaborador
          </h2>
          <button
            onClick={setModalClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="col-span-1 mb-2 flex flex-col items-center md:col-span-3">
            <label
              htmlFor="foto-perfil"
              className="mb-2 flex h-32 w-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--vertical-color)] bg-white text-center transition hover:bg-orange-50"
            >
              {imagem ? (
                <img
                  src={imagem}
                  alt="Prévia"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500">Adicionar imagem</span>
              )}
              <input
                className="hidden"
                id="foto-perfil"
                type="file"
                accept="image/*"
                onChange={handleImagemChange}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                placeholder="Digite o nome do colaborador"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sobrenome*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                placeholder="Digite o sobrenome do colaborador"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail Corporativo*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="email"
                placeholder="exemplo@vertical.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail Pessoal*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="email"
                placeholder="exemplo@email.com"
                value={email_pessoal}
                onChange={(e) => setEmailPessoal(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefone*
              </label>
              <IMaskInput
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                mask={[{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }]}
                type="tel"
                unmask={false}
                placeholder="(00) 00000-0000"
                value={telefone}
                onAccept={(value) => setTelefone(value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Departamento*
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                required
              >
                <option value="">
                  Selecione o departamento do colaborador
                </option>
                <option value="Administrativo Financeiro">
                  Administrativo Financeiro
                </option>
                <option value="Coordenação de Projetos">
                  Coordenação de Projetos
                </option>
                <option value="Custo">Custo</option>
                <option value="Dados">Dados</option>
                <option value="Diretoria">Diretoria</option>
                <option value="Engenharia">Engenharia</option>
                <option value="Gerência">Gerência</option>
                <option value="Gerenciamento">Gerenciamento</option>
                <option value="Orçamento">Orçamento</option>
                <option value="Prazo GYN">Prazo GYN</option>
                <option value="Prazo BSB">Prazo BSB</option>
                <option value="Prazo UDI">Prazo UDI</option>
                <option value="Prazo">Prazo</option>
                <option value="RH">RH</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cargo*
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                required
              >
                <option value="">Selecione o cargo do colaborador</option>
                <option value="Estagiário">Estagiário</option>
                <option value="Assistente 1">Assistente 1</option>
                <option value="Assistente 2">Assistente 2</option>
                <option value="Analista 1">Analista 1</option>
                <option value="Analista 2">Analista 2</option>
                <option value="Analista 3">Analista 3</option>
                <option value="Supervisor 1">Supervisor 1</option>
                <option value="Supervisor 2">Supervisor 2</option>
                <option value="Coordenador 1">Coordenador 1</option>
                <option value="Coordenador 2">Coordenador 2</option>
                <option value="Coordenador 3">Coordenador 3</option>
                <option value="Gerente">Gerente</option>
                <option value="Engenheiro">Engenheiro</option>
                <option value="Técnico de Segurança do Trabalho">
                  Técnico de Segurança do Trabalho
                </option>
                <option value="Administrativo de Obras">
                  Administrativo de Obras
                </option>
                <option value="Mestre de Obras">Mestre de Obras</option>
                <option value="Serviços Gerais">Serviços Gerais</option>
                <option value="Diretor">Diretor</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data de Nascimento*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="date"
                value={data_nascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data de Início*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CPF*
              </label>
              <IMaskInput
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                mask="000.000.000-00"
                type="text"
                unmask={false}
                placeholder="000.000.000-00"
                value={cpf}
                onAccept={(value) => setCpf(value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CNPJ*
              </label>
              <IMaskInput
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                mask="00.000.000/0000-00"
                type="text"
                unmask={false}
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onAccept={(value) => setCnpj(value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Endereço*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                placeholder="Digite o endereço"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cidade*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                placeholder="Digite a cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                UF*
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                placeholder="UF"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Remuneração*
              </label>
              <IMaskInput
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                mask={[
                  { mask: "R$ 0,00" },
                  { mask: "R$ 00,00" },
                  { mask: "R$ 000,00" },
                  { mask: "R$ 0.000,00" },
                  { mask: "R$ 00.000,00" },
                  { mask: "R$ 000.000,00" },
                  { mask: "R$ 0.000.000,00" },
                  { mask: "R$ 00.000.000,00" },
                ]}
                unmask={false}
                placeholder="R$ 0,00"
                value={remuneracao}
                onAccept={(value) => {
                  setRemuneracao(value);
                  const num = parseFloat(
                    value
                      .replace(/[^0-9,]/g, "")
                      .replace(".", "")
                      .replace(",", ".") || "0",
                  );
                  setRemuneracaoNumero(num);
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Benefícios*
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowBeneficios(!showBeneficios)}
                  className="mt-1 flex cursor-pointer items-center justify-between rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                >
                  <span className="text-sm text-gray-700">
                    {beneficios.length > 0
                      ? beneficios.join(", ")
                      : "Selecione os benefícios"}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      showBeneficios ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {showBeneficios && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                    <div className="p-2">
                      <label className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          value="Auxílio Saúde"
                          checked={beneficios.includes("Auxílio Saúde")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBeneficios([...beneficios, e.target.value]);
                            } else {
                              setBeneficios(
                                beneficios.filter((b) => b !== e.target.value),
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[var(--vertical-color)] focus:ring-[var(--vertical-color)]"
                        />
                        <span className="text-sm text-gray-700">
                          Auxílio Saúde
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          value="Seguro de Vida"
                          checked={beneficios.includes("Seguro de Vida")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBeneficios([...beneficios, e.target.value]);
                            } else {
                              setBeneficios(
                                beneficios.filter((b) => b !== e.target.value),
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[var(--vertical-color)] focus:ring-[var(--vertical-color)]"
                        />
                        <span className="text-sm text-gray-700">
                          Seguro de Vida
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Valor dos Benefícios*
              </label>
              <IMaskInput
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                mask={[
                  { mask: "R$ 0,00" },
                  { mask: "R$ 00,00" },
                  { mask: "R$ 000,00" },
                  { mask: "R$ 0.000,00" },
                  { mask: "R$ 00.000,00" },
                  { mask: "R$ 000.000,00" },
                  { mask: "R$ 0.000.000,00" },
                  { mask: "R$ 00.000.000,00" },
                ]}
                placeholder="R$ 0,00"
                value={valor_beneficios}
                onAccept={(value) => {
                  setValorBeneficios(value);
                  const num = parseFloat(
                    value
                      .replace(/[^0-9,]/g, "")
                      .replace(".", "")
                      .replace(",", ".") || "0",
                  );
                  setValorBeneficiosNumero(num);
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Valor Total da Remuneração*
              </label>
              <IMaskInput
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                type="text"
                mask={[
                  { mask: "R$ 0,00" },
                  { mask: "R$ 00,00" },
                  { mask: "R$ 000,00" },
                  { mask: "R$ 0.000,00" },
                  { mask: "R$ 00.000,00" },
                  { mask: "R$ 000.000,00" },
                  { mask: "R$ 0.000.000,00" },
                  { mask: "R$ 00.000.000,00" },
                ]}
                placeholder="R$ 0,00"
                value={valor_total_remuneracao}
                onAccept={(value) => {
                  setValorTotalRemuneracao(value);
                  const num = parseFloat(
                    value
                      .replace(/[^0-9,]/g, "")
                      .replace(".", "")
                      .replace(",", ".") || "0",
                  );
                  setValorTotalRemuneracaoNumero(num);
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Regime de Contratação*
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                value={regime_contratacao}
                onChange={(e) => setRegimeContratacao(e.target.value)}
                required
              >
                <option value="">Selecione o regime de contratação</option>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="Estágio">Estágio</option>
                <option value="Terceirizado">Terceirizado</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Escolaridade*
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                value={escolaridade}
                onChange={(e) => setEscolaridade(e.target.value)}
                required
              >
                <option value="">Selecione a escolaridade</option>
                <option value="Sem Ensino Superior">Sem Ensino Superior</option>
                <option value="Ensino Superior Incompleto">
                  Ensino Superior Incompleto
                </option>
                <option value="Ensino Superior Completo">
                  Ensino Superior Completo
                </option>
              </select>
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                className="mt-1 block w-full resize-y rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                rows="3"
                placeholder="Adicione observações sobre o colaborador..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              ></textarea>
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">
                Anexos
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {anexos.map((anexo, index) => (
                  <div
                    key={index}
                    className="relative flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
                  >
                    <span className="text-sm text-gray-600">{anexo.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAnexo(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Adicionar anexo
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleAnexosChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {erro && (
            <div className="col-span-1 text-center text-sm text-red-500 md:col-span-2">
              {erro}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={setModalClose}
              className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-[var(--vertical-color)] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroModal;
