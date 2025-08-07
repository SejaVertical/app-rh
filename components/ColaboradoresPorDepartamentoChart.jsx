import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { supabase } from "../lib/supabaseclient";

const ColaboradoresPorDepartamentoChart = ({
  tipo = "departamento",
  titulo = "Quantidade de Colaboradores por Departamento",
  cor = "#FF6B00",
  altura = "300px",
  largura = "100%",
}) => {
  const [data, setData] = useState([]);
  // Hook para detectar largura da tela e ajustar intervalo do XAxis
  const [intervaloEixoX, setIntervaloEixoX] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: colaboradores, error } = await supabase
        .from("users")
        .select(tipo)
        .eq("ativo", true)
        .not("email", "eq", "admin@sejavertical.com.br");

      if (error) {
        console.error("Erro ao buscar dados:", error);
        return;
      }

      // Agrupa colaboradores pelo tipo selecionado
      const contagem = colaboradores.reduce((acc, curr) => {
        const valor = curr[tipo] || `Sem ${tipo}`;
        acc[valor] = (acc[valor] || 0) + 1;
        return acc;
      }, {});

      // Converte para o formato que o Recharts espera e ordena do maior para o menor
      const chartData = Object.entries(contagem)
        .map(([chave, quantidade]) => ({
          [tipo]: chave,
          quantidade,
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

      setData(chartData);
    };

    fetchData();
  }, [tipo]);

  useEffect(() => {
    function handleResize() {
      setIntervaloEixoX(window.innerWidth < 768 ? 2 : 0);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="w-full rounded border border-[var(--vertical-color)] shadow-md"
      style={{ height: altura }}
    >
      <ResponsiveContainer width={largura} height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 40,
            left: 0,
            bottom: 5,
          }}
          barCategoryGap={10}
          barGap={2}
        >
          <XAxis
            dataKey={tipo}
            stroke={cor}
            fontSize={8}
            interval={intervaloEixoX}
            tickFormatter={(value) =>
              value && value.length > 10 ? value.slice(0, 8) + "..." : value
            }
          />
          <YAxis stroke="#fff" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#333",
              border: "none",
              color: "#fff",
            }}
          />
          <Legend wrapperStyle={{ color: "#fff" }} />
          <Bar dataKey="quantidade" fill={cor} name={titulo} barSize={200}>
            <LabelList
              dataKey="quantidade"
              position="top"
              fontSize={12}
              fill="#222"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ColaboradoresPorDepartamentoChart;
