import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./pages/App.jsx";
import Colaboradores from "./pages/Colaboradores.jsx";
import Organograma from "./pages/Organograma.jsx";
import { Ferias } from "./pages/Ferias.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { Navigate } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />
        <Route
          path="/colaboradores"
          element={
            <ProtectedRoute>
              <Colaboradores />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organograma"
          element={
            <ProtectedRoute>
              <Organograma />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ferias"
          element={
            <ProtectedRoute>
              <Ferias />
            </ProtectedRoute>
          }
        />
        {/* Redireciona a rota raiz para /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
