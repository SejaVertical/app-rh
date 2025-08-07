import Sidebar from "../components/Sidebar";

const Organograma = () => {
  return (
    <>
      <Sidebar />
      <main className="flex h-screen items-center justify-center">
        <iframe
          src="https://sejavertical-my.sharepoint.com/personal/dados_sejavertical_com_br/_layouts/15/Doc.aspx?sourcedoc={b2616781-ce65-4a4c-8a63-5f61b99f8926}&amp;action=embedview"
          width="100%"
          height="100%"
          frameborder="0"
        >
          Este é um diagrama do{" "}
          <a target="_blank" href="https://office.com">
            Microsoft Office
          </a>{" "}
          incorporado, da plataforma{" "}
          <a target="_blank" href="https://office.com/webapps">
            Office
          </a>
          .
        </iframe>
      </main>
    </>
  );
};

export default Organograma;
