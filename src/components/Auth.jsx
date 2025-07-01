import React, { useState } from "react";
import { supabase } from "../lib/supabaseclient";

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
      // Primeiro, buscamos o usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("password")
        .eq("email", email)
        .single();

      if (userError) throw userError;

      // Verificamos se a senha corresponde
      if (userData && userData.password === password) {
        // Se a senha estiver correta, criamos uma sessão
        const { data: sessionData, error: sessionError } =
          await supabase.auth.signInWithPassword({
            email,
            password: userData.password,
          });

        if (sessionError) throw sessionError;

        // Redirecionar para a página principal após o login
        window.location.href = "/";
      } else {
        setError("Email ou senha incorretos");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl text-[var(--vertical-color)]">
            RH Vertical
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-600">
              {error}
            </div>
          )}
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[var(--vertical-color)] focus:ring-[var(--vertical-color)] focus:outline-none sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[var(--vertical-color)] focus:ring-[var(--vertical-color)] focus:outline-none sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-[var(--vertical-color)] py-2 text-sm font-medium text-white hover:bg-orange-500"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
