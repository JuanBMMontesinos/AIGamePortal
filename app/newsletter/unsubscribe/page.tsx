"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Mail,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  // Estados de confirmação do descadastro
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(statusParam === "success");
  const [errorMessage, setErrorMessage] = useState("");

  // Estados de reativação (resubscribe)
  const [resubscribeLoading, setResubscribeLoading] = useState(false);
  const [resubscribed, setResubscribed] = useState(false);
  const [resubscribeError, setResubscribeError] = useState("");

  const email = emailParam.trim().toLowerCase();
  const token = tokenParam.trim();
  const hasValidParams = Boolean(email && token);

  const handleConfirmUnsubscribe = async () => {
    if (!email || !token) {
      setErrorMessage("Parâmetros de autenticação ausentes no link.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setUnsubscribed(true);
      } else {
        setErrorMessage(
          data.error || "Não foi possível confirmar o descadastro. O link pode ter expirado ou ser inválido."
        );
      }
    } catch {
      setErrorMessage("Erro de comunicação com o servidor. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      const data = await res.json().catch(() => ({}));
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

  return (
    <div className="max-w-md w-full mx-auto my-12 p-8 rounded-3xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 shadow-xl text-center space-y-6 transition-all">
      {/* Icon Badge */}
      <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-gamer-800 border border-zinc-200 dark:border-gamer-700 flex items-center justify-center">
        {resubscribed ? (
          <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
        ) : unsubscribed ? (
          <Mail className="w-8 h-8 text-brand-purple" />
        ) : hasValidParams ? (
          <ShieldAlert className="w-8 h-8 text-amber-500" />
        ) : (
          <AlertCircle className="w-8 h-8 text-rose-500" />
        )}
      </div>

      {/* 1. ESTADO: INSCRIÇÃO REATIVADA COM SUCESSO */}
      {resubscribed && (
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Inscrição Reativada! 🎮
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Seu e-mail <strong className="text-brand-cyan">{email}</strong> foi readicionado.
            Nos vemos no próximo domingo com as principais novidades gamer!
          </p>
        </div>
      )}

      {/* 2. ESTADO: DESCADASTRO CONFIRMADO COM SUCESSO */}
      {unsubscribed && !resubscribed && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Descadastro Confirmado
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              O endereço {email ? <strong className="text-brand-purple">{email}</strong> : "seu e-mail"} foi
              removido da lista semanal do Made By AI Games. Você não receberá mais os resumos automáticos.
            </p>
          </div>

          {/* Reativar se foi engano */}
          {email && (
            <div className="pt-3 border-t border-zinc-100 dark:border-gamer-800 space-y-2">
              <p className="text-[11px] text-zinc-500">
                Cancelou por engano? É possível reativar com apenas um clique:
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
                <p className="text-[11px] text-rose-500">{resubscribeError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. ESTADO: CONFIRMAÇÃO PENDENTE (LINK COM TOKEN VÁLIDO) */}
      {!unsubscribed && !resubscribed && hasValidParams && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Confirmar Cancelamento
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Você realmente deseja parar de receber o resumo semanal de games no e-mail:
            </p>
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-gamer-950 border border-zinc-200 dark:border-gamer-800 text-xs font-semibold text-brand-purple dark:text-brand-cyan break-all">
              {email}
            </div>
            <p className="text-[11px] text-zinc-500 pt-1">
              Esta confirmação protege seu e-mail contra desativações acidentais por filtros de antivírus.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-left">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={handleConfirmUnsubscribe}
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processando cancelamento...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirmar Descadastro
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. ESTADO: PARÂMETROS AUSENTES OU LINK INVÁLIDO */}
      {!unsubscribed && !resubscribed && !hasValidParams && (
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Link de Descadastro Seguro
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {statusParam === "missing_email"
              ? "Nenhum endereço de e-mail foi especificado no link."
              : "Para proteger sua conta contra desinscrições forjadas, o cancelamento exige o link exclusivo com token de segurança assinado enviado no rodapé dos nossos e-mails."}
          </p>
          <p className="text-[11px] text-zinc-500">
            Abra a edição mais recente da newsletter na sua caixa de entrada e clique no link de cancelamento.
          </p>
        </div>
      )}

      {/* Link de Retorno */}
      <div className="pt-2 border-t border-zinc-100 dark:border-gamer-800">
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
