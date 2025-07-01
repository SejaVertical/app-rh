import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";

const AniversariantesMes = () => {
  const [aniversariantes, setAniversariantes] = useState([]);
  const [loading, setLoading] = useState(true);

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
          .select("nome, foto_perfil, data_nascimento, departamento")
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

  if (loading) {
    return <div className="p-4">Carregando aniversariantes...</div>;
  }

  return (
    <div className="rounded-lg border-1 border-[var(--vertical-color)] bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-[var(--vertical-color)]">
        Aniversariantes de{" "}
        {mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1)} 🎂
      </h2>
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
                  src={aniversariante.foto || "https://via.placeholder.com/50"}
                  alt={aniversariante.nome}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{aniversariante.nome}</p>
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
  );
};

export default AniversariantesMes;
