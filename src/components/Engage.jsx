import React, { useEffect } from "react";

const Engage = () => {
  useEffect(() => {
    // Função para embutir o feed
    const embedFeed = () => {
      if (window.yam && window.yam.connect) {
        window.yam.connect.embedFeed({
          container: "#embedded-feed",
          network: "sejavertical.com.br",
          feedType: "group",
          feedId: "203732459520",
        });
      }
    };

    // Verifica se o script já existe
    let script = document.querySelector(
      'script[src="https://s0-azure.assets-yammer.com/assets/platform_embed.js"]',
    );

    if (!script) {
      script = document.createElement("script");
      script.src =
        "https://s0-azure.assets-yammer.com/assets/platform_embed.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = embedFeed;
      document.body.appendChild(script);
    } else {
      embedFeed();
    }

    // Limpeza ao desmontar
    return () => {
      const container = document.getElementById("embedded-feed");
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <div id="embedded-feed" style={{ height: "800px", width: "400px" }}></div>
  );
};

export default Engage;
