import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";
import perfilPadrao from "../assets/foto_perfil.jpg";
import { FaUmbrellaBeach } from "react-icons/fa";

function formatarData(data) {
  if (!data) return "-";
  try {
    if (typeof data === "string" && data.includes("/")) {
      return data;
    }
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) {
      return data;
    }
    const dia = dataObj.getUTCDate().toString().padStart(2, "0");
    const mes = (dataObj.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = dataObj.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    return data;
  }
}

const FeriasAgendadas = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchColaboradores() {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, nome, sobrenome, departamento, cargo, data_ferias, ativo, foto_perfil",
        )
        .eq("ativo", true)
        .not("email", "eq", "admin@sejavertical.com.br");
      if (!error && data) {
        setColaboradores(data);
      }
      setLoading(false);
    }
    fetchColaboradores();
  }, []);

  // Lista todos os períodos de férias futuras de todos os colaboradores
  const hoje = new Date();
  const feriasFuturas = [];
  colaboradores.forEach((colab) => {
    const datas = colab.data_ferias || [];
    for (let i = 0; i < datas.length; i += 2) {
      const inicio = datas[i];
      const fim = datas[i + 1];
      if (fim && new Date(fim) >= hoje) {
        feriasFuturas.push({
          ...colab,
          periodo: { inicio, fim },
        });
      }
    }
  });

  // Ordena por data de início
  feriasFuturas.sort(
    (a, b) => new Date(a.periodo.inicio) - new Date(b.periodo.inicio),
  );

  if (loading) {
    return <div className="p-4">Carregando descansos agendados...</div>;
  }

  return (
    <div className="rounded-lg border-1 border-[var(--vertical-color)] bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-[var(--vertical-color)]">
        Descansos Remunerados Agendados{" "}
        <FaUmbrellaBeach className="ml-1 inline text-lg" />
      </h2>
      {feriasFuturas.length === 0 ? (
        <p>Nenhum descanso agendado.</p>
      ) : (
        <div className="grid max-h-72 grid-cols-1 gap-4 overflow-y-scroll">
          {feriasFuturas.slice(0).map((item, index) => (
            <div
              key={item.id + "-" + item.periodo.inicio + "-" + item.periodo.fim}
              className="flex items-center space-x-4 rounded-lg bg-gray-50 p-3"
            >
              <div className="h-12 w-12 overflow-hidden rounded-full">
                <img
                  src={item.foto_perfil || perfilPadrao}
                  alt={item.nome}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {item.nome} {item.sobrenome}
                </p>
                <p className="truncate text-sm text-gray-600">
                  {item.departamento}
                </p>
                <p className="text-sm text-gray-600">
                  {formatarData(item.periodo.inicio)} até{" "}
                  {formatarData(item.periodo.fim)}{" "}
                  <span className="ml-1 inline-block align-middle">
                    <FaUmbrellaBeach className="inline text-orange-400" />
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeriasAgendadas;
