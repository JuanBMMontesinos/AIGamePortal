"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Gift,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sliders,
  BellOff,
  Activity,
  Calendar,
  DollarSign,
  Monitor,
  ShoppingBag,
  Mail,
} from "lucide-react";
import { DiscordSettings, FreeGameHistory } from "@/types/database";
import { DiscordAdminKPIs } from "@/lib/data/discord-admin";

interface AdminDiscordViewProps {
  initialSettings: DiscordSettings;
  initialKpis: DiscordAdminKPIs;
  initialHistory: {
    items: FreeGameHistory[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function AdminDiscordView({
  initialSettings,
  initialKpis,
  initialHistory,
}: AdminDiscordViewProps) {
  const router = useRouter();

  // Estados de configurações
  const [settings, setSettings] = useState<DiscordSettings>(initialSettings);
  const [kpis, setKpis] = useState<DiscordAdminKPIs>(initialKpis);
  const [history, setHistory] = useState(initialHistory);

  // Estados locais para inputs editáveis
  const [isDealsEnabled, setIsDealsEnabled] = useState(initialSettings.is_deals_enabled);
  const [isNewsEnabled, setIsNewsEnabled] = useState(initialSettings.is_news_enabled);
  const [dealsReason, setDealsReason] = useState(initialSettings.deals_disabled_reason || "");
  const [newsReason, setNewsReason] = useState(initialSettings.news_disabled_reason || "");

  // Estados de carregamento e feedback
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingDeals, setTestingDeals] = useState(false);
  const [testingNews, setTestingNews] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // Salvar configurações no backend
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/discord", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_deals_enabled: isDealsEnabled,
          is_news_enabled: isNewsEnabled,
          deals_disabled_reason: dealsReason,
          news_disabled_reason: newsReason,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSettings(data.settings);
        setFeedback({
          type: "success",
          text: "Configurações do Discord salvas com sucesso!",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Erro ao salvar configurações.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro de rede ao salvar configurações.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Disparo de teste de Deal
  const handleTestDeal = async () => {
    setTestingDeals(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_deal" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: "Alerta de teste de Jogo Grátis enviado com sucesso para o canal do Discord!",
        });
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Falha ao enviar alerta de teste de jogo grátis.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro de rede ao testar webhook de jogos grátis.",
      });
    } finally {
      setTestingDeals(false);
    }
  };

