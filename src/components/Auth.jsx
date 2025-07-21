import React, { useState } from "react";
import { supabase } from "../lib/supabaseclient";
import { Link, useLocation } from "react-router";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      window.location.href = "/";
    } catch (err) {
      setError("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-100 bg-white p-10 shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-blue-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-[var(--vertical-color)]">
            RH Vertical
          </h2>
          <h3 className="text-center text-base font-light text-gray-500">
            Entre com suas credenciais para acessar o sistema
          </h3>
        </div>
        <form className="mt-10 space-y-7" onSubmit={handleLogin}>
          {error && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400">
                  {/* User Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A9.001 9.001 0 0112 15c2.21 0 4.21.805 5.879 2.146M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-4 pl-10 text-gray-900 placeholder-gray-400 transition focus:border-[var(--vertical-color)] focus:ring-[var(--vertical-color)] focus:outline-none sm:text-sm"
                  placeholder="seuemail@sejavertical.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400">
                  {/* Lock Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11V7a4 4 0 118 0v4m-8 0h8m-8 0v4a4 4 0 008 0v-4"
                    />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-4 pl-10 text-gray-900 placeholder-gray-400 transition focus:border-[var(--vertical-color)] focus:ring-[var(--vertical-color)] focus:outline-none sm:text-sm"
                  placeholder="•••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer justify-center rounded-lg bg-[var(--vertical-color)] py-2 text-base font-semibold text-white shadow transition hover:bg-orange-500"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <Link
              to="https://sejavertical.sharepoint.com/"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--vertical-color)] bg-white py-2 text-sm font-semibold text-[var(--vertical-color)] shadow transition hover:bg-blue-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Voltar para a intranet
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
