import { useState, useEffect } from "react";

const FeriadosList = () => {
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const fetchFeriados = async (ano) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        //`https://feriados-brasileiros1.p.rapidapi.com/read?cidade=goiania&estado=GO&ano=${ano}`,
        {
          headers: {
            "x-rapidapi-host": "feriados-brasileiros1.p.rapidapi.com",
            "x-rapidapi-key":
              "249d95564cmsh0eb60169ca6d86ep17b91fjsn8e39854f923b",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar feriados");
      }

      const data = await response.json();
      setFeriados(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const anoAtual = new Date().getFullYear();
    fetchFeriados(anoAtual);
  }, []);

  const formatarData = (dataString) => {
    return dataString;
  };

  const converterDataParaComparacao = (dataString) => {
    const [dia, mes, ano] = dataString.split("/");
    return new Date(ano, mes - 1, dia);
  };

  const feriadosDoMes = feriados.filter((feriado) => {
    const dataFeriado = converterDataParaComparacao(feriado.data);
    const mesAtual = new Date().getMonth();
    return dataFeriado.getMonth() === mesAtual;
  });

  const ordenarPorData = (a, b) => {
    const dataA = converterDataParaComparacao(a.data);
    const dataB = converterDataParaComparacao(b.data);
    return dataA - dataB;
  };

  const feriadosParaExibir = (showAll ? feriados : feriadosDoMes).sort(
    ordenarPorData,
  );

  return (
    <div className="w-full rounded border border-[var(--vertical-color)] bg-white p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--vertical-color)]">
          {showAll ? "Feriados do Ano" : "Feriados do Mês"}
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="cursor-pointer rounded bg-[var(--vertical-color)] px-4 py-2 text-sm text-white hover:bg-orange-600"
        >
          {showAll ? "Ver Mês Atual" : "Ver Ano Todo"}
        </button>
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center">
          <p>Carregando feriados...</p>
        </div>
      ) : error ? (
        <div className="flex h-full items-center justify-center text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          {feriadosParaExibir.length === 0 ? (
            <p className="text-center text-gray-500">
              Nenhum feriado encontrado
            </p>
          ) : (
            <ul className="space-y-2">
              {feriadosParaExibir.map((feriado, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded border border-gray-200 p-2 hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{feriado.feriado}</span>
                    <span className="text-xs text-gray-500">
                      {feriado.tipo}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatarData(feriado.data)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default FeriadosList;