  // Disparo de teste de Breaking News
  const handleTestNews = async () => {
    setTestingNews(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_news" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: "Alerta de teste de Breaking News enviado com sucesso para o canal do Discord!",
        });
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Falha ao enviar alerta de teste de Breaking News.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro de rede ao testar webhook de notícias.",
      });
    } finally {
      setTestingNews(false);
    }
  };

  // Busca e paginação no histórico
  const fetchHistoryPage = async (page: number, search?: string) => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search && search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/discord?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Erro ao paginar histórico:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistoryPage(1, searchTerm);
  };

  // Logout do administrador
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.refresh();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ==================================================================== */}
      {/* 1. CABEÇALHO & NAVEGAÇÃO ENTRE PAINÉIS ADMINISTRATIVOS */}
      {/* ==================================================================== */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Painel do Discord
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Fase 4 • Automação
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gerencie com segurança a habilitação e os disparos de Jogos Grátis e Breaking News para o Discord.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Ações e Links para os demais Painéis */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/admin/afiliados"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Painel Afiliados</span>
          </a>

          <a
            href="/admin/newsletter"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-brand-purple" />
            <span>Painel Newsletter</span>
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
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm transition-all ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer font-bold px-2 py-1"
            >
              ✕ Fechar
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. CENTRO DE CONTROLE: CHAVES MESTRAS DE HABILITAÇÃO */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Jogos Grátis (Deals) */}
          <div
            className={`rounded-3xl border p-6 sm:p-7 space-y-6 transition-all relative overflow-hidden backdrop-blur-sm ${
              isDealsEnabled
                ? "bg-zinc-900/90 border-emerald-500/40 shadow-xl shadow-emerald-500/5"
                : "bg-zinc-900/60 border-zinc-800"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                    isDealsEnabled ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    Alertas de Jogos Grátis
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Epic Games Store, Steam, GOG, Prime Gaming e consoles
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDealsEnabled}
                  onChange={(e) => setIsDealsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Badge de Status Atual */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
              <span className="text-zinc-400 font-medium">Status do Envio de Jogos:</span>
              {isDealsEnabled ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  HABILITADO (Disparando via Cron)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-bold text-red-400">
                  <BellOff className="w-3.5 h-3.5" />
                  DESABILITADO (Envios Pausados)
                </span>
              )}
            </div>

            {/* Justificativa quando desabilitado */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Motivo / Justificativa da Pausa
              </label>
              <input
                type="text"
                value={dealsReason}
                onChange={(e) => setDealsReason(e.target.value)}
                placeholder="Ex: Pausado temporariamente para manutenção..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                Este motivo é registrado no banco e exibido nos logs do bot durante a checagem.
              </p>
            </div>
          </div>

          {/* Card 2: Breaking News (5/5) */}
          <div
            className={`rounded-3xl border p-6 sm:p-7 space-y-6 transition-all relative overflow-hidden backdrop-blur-sm ${
              isNewsEnabled
                ? "bg-zinc-900/90 border-red-500/40 shadow-xl shadow-red-500/5"
                : "bg-zinc-900/60 border-zinc-800"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                    isNewsEnabled ? "bg-red-600 shadow-lg shadow-red-600/20" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    Alertas de Breaking News
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Anúncios de hardware, trailers mundiais e grandes revelações (5/5)
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewsEnabled}
                  onChange={(e) => setIsNewsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Badge de Status Atual */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
              <span className="text-zinc-400 font-medium">Status do Envio de Notícias:</span>
              {isNewsEnabled ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  HABILITADO (Disparando no Pipeline)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-bold text-zinc-400">
                  <BellOff className="w-3.5 h-3.5" />
                  DESABILITADO (Envios Pausados)
                </span>
              )}
            </div>

            {/* Justificativa quando desabilitado */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Motivo / Justificativa da Pausa
              </label>
              <input
                type="text"
                value={newsReason}
                onChange={(e) => setNewsReason(e.target.value)}
                placeholder="Ex: Pausado pelo editor-chefe durante recesso..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                Garante que notícias urgentes do pipeline não sejam disparadas no Discord até autorização.
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Salvar Alterações de Configurações */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>{savingSettings ? "Salvando Alterações..." : "Salvar Configurações de Envio"}</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* 3. DIAGNÓSTICO & TESTE DE WEBHOOKS EM TEMPO REAL */}
        {/* ==================================================================== */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Diagnóstico & Validação de Webhooks
              </h2>
              <p className="text-xs text-zinc-400">
                Verifique as conexões e envie mensagens de teste controladas para homologar os canais do Discord.
              </p>
            </div>
            <span className="text-[11px] text-zinc-500">
              Tokens protegidos por mascaramento de segurança
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Diagnóstico Deals */}
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Canal de Jogos Grátis</span>
                </div>
                {kpis.isDealsWebhookConfigured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Conectado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Não configurado
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400">Webhook URL:</span>
                <p className="text-xs font-mono bg-zinc-900 px-3 py-2 rounded-xl text-zinc-300 border border-zinc-800 truncate">
                  {kpis.dealsWebhookMasked || "DISCORD_WEBHOOK_FREE_GAMES não definido"}
                </p>
              </div>

              <button
                onClick={handleTestDeal}
                disabled={testingDeals || !kpis.isDealsWebhookConfigured}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingDeals ? "Enviando Teste..." : "Disparar Alerta de Teste (Deals)"}</span>
              </button>
            </div>

            {/* Diagnóstico News */}
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-white">Canal de Breaking News</span>
                </div>
                {kpis.isNewsWebhookConfigured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Conectado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Não configurado
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400">Webhook URL:</span>
                <p className="text-xs font-mono bg-zinc-900 px-3 py-2 rounded-xl text-zinc-300 border border-zinc-800 truncate">
                  {kpis.newsWebhookMasked || "DISCORD_WEBHOOK_NEWS não definido"}
                </p>
              </div>

              <button
                onClick={handleTestNews}
                disabled={testingNews || !kpis.isNewsWebhookConfigured}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingNews ? "Enviando Teste..." : "Disparar Alerta de Teste (News)"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 4. CARDS DE KPIS E TELEMETRIA */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Total de Ofertas Notificadas</span>
              <Gift className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{kpis.totalFreeGamesPosted}</p>
            <p className="text-[11px] text-zinc-500">Registros em free_games_history</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Último Ciclo de Jogos Grátis</span>
              <Calendar className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-sm font-bold text-white">
              {formatDate(kpis.lastDealsDispatchedAt)}
            </p>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              Status: <span className="font-semibold text-zinc-300 uppercase">{kpis.lastDealsDispatchStatus}</span>
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Frequência do Cron</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-white">A cada 2 horas</p>
            <p className="text-[11px] text-zinc-500">GitHub Actions (Ubuntu Serverless)</p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. HISTÓRICO DE OFERTAS NOTIFICADAS */}
        {/* ==================================================================== */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                Histórico de Jogos Notificados no Discord
              </h2>
              <p className="text-xs text-zinc-400">
                Lista de gratuidades já registradas no banco para prevenção de alertas duplicados.
              </p>
            </div>

            {/* Formulário de Busca */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar jogo ou plataforma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Tabela de Ofertas */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 font-bold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Jogo</th>
                  <th className="py-3 px-4">Plataforma</th>
                  <th className="py-3 px-4">Preço Original</th>
                  <th className="py-3 px-4">Enviado em</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                      Carregando ofertas...
                    </td>
                  </tr>
                ) : history.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Nenhuma oferta gratuita encontrada no histórico.
                    </td>
                  </tr>
                ) : (
                  history.items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                              <Gift className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-xs sm:max-w-sm">
                              {item.title}
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: {item.deal_id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-[11px] font-medium">
                          {item.platform || "PC"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        {item.worth || "Grátis"}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {formatDate(item.posted_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.giveaway_url ? (
                          <a
                            href={item.giveaway_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <span>Ver Oferta</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {history.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500">
                Página {history.page} de {history.totalPages} ({history.total} ofertas registradas)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={history.page <= 1 || loadingHistory}
                  onClick={() => fetchHistoryPage(history.page - 1, searchTerm)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <button
                  disabled={history.page >= history.totalPages || loadingHistory}
                  onClick={() => fetchHistoryPage(history.page + 1, searchTerm)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
