import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseclient";
import { IMaskInput } from "react-imask";
import Notification from "./Notification";

const EditModal = ({ isOpen, setModalClose, colaborador }) => {
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
    remuneracao: "",
    valor_beneficios: "",
    valor_total_remuneracao: "",
    regime_contratacao: "",
    escolaridade: "",
    beneficios: [],
    endereco: "",
    cidade: "",
    uf: "",
    observacoes: "",
    anexos: [],
  });

  const [fotoPreview, setFotoPreview] = useState("");
  const [anexos, setAnexos] = useState([]);
  const [anexosFiles, setAnexosFiles] = useState([]);
  const [showBeneficios, setShowBeneficios] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (colaborador) {
      const inicioDate = colaborador.inicio
        ? new Date(colaborador.inicio).toISOString().split("T")[0]
        : "";
      const dataNascimentoDate = colaborador.data_nascimento
        ? new Date(colaborador.data_nascimento).toISOString().split("T")[0]
        : "";

      // Formatar valores numéricos para string no formato '9.900,20' (sem R$)
      const formatarParaInput = (valor) => {
        if (valor === null || valor === undefined || valor === "") return "";
        if (typeof valor === "number" && !isNaN(valor)) {
          return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        if (typeof valor === "string") {
          // Se já estiver no formato correto, retorna
          if (
            /^\d{1,3}(\.\d{3})*,\d{2}$/.test(valor) ||
            /^\d+,\d{2}$/.test(valor)
          ) {
            return valor;
          }
          // Corrigir: aceitar ponto ou vírgula como separador decimal
          let num = NaN;
          if (/^\d+[\.,]\d{1,}$/.test(valor)) {
            // Se tem ponto ou vírgula como separador decimal
            num = parseFloat(valor.replace(",", "."));
          } else {
            // Se for string numérica simples
            num = parseFloat(valor);
          }
          if (!isNaN(num)) {
            return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        }
        return "";
      };

      setFormData({
        nome: colaborador.nome || "",
        sobrenome: colaborador.sobrenome || "",
        departamento: colaborador.departamento || "",
        cargo: colaborador.cargo || "",
        inicio: inicioDate,
        data_nascimento: dataNascimentoDate,
        cpf: colaborador.cpf || "",
        cnpj: colaborador.cnpj || "",
        telefone: colaborador.telefone || "",
        email: colaborador.email || "",
        email_pessoal: colaborador.email_pessoal || "",
        ativo: colaborador.ativo || true,
        foto_perfil: colaborador.foto_perfil || "",
        remuneracao: formatarParaInput(colaborador.remuneracao),
        valor_beneficios: formatarParaInput(colaborador.valor_beneficios),
        valor_total_remuneracao: formatarParaInput(
          colaborador.valor_total_remuneracao,
        ),
        regime_contratacao: colaborador.regime_contratacao || "",
        escolaridade: colaborador.escolaridade || "",
        beneficios: colaborador.beneficios || [],
        endereco: colaborador.endereco || "",
        cidade: colaborador.cidade || "",
        uf: colaborador.uf || "",
        observacoes: colaborador.observacoes || "",
        anexos: colaborador.anexos || [],
      });
      setFotoPreview(colaborador.foto_perfil || "");
      setAnexos(
        (colaborador.anexos || []).map((url) => ({
          name: url.split("/").pop(),
          url: url,
        })),
      );
      setAnexosFiles([]);
    }
  }, [colaborador]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAcceptIMask = (value, mask, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${colaborador.id}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

        setFormData((prev) => ({
          ...prev,
          foto_perfil: publicUrl,
        }));
        setFotoPreview(publicUrl);
        showNotification("Foto de perfil atualizada com sucesso!", "success");
      } catch (error) {
        showNotification(
          "Erro ao fazer upload da foto: " + error.message,
          "error",
        );
      }
    }
  };

  const handleAnexosChange = async (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAnexosFiles((prevFiles) => [...prevFiles, ...filesArray]);

      const newAnexos = await Promise.all(
        filesArray.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${colaborador.id}-${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("anexos-colaboradores")
              .upload(fileName, file);

          if (uploadError) {
            console.error("Erro no upload do anexo:", uploadError);
            showNotification(
              "Erro ao fazer upload de um dos anexos: " + uploadError.message,
              "error",
            );
            return null;
          }

          const anexoUrl = supabase.storage
            .from("anexos-colaboradores")
            .getPublicUrl(fileName).data.publicUrl;

          return { name: file.name, url: anexoUrl };
        }),
      );
      setAnexos((prevAnexos) => [...prevAnexos, ...newAnexos.filter(Boolean)]);
    }
  };

  const removeAnexo = async (index) => {
    const fileToRemove = anexos[index];

    if (
      fileToRemove.url.includes(
        supabase.storage.from("anexos-colaboradores").getPublicUrl("").data
          .publicUrl,
      )
    ) {
      const fileName = fileToRemove.url.split("/").pop();
      const { error } = await supabase.storage
        .from("anexos-colaboradores")
        .remove([fileName]);

      if (error) {
        console.error("Erro ao remover anexo do storage:", error);
        showNotification(
          "Erro ao remover anexo do storage: " + error.message,
          "error",
        );
        return;
      }
    }

    setAnexos((prevAnexos) => prevAnexos.filter((_, i) => i !== index));
    setAnexosFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleBeneficiosChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const currentBeneficios = prev.beneficios || [];
      if (checked) {
        return { ...prev, beneficios: [...currentBeneficios, value] };
      } else {
        return {
          ...prev,
          beneficios: currentBeneficios.filter((b) => b !== value),
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Converter valores mascarados para número puro
    const parseMoeda = (valor) => {
      if (typeof valor === "number") return valor;
      if (!valor) return 0;
      let limpo = valor.toString().replace(/[^0-9,]/g, "");
      const lastComma = limpo.lastIndexOf(",");
      if (lastComma !== -1) {
        limpo =
          limpo.substring(0, lastComma).replace(/,/g, "") +
          "." +
          limpo.substring(lastComma + 1);
      }
      const numero = parseFloat(limpo);
      return isNaN(numero) ? 0 : numero;
    };

    const finalFormData = {
      ...formData,
      remuneracao: parseMoeda(formData.remuneracao),
      valor_beneficios: parseMoeda(formData.valor_beneficios),
      valor_total_remuneracao: parseMoeda(formData.valor_total_remuneracao),
      anexos: anexos.map((anexo) => anexo.url),
    };

    // Tratamento das datas vazias
    if (!finalFormData.inicio) {
      delete finalFormData.inicio;
    }
    if (!finalFormData.data_nascimento) {
      delete finalFormData.data_nascimento;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update(finalFormData)
        .eq("id", colaborador.id);

      if (error) throw error;

      showNotification("Colaborador atualizado com sucesso!", "success");
      setTimeout(() => {
        setModalClose();
        window.location.reload();
      }, 1200);
    } catch (error) {
      showNotification(
        "Erro ao atualizar colaborador: " + error.message,
        "error",
      );
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir este colaborador?")) {
      try {
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", colaborador.id);

        if (error) throw error;

        showNotification("Colaborador excluído com sucesso!", "success");
        setTimeout(() => {
          setModalClose();
          window.location.reload();
        }, 1200);
      } catch (error) {
        showNotification(
          "Erro ao excluir colaborador: " + error.message,
          "error",
        );
      }
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "";
    if (typeof valor === "number" && !isNaN(valor)) {
      return (
        "R$ " +
        valor.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
    if (typeof valor === "string") {
      // Remove tudo que não é número ou vírgula
      let limpo = valor.replace(/[^0-9,]/g, "");
      // Troca só a última vírgula por ponto para decimal
      const lastComma = limpo.lastIndexOf(",");
      if (lastComma !== -1) {
        limpo =
          limpo.substring(0, lastComma).replace(/,/g, "") +
          "." +
          limpo.substring(lastComma + 1);
      }
      const numero = parseFloat(limpo);
      if (!isNaN(numero)) {
        return (
          "R$ " +
          numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
    }
    return "";
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] backdrop-blur-sm">
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "success" })}
      />
      <div className="h-11/12 w-full max-w-4xl overflow-y-scroll rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--vertical-color)]">
            Editar Colaborador
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
              {fotoPreview ? (
                <img
                  src={fotoPreview}
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
                onChange={handleFotoChange}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sobrenome
              </label>
              <input
                type="text"
                name="sobrenome"
                value={formData.sobrenome}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail Corporativo
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail Pessoal
              </label>
              <input
                type="email"
                name="email_pessoal"
                value={formData.email_pessoal}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <IMaskInput
                mask="(00) 00000-0000"
                type="text"
                unmask={false}
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onAccept={(value) => handleAcceptIMask(value, null, "telefone")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Departamento
              </label>
              <select
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
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
                <option value="RH">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cargo
              </label>
              <select
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              >
                <option value="">Selecione o cargo do colaborador</option>
                <option value="Analista">Analista</option>
                <option value="Assistente">Assistente</option>
                <option value="Coordenador">Coordenador</option>
                <option value="Gerente">Gerente</option>
                <option value="Diretor">Diretor</option>
                <option value="Engenheiro">Engenheiro</option>
                <option value="Estagiário">Estagiário</option>
                <option value="Serviços Gerais">Serviços Gerais</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data de Nascimento
              </label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data de Início
              </label>
              <input
                type="date"
                name="inicio"
                value={formData.inicio}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CPF
              </label>
              <IMaskInput
                mask="000.000.000-00"
                type="text"
                unmask={false}
                placeholder="000.000.000-00"
                value={formData.cpf}
                onAccept={(value) => handleAcceptIMask(value, null, "cpf")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CNPJ
              </label>
              <IMaskInput
                mask="00.000.000/0000-00"
                type="text"
                unmask={false}
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onAccept={(value) => handleAcceptIMask(value, null, "cnpj")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cidade
              </label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                UF
              </label>
              <input
                type="text"
                name="uf"
                value={formData.uf}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Remuneração
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
                value={formData.remuneracao}
                onAccept={(value) =>
                  handleAcceptIMask(value, null, "remuneracao")
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Valor dos Benefícios
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
                value={formData.valor_beneficios}
                onAccept={(value) =>
                  handleAcceptIMask(value, null, "valor_beneficios")
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Valor Total da Remuneração
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
                value={formData.valor_total_remuneracao}
                onAccept={(value) =>
                  handleAcceptIMask(value, null, "valor_total_remuneracao")
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Regime de Contratação
              </label>
              <select
                name="regime_contratacao"
                value={formData.regime_contratacao}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
              >
                <option value="">Selecione o regime de contratação</option>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="Estágio">Estágio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Escolaridade
              </label>
              <select
                name="escolaridade"
                value={formData.escolaridade}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Benefícios
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowBeneficios(!showBeneficios)}
                  className="mt-1 flex cursor-pointer items-center justify-between rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                >
                  <span className="text-sm text-gray-700">
                    {formData.beneficios && formData.beneficios.length > 0
                      ? formData.beneficios.join(", ")
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
                          checked={formData.beneficios.includes(
                            "Auxílio Saúde",
                          )}
                          onChange={handleBeneficiosChange}
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
                          checked={formData.beneficios.includes(
                            "Seguro de Vida",
                          )}
                          onChange={handleBeneficiosChange}
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

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                name="observacoes"
                className="mt-1 block w-full resize-y rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--vertical-color)] focus:ring-1 focus:ring-[var(--vertical-color)] focus:outline-none"
                rows="3"
                placeholder="Adicione observações sobre o colaborador..."
                value={formData.observacoes}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">
                Anexos
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {anexos.map((anexo, index) => (
                  <div
                    key={anexo.url}
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

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleDelete}
              className="cursor-pointer rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              Excluir
            </button>
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
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
