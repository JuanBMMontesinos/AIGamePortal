"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, ArrowRight, BarChart3, AlertCircle } from "lucide-react";

export function AdminMetricsLoginForm() {
  const router = useRouter();
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.refresh();
      } else {
        setErrorMessage(data.message || "Chave de acesso incorreta.");
      }
    } catch {
      setErrorMessage("Erro de rede ao validar autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Luzes difusas de fundo */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-purple/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-cyan/15 blur-3xl" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-brand-purple/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan text-white shadow-neon-purple mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Área Restrita B2B
            </span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            Métricas & Patrocínio
          </h1>
          <p className="text-xs text-zinc-400">
            Digite a chave mestra de administrador ou utilize o link comercial direto com parâmetro <code className="text-brand-cyan">?key=...</code>
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Chave Secreta de Acesso</span>
              <Lock className="w-3 h-3 text-zinc-500" />
            </label>
            <input
              type="password"
              required
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Digite ADMIN_SECRET_KEY..."
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-brand-purple rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !secretKey.trim()}
            className="w-full py-3 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-brand-purple to-brand-cyan text-white shadow-lg shadow-brand-purple/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Autenticando..." : "Acessar Métricas"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-[11px] text-zinc-500">
            Made By AI Games • Módulo de Telemetria e Patrocínio B2B
          </span>
        </div>
      </div>
    </div>
  );
}

export { AdminMetricsLoginForm as AdminLoginForm };
