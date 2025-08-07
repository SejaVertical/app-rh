const SucessScreen = () => {
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-modal)] text-center backdrop-blur-sm">
        <div className="animate-fadeIn relative mx-4 max-w-2xl rounded-2xl bg-[var(--bg-color)] p-8 shadow-2xl">
          <button
            className="absolute top-0 right-2 cursor-pointer text-2xl font-bold text-gray-400 transition-colors hover:text-[var(--vertical-color)] focus:outline-none"
            onClick={() => {
              window.location.reload();
            }}
            aria-label="Fechar modal"
          >
            &times;
          </button>
          <h2>Sucesso ao cadastrar o colaborador!</h2>
        </div>
      </div>
    </>
  );
};

export default SucessScreen;
