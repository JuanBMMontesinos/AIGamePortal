"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Share2,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  LogOut,
  Sliders,
  BellOff,
  Activity,
  DollarSign,
  ShoppingBag,
  Mail,
  BarChart3,
  MessageSquare,
  Twitter,
  Info,
  Zap,
  Terminal,
} from "lucide-react";
import { SocialSettings } from "@/types/database";
import { SocialAdminKPIs } from "@/lib/data/social-admin";

interface AdminSocialViewProps {
  initialSettings: SocialSettings;
  initialKpis: SocialAdminKPIs;
}

export function AdminSocialView({ initialSettings, initialKpis }: AdminSocialViewProps) {
  const router = useRouter();

  // Estados de configurações
  const [settings, setSettings] = useState<SocialSettings>(initialSettings);
  const [kpis, setKpis] = useState<SocialAdminKPIs>(initialKpis);

  // Estados locais editáveis
  const [isTwitterEnabled, setIsTwitterEnabled] = useState(initialSettings.is_twitter_enabled);
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(initialSettings.is_telegram_enabled);
  const [twitterReason, setTwitterReason] = useState(initialSettings.twitter_disabled_reason || "");
  const [telegramReason, setTelegramReason] = useState(initialSettings.telegram_disabled_reason || "");

  // Estados de carregamento e feedback
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingTwitter, setTestingTwitter] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Formatação de datas
  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return "Nunca executado";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  // Salvar configurações
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_twitter_enabled: isTwitterEnabled,
          is_telegram_enabled: isTelegramEnabled,
          twitter_disabled_reason: twitterReason,
          telegram_disabled_reason: telegramReason,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSettings(data.settings);
        setKpis((prev) => ({
          ...prev,
          isTwitterEnabled: data.settings.is_twitter_enabled,
          isTelegramEnabled: data.settings.is_telegram_enabled,
          twitterDisabledReason: data.settings.twitter_disabled_reason,
          telegramDisabledReason: data.settings.telegram_disabled_reason,
        }));
        setFeedback({
          type: "success",
          text: "Configurações de redes sociais salvas com sucesso!",
        });
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Erro ao salvar alterações.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erro de rede ao conectar com o servidor.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Disparo de teste para o X
  const handleTestTwitter = async () => {
    setTestingTwitter(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_twitter" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: `🎉 Tweet de teste publicado com sucesso! (ID: ${data.tweetId || "OK"})`,
        });
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Falha ao enviar tweet de teste.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erro de conexão ao testar disparo no X.",
      });
    } finally {
      setTestingTwitter(false);
      refreshData();
    }
  };

  // Disparo de teste para o Telegram
  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_telegram" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: `✈️ Mensagem de teste enviada com sucesso para o Telegram! (Message ID: ${data.messageId || "OK"})`,
        });
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Falha ao enviar mensagem de teste ao Telegram.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erro de conexão ao testar disparo no Telegram.",
      });
    } finally {
      setTestingTelegram(false);
      refreshData();
    }
  };

  // Atualizar dados da tela
  const refreshData = async () => {
    try {
      const res = await fetch("/api/admin/social");
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        setKpis(data.kpis);
      }
    } catch {
      // silêncio
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.refresh();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16 space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ==================================================================== */}
      {/* 1. CABEÇALHO & NAVEGAÇÃO ENTRE PAINÉIS ADMINISTRATIVOS */}
      {/* ==================================================================== */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Painel de Redes Sociais
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Fase 2 • Distribuição
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gerencie o status de ativação, telemetria e testes de postagens automáticas no X (Twitter) e Telegram.
              </p>
            </div>
          </div>
        </div>

        {/* Links para os demais Painéis */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/admin/metricas"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-brand-purple" />
            <span>Métricas B2B</span>
          </a>

          <a
            href="/admin/afiliados"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Afiliados</span>
          </a>

          <a
            href="/admin/newsletter"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-brand-purple" />
            <span>Newsletter</span>
          </a>

          <a
            href="/admin/discord"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Discord</span>
          </a>

          <a
            href="/admin/logs"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Logs & IA</span>
          </a>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer ml-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 animate-fadeIn ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : feedback.type === "info"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. CARD INFORMATIVO DE CRÉDITOS DO X (TWITTER) */}
        {/* ==================================================================== */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-blue-950/20 to-zinc-900 border border-sky-500/30 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0 mt-0.5 sm:mt-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Status do X (Twitter): Chave Mestre Inicial Desabilitada</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Aguardando Créditos
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                  A API do X opera no modelo pré-pago (<em>pay-per-use</em>). Por padrão de segurança, o envio para o X está desabilitado para não gerar erros no pipeline.
                  Quando você recarregar créditos em{" "}
                  <a
                    href="https://developer.x.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline font-semibold"
                  >
                    developer.x.com ↗
                  </a>
                  , basta ativar a chave abaixo e salvar. O pipeline do GitHub Actions voltará a publicar tweets automaticamente!
                </p>
              </div>
            </div>

            <a
              href="https://developer.x.com/en/portal/dashboard"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>X Developer Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. CARDS DE KPIS E STATUS DAS REDES */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: X (Twitter) Status */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                X / Twitter
              </span>
              <Twitter className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isTwitterEnabled ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-zinc-600"
                }`}
              />
              <span className="text-lg font-black text-white">
                {isTwitterEnabled ? "Habilitado" : "Pausado"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {isTwitterEnabled
                ? "Disparos ativos a cada notícia"
                : "Envios automáticos bloqueados"}
            </p>
          </div>

          {/* Card 2: Telegram Status */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Telegram
              </span>
              <Send className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isTelegramEnabled ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-zinc-600"
                }`}
              />
              <span className="text-lg font-black text-white">
                {isTelegramEnabled ? "Habilitado" : "Pausado"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {isTelegramEnabled
                ? "Canal público recebendo posts"
                : "Envios para o canal pausados"}
            </p>
          </div>

          {/* Card 3: Credenciais X */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Conta do X
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-white truncate">
              @MadeByAiGames
            </div>
            <p className="text-[11px] text-zinc-500">
              {kpis.isTwitterConfigured
                ? "Credenciais OAuth 1.0a configuradas"
                : "Chaves ausentes no .env.local"}
            </p>
          </div>

          {/* Card 4: Canal Telegram */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Bot Telegram
              </span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-black text-white truncate">
              @aigameportal_noticias
            </div>
            <p className="text-[11px] text-zinc-500">
              {kpis.isTelegramConfigured
                ? "Bot conectado e autorizado"
                : "Token ou Chat ID ausente"}
            </p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 4. CHAVES MESTRAS DE CONTROLE & JUSTIFICATIVAS */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card de Controle: X (Twitter) */}
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                  <Twitter className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Controle do X (Twitter)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Chave mestre de publicações no feed oficial do X
                  </p>
                </div>
              </div>

              {/* Botão de Teste */}
              <button
                type="button"
                onClick={handleTestTwitter}
                disabled={testingTwitter}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testingTwitter ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Postando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Testar Tweet</span>
                  </>
                )}
              </button>
            </div>

            {/* Switch de Ativação do X */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-white cursor-pointer" htmlFor="toggle-twitter">
                  Envios Automáticos para o X
                </label>
                <p className="text-xs text-zinc-400">
                  {isTwitterEnabled
                    ? "Posts liberados para cada nova notícia publicada."
                    : "Envios pausados pelo administrador (economiza requisições)."}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="toggle-twitter"
                  type="checkbox"
                  checked={isTwitterEnabled}
                  onChange={(e) => setIsTwitterEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {/* Justificativa de Pausa do X */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Justificativa / Motivo da Pausa (X/Twitter)
              </label>
              <input
                type="text"
                value={twitterReason}
                onChange={(e) => setTwitterReason(e.target.value)}
                placeholder="Ex: Aguardando recarga de créditos no X Developer Portal..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                Esta mensagem é registrada nos logs e na telemetria caso o envio seja pulado.
              </p>
            </div>

            {/* Telemetria de Último Disparo do X */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-400">Último disparo:</span>
                <span className="text-zinc-300">{formatDate(settings.last_twitter_dispatched_at)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-400">Status do envio:</span>
                <span
                  className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                    settings.last_twitter_dispatch_status === "success"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : settings.last_twitter_dispatch_status === "skipped"
                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      : settings.last_twitter_dispatch_status === "failed"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {settings.last_twitter_dispatch_status || "idle"}
                </span>
              </div>
              {settings.last_twitter_dispatch_log && (
                <div className="pt-1">
                  <p className="text-[11px] font-mono text-zinc-400 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 break-all">
                    {settings.last_twitter_dispatch_log}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card de Controle: Telegram */}
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Controle do Telegram
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Chave mestre de publicações no canal oficial do Telegram
                  </p>
                </div>
              </div>

              {/* Botão de Teste Telegram */}
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testingTelegram ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Testar Mensagem</span>
                  </>
                )}
              </button>
            </div>

            {/* Switch de Ativação do Telegram */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-white cursor-pointer" htmlFor="toggle-telegram">
                  Envios Automáticos para o Telegram
                </label>
                <p className="text-xs text-zinc-400">
                  {isTelegramEnabled
                    ? "Posts liberados para cada nova notícia publicada."
                    : "Envios para o canal do Telegram pausados pelo administrador."}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="toggle-telegram"
                  type="checkbox"
                  checked={isTelegramEnabled}
                  onChange={(e) => setIsTelegramEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {/* Justificativa de Pausa do Telegram */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Justificativa / Motivo da Pausa (Telegram)
              </label>
              <input
                type="text"
                value={telegramReason}
                onChange={(e) => setTelegramReason(e.target.value)}
                placeholder="Ex: Manutenção no canal oficial..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                Opcional. Registrado nos logs caso as mensagens do canal sejam pausadas.
              </p>
            </div>

            {/* Telemetria de Último Disparo do Telegram */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-400">Último disparo:</span>
                <span className="text-zinc-300">{formatDate(settings.last_telegram_dispatched_at)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-400">Status do envio:</span>
                <span
                  className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                    settings.last_telegram_dispatch_status === "success"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : settings.last_telegram_dispatch_status === "skipped"
                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      : settings.last_telegram_dispatch_status === "failed"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {settings.last_telegram_dispatch_status || "idle"}
                </span>
              </div>
              {settings.last_telegram_dispatch_log && (
                <div className="pt-1">
                  <p className="text-[11px] font-mono text-zinc-400 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 break-all">
                    {settings.last_telegram_dispatch_log}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. BOTÃO PRINCIPAL DE SALVAR ALTERAÇÕES */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={refreshData}
            className="px-4 py-3 rounded-2xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar Dados</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sliders className="w-4 h-4" />
            <span>{savingSettings ? "Salvando..." : "Salvar Configurações de Redes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
