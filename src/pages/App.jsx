import { useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ColaboradoresPorDepartamentoChart from "../components/ColaboradoresPorDepartamentoChart";
import FeriadosList from "../components/FeriadosList";
import ColaboradoresResumo from "../components/ColaboradoresResumo";
import AlertaCadastroIncompleto from "../components/AlertaCadastroIncompleto";
import AniversariantesMes from "../components/AniversariantesMes";
import FeriasAgendadas from "../components/FeriasAgendadas";
import Engage from "../components/Engage";
import AvaliacoesPendentes from "../components/AvaliacoesPendentes";
import AvaliacoesPendentesModal from "../components/AvaliacoesPendentesModal";
import Eventos from "../components/eventos/Eventos";

export const App = () => {
  const [isAvaliacoesModalOpen, setIsAvaliacoesModalOpen] = useState(false);
  const [avaliacoesKey, setAvaliacoesKey] = useState(0);

  const handleOpenAvaliacoesModal = () => {
    setIsAvaliacoesModalOpen(true);
  };

  const handleCloseAvaliacoesModal = () => {
    setIsAvaliacoesModalOpen(false);
  };

  const refreshAvaliacoesCard = useCallback(() => {
    setAvaliacoesKey((prevKey) => prevKey + 1);
  }, []);

  return (
    <>
      <Sidebar />
      <main className="h-screen flex-1 overflow-auto bg-gray-50 pb-12">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="mb-6 text-2xl font-bold text-[var(--vertical-color)]">
            Dashboard
          </h1>

          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
            <div className="md:col-span-2">
              <AlertaCadastroIncompleto />
            </div>
            <ColaboradoresResumo tipo="ativos" />
            <ColaboradoresResumo tipo="inativos" />
            <ColaboradoresResumo
              titulo="Férias Pendentes"
              filtro={(colab) => colab.saldo_ferias > 0 && colab.ativo}
              filtroTotal={(colab) => colab.ativo}
              campo="saldo_ferias,ativo"
              selectFields="saldo_ferias,ativo"
              corBarra="bg-yellow-500"
            />
            <AvaliacoesPendentes
              key={avaliacoesKey}
              onViewClick={handleOpenAvaliacoesModal}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
            <ColaboradoresPorDepartamentoChart
              tipo="departamento"
              titulo="Colaboradores por Departamento"
              cor="#FF6B00"
            />
            <ColaboradoresPorDepartamentoChart
              tipo="cargo"
              titulo="Colaboradores por Cargo"
              cor="#4CAF50"
            />
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <AniversariantesMes />
            <FeriasAgendadas />
            <FeriadosList />
          </section>
          {/* <Engage /> */}

          <section className="mt-8 w-full">
            <Eventos />
          </section>
        </div>
      </main>

      <AvaliacoesPendentesModal
        isOpen={isAvaliacoesModalOpen}
        onClose={handleCloseAvaliacoesModal}
        onUpdate={refreshAvaliacoesCard}
      />
    </>
  );
};

export default App;
