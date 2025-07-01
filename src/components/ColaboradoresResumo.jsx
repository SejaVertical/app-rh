import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseclient"; // Ajuste o caminho se necessário

const ColaboradoresResumo = ({
  tipo,
  titulo: tituloProp,
  filtro,
  filtroTotal,
  campo = "ativo",
  corBarra: corBarraProp,
  selectFields,
}) => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        setLoading(true);
        const selectStr = selectFields || campo;
        const { data, error } = await supabase
          .from("users")
          .select(selectStr)
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
  }, [campo, selectFields]);

  if (loading) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-[var(--vertical-color)] bg-white p-4 shadow-md">
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

  const totalColaboradores = filtroTotal
    ? colaboradores.filter(filtroTotal).length
    : colaboradores.length;
  let filteredColaboradores;
  if (filtro) {
    filteredColaboradores = colaboradores.filter(filtro);
  } else {
    filteredColaboradores = colaboradores.filter((colab) =>
      tipo === "ativos" ? colab.ativo : !colab.ativo,
    );
  }
  const colaboradoresCount = filteredColaboradores.length;

  const titulo =
    tituloProp ||
    (tipo === "ativos" ? "Colaboradores Ativos" : "Colaboradores Inativos");
  const porcentagem =
    totalColaboradores > 0
      ? ((colaboradoresCount / totalColaboradores) * 100).toFixed(0)
      : 0;
  const corBarra =
    corBarraProp ||
    (tipo === "ativos" ? "bg-[var(--vertical-color)]" : "bg-red-500");

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--vertical-color)] bg-white p-4 shadow-md">
      <h3 className="text-2xs mb-2 font-semibold whitespace-nowrap text-[var(--vertical-color)]">
        {titulo}
      </h3>
      <p className="mb-4 text-3xl font-bold text-gray-800">
        {colaboradoresCount}
      </p>
      <div className="mb-4 text-sm text-gray-600">
        {porcentagem}% | {colaboradoresCount} colaboradores de{" "}
        {totalColaboradores}
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-200">
        <div
          className={`h-2.5 rounded-full ${corBarra}`}
          style={{ width: `${porcentagem}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ColaboradoresResumo;
