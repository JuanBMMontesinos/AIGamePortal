"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, Loader2, ShieldCheck } from "lucide-react";

interface NewsletterBoxProps {
  variant?: "default" | "sidebar";
  className?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function NewsletterBox({ variant = "default", className = "" }: NewsletterBoxProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setStatus("error");
      setMessage("Por favor, digite seu endereço de e-mail.");
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setStatus("error");
      setMessage("Insira um e-mail válido (ex: seu-nome@email.com).");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(
          data.message ||
            "🎉 Inscrição confirmada! Você receberá nosso resumo gamer todo domingo."
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Não foi possível concluir sua inscrição. Tente novamente.");
      }
    } catch {
      setStatus("error");
      setMessage("Erro de conexão com o servidor. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isSidebar = variant === "sidebar";

  return (
    <div
      id={`newsletter-box-${variant}`}
      className={`relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-gamer-800 bg-gradient-to-b from-brand-purple/10 via-brand-cyan/5 to-white dark:to-gamer-950 p-6 sm:p-8 shadow-lg transition-all ${className}`}
    >
      {/* Decorative Gamer Glow Accents */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-brand-cyan/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-brand-purple/15 text-brand-purple border border-brand-purple/30">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Newsletter Semanal Gamer</span>
          </div>

          <h3
            className={`font-black tracking-tight text-zinc-900 dark:text-white leading-snug ${
              isSidebar ? "text-lg" : "text-xl sm:text-2xl"
            }`}
          >
            Receba o Resumo Gamer da Semana 🎮
          </h3>

          <p
            className={`text-zinc-600 dark:text-zinc-300 leading-relaxed ${
              isSidebar ? "text-xs" : "text-sm max-w-xl"
            }`}
          >
            As principais notícias, lançamentos e ofertas imperdíveis direto na sua caixa de entrada todo domingo. Sem spam.
          </p>
        </div>

        {/* State: Success */}
        {status === "success" ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>Inscrição Realizada com Sucesso!</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              {message}
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setMessage("");
              }}
              className="text-[11px] font-semibold text-brand-purple dark:text-brand-cyan underline pt-1 cursor-pointer"
            >
              Cadastrar outro e-mail
            </button>
          </div>
        ) : (
          /* Form Input */
          <form onSubmit={handleSubmit} className="space-y-3">
            <div
              className={`flex ${
                isSidebar ? "flex-col" : "flex-col sm:flex-row"
              } gap-2.5`}
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id={`newsletter-email-${variant}`}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  disabled={loading}
                  placeholder="Seu melhor e-mail gamer..."
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium bg-white dark:bg-gamer-900/90 border border-zinc-300 dark:border-gamer-700 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              <button
                id={`newsletter-submit-${variant}`}
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-purple to-brand-cyan hover:opacity-95 active:scale-[0.98] transition-all shadow-neon-purple shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inscrevendo...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Quero Receber</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {status === "error" && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Privacy Badge */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Disparo único semanal aos domingos. Cancele quando quiser em 1 clique.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
