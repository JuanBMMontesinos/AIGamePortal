"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Mail, Gamepad2 } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const email = searchParams.get("email") || "";

  const [resubscribeLoading, setResubscribeLoading] = useState(false);
  const [resubscribed, setResubscribed] = useState(false);
  const [resubscribeError, setResubscribeError] = useState("");

  const handleResubscribe = async () => {
    if (!email) return;
    setResubscribeLoading(true);
    setResubscribeError("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResubscribed(true);
      } else {
        setResubscribeError(data.error || "Não foi possível reativar a inscrição.");
      }
    } catch {
      setResubscribeError("Erro ao comunicar com o servidor. Tente novamente.");
    } finally {
      setResubscribeLoading(false);
    }
  };

  const isSuccess = status === "success";

  return (
    <div className="max-w-md w-full mx-auto my-12 p-8 rounded-3xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 shadow-xl text-center space-y-6">
      {/* Icon Badge */}
      <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-gamer-800 border border-zinc-200 dark:border-gamer-700 flex items-center justify-center">
        {resubscribed ? (
          <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
        ) : isSuccess ? (
          <Mail className="w-8 h-8 text-brand-purple" />
        ) : (
          <AlertCircle className="w-8 h-8 text-amber-500" />
        )}
      </div>

      {/* Main Messages */}
      {resubscribed ? (
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Inscrição Reativada! 🎮
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Seu e-mail <strong className="text-brand-cyan">{email}</strong> foi adicionado novamente. Nos vemos no próximo domingo com o melhor dos games!
          </p>
        </div>
      ) : isSuccess ? (
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Descadastro Confirmado
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            O e-mail {email ? <strong className="text-brand-purple">{email}</strong> : "seu endereço"} foi removido com sucesso da nossa lista semanal de e-mails. Você não receberá mais os resumos automáticos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Aviso de Descadastro
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {status === "missing_email"
              ? "Nenhum e-mail foi especificado para o cancelamento."
              : "Não foi possível concluir o descadastro automático. Entre em contato conosco para remoção manual."}
          </p>
        </div>
      )}

      {/* Resubscribe Action if Unsubscribed by mistake */}
      {isSuccess && !resubscribed && email && (
        <div className="pt-2 border-t border-zinc-100 dark:border-gamer-800">
          <p className="text-xs text-zinc-500 mb-3">
            Clicou sem querer? Você pode reativar sua inscrição a qualquer momento:
          </p>
          <button
            onClick={handleResubscribe}
            disabled={resubscribeLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-purple hover:bg-brand-purple/90 text-white transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
          >
            {resubscribeLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Reativar Minha Inscrição
          </button>
          {resubscribeError && (
            <p className="text-[11px] text-rose-500 mt-2">{resubscribeError}</p>
          )}
        </div>
      )}

      {/* Back to Home Button */}
      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-purple dark:hover:text-brand-purple transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Página Inicial do Made By AI Games
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center text-sm text-zinc-500">Carregando...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
