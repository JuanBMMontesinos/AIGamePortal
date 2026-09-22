"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Terminal,
  ShieldAlert,
  BarChart3,
  DollarSign,
  Mail,
  MessageSquare,
  Share2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Eye,
  Check,
  Trash2,
  Copy,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Bot,
  ExternalLink,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  AISystemLog,
  FailureReasonCode,
  LogLevel,
  LogService,
  LogStatus,
} from "@/types/database";
import {
  GetSystemLogsAdminResult,
  SystemLogsAdminKPIs,
} from "@/lib/data/logs-admin";
import { formatRelativeTime } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface AdminLogsViewProps {
  initialLogsResult: GetSystemLogsAdminResult;
  initialKpis: SystemLogsAdminKPIs;
}

type TabType = "all" | "incomplete" | "ai" | "social" | "critical";

export function AdminLogsView({
  initialLogsResult,
  initialKpis,
}: AdminLogsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Estados de dados
  const [logsResult, setLogsResult] = useState<GetSystemLogsAdminResult>(initialLogsResult);
  const [kpis, setKpis] = useState<SystemLogsAdminKPIs>(initialKpis);
  const [loading, setLoading] = useState(false);

  // Estados de filtros
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [service, setService] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Estados de modais
  const [selectedLog, setSelectedLog] = useState<AISystemLog | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeSuccessMessage, setPurgeSuccessMessage] = useState<string | null>(null);

  // Estados de cópia e notificação
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const notify = (text: string, type: "success" | "error" | "info" = "info") => {
    setActionFeedback({ type, text });
    setTimeout(() => setActionFeedback(null), 4500);
  };

  // Função centralizada para carregar logs com os filtros ativos
  const fetchLogs = async (
    targetPage: number = page,
    customOverrides?: {
      tab?: TabType;
      service?: string;
      level?: string;
      status?: string;
      search?: string;
    }
  ) => {
    setLoading(true);
    try {
      const activeCurrentTab = customOverrides?.tab !== undefined ? customOverrides.tab : activeTab;
      const currentService = customOverrides?.service !== undefined ? customOverrides.service : service;
      const currentLevel = customOverrides?.level !== undefined ? customOverrides.level : level;
      const currentStatus = customOverrides?.status !== undefined ? customOverrides.status : status;
      const currentSearch = customOverrides?.search !== undefined ? customOverrides.search : search;

      const params = new URLSearchParams();
      params.set("page", targetPage.toString());
      params.set("limit", "20");

      if (currentSearch.trim()) {
        params.set("search", currentSearch.trim());
      }

      // Regras de abas rápidas
      if (activeCurrentTab === "incomplete") {
        params.set("incompleteOnly", "true");
      } else if (activeCurrentTab === "ai") {
        if (currentService === "all") {
          params.set("service", "ai_writer");
        }
      } else if (activeCurrentTab === "critical") {
        params.set("level", "critical");
      }

      // Regras de seletores explícitos
      if (currentService !== "all" && activeCurrentTab !== "ai") {
        params.set("service", currentService);
      }
      if (currentLevel !== "all" && activeCurrentTab !== "critical") {
        params.set("level", currentLevel);
      }
      if (currentStatus !== "all") {
        params.set("status", currentStatus);
      }

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLogsResult({
            logs: json.logs || [],
            total: json.total || 0,
            page: json.page || 1,
            totalPages: json.totalPages || 1,
            limit: json.limit || 20,
          });
          if (json.kpis) {
            setKpis(json.kpis);
          }
          setPage(targetPage);
        }
      } else if (res.status === 401) {
        notify("Sessão administrativa expirada. Por favor, reautentique-se.", "error");
      } else {
        notify("Falha ao atualizar registros de logs do sistema.", "error");
      }
    } catch {
      notify("Erro de conexão com o servidor ao consultar logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Troca de Aba Rápida
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    setPage(1);

    if (newTab === "all") {
      setService("all");
      setLevel("all");
      setStatus("all");
      fetchLogs(1, { tab: "all", service: "all", level: "all", status: "all" });
    } else if (newTab === "incomplete") {
      fetchLogs(1, { tab: "incomplete" });
    } else if (newTab === "ai") {
      setService("ai_writer");
      fetchLogs(1, { tab: "ai", service: "ai_writer" });
    } else if (newTab === "social") {
      setService("social_x");
      fetchLogs(1, { tab: "social", service: "social_x" });
    } else if (newTab === "critical") {
      setLevel("critical");
      fetchLogs(1, { tab: "critical", level: "critical" });
    }
  };

  // Submissão de busca
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  // Reset de todos os filtros
  const handleResetFilters = () => {
    setActiveTab("all");
    setSearch("");
    setService("all");
    setLevel("all");
    setStatus("all");
    setPage(1);
    fetchLogs(1, {
      tab: "all",
      search: "",
      service: "all",
      level: "all",
      status: "all",
    });
  };

  // Ação: Marcar Log como Resolvido
  const handleResolveLog = async (logId: string) => {
    try {
      const res = await fetch("/api/admin/logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId,
          action: "resolve",
          resolvedBy: "admin_operator",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify("Ocorrência marcada como resolvida com sucesso!", "success");
        // Atualiza o estado local imediatamente
        setLogsResult((prev) => ({
          ...prev,
          logs: prev.logs.map((item) =>
            item.id === logId
              ? {
                  ...item,
                  resolved_at: data.log.resolved_at || new Date().toISOString(),
                  resolved_by: data.log.resolved_by || "admin_operator",
                }
              : item
          ),
        }));

        if (selectedLog && selectedLog.id === logId) {
          setSelectedLog((prev) =>
            prev
              ? {
                  ...prev,
                  resolved_at: data.log.resolved_at || new Date().toISOString(),
                  resolved_by: data.log.resolved_by || "admin_operator",
                }
              : null
          );
        }
      } else {
        notify(data.error || "Não foi possível resolver a ocorrência.", "error");
      }
    } catch {
      notify("Erro de rede ao marcar log como resolvido.", "error");
    }
  };

  // Ação: Purgar Logs Antigos (>30d)
  const handlePurgeLogs = async () => {
    setPurging(true);
    setPurgeSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysToKeep: 30 }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPurgeSuccessMessage(
          `Sucesso! ${data.deletedCount} registros de logs anteriores a 30 dias foram expurgados permanentemente.`
        );
        notify(`${data.deletedCount} logs antigos expurgados com sucesso.`, "success");
        // Recarrega lista
        fetchLogs(1);
      } else {
        notify(data.error || "Falha ao executar rotina de expurgo.", "error");
      }
    } catch {
      notify("Erro de conexão ao executar expurgo de logs.", "error");
    } finally {
      setPurging(false);
    }
  };

  // Logout Administrativo
  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    startTransition(() => {
      router.refresh();
    });
  };

  // Funções de Cópia
  const copyToClipboard = (text: string, isTrace: boolean) => {
    navigator.clipboard.writeText(text);
    if (isTrace) {
      setCopiedTrace(true);
      setTimeout(() => setCopiedTrace(false), 2500);
    } else {
      setCopiedMeta(true);
      setTimeout(() => setCopiedMeta(false), 2500);
    }
  };

  // Helper para formatar data completa em pt-BR
  const formatFullDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      return format(new Date(isoString), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch {
      return isoString;
    }
  };

  // Helpers visuais para Badges
  const getLevelBadge = (lvl: LogLevel) => {
    switch (lvl) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            Crítico
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Erro
          </span>
        );
      case "warn":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            Aviso
          </span>
        );
      case "info":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Info className="w-3 h-3" />
            Info
          </span>
        );
    }
  };

  const getServiceBadge = (srv: LogService) => {
    switch (srv) {
      case "ai_writer":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Bot className="w-3 h-3 text-purple-400" />
            ai_writer
          </span>
        );
      case "ai_embedding":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            ai_embedding
          </span>
        );
      case "ai_hub":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Layers className="w-3 h-3 text-indigo-400" />
            ai_hub
          </span>
        );
      case "social_x":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Share2 className="w-3 h-3 text-sky-400" />
            social_x
          </span>
        );
      case "social_telegram":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Share2 className="w-3 h-3 text-blue-400" />
            social_telegram
          </span>
        );
      case "social_discord":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <MessageSquare className="w-3 h-3 text-emerald-400" />
            social_discord
          </span>
        );
      case "social_instagram":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-pink-500/15 text-pink-300 border border-pink-500/30">
            <Share2 className="w-3 h-3 text-pink-400" />
            social_instagram
          </span>
        );
      case "rss_scraper":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <RotateCcw className="w-3 h-3 text-orange-400" />
            rss_scraper
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Terminal className="w-3 h-3 text-zinc-400" />
            {srv}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ================================================================= */}
        {/* 1. BARRA DE NAVEGAÇÃO ADMINISTRATIVA UNIFICADA (6 MÓDULOS)       */}
        {/* ================================================================= */}
        <nav className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/metricas"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-brand-purple" />
              Métricas B2B & Patrocínio
            </Link>

            <Link
              href="/admin/afiliados"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              Afiliados & Lojas
            </Link>

            <Link
              href="/admin/newsletter"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Mail className="w-4 h-4 text-brand-purple" />
              Newsletter
            </Link>

            <Link
              href="/admin/discord"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Discord & Alertas
            </Link>

            <Link
              href="/admin/redes"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              Redes Sociais
            </Link>

            {/* Módulo Ativo: Central de Logs & IA */}
            <Link
              href="/admin/logs"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-purple text-white shadow-md shadow-brand-purple/30"
            >
              <Terminal className="w-4 h-4 text-cyan-300" />
              Central de Logs & IA
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Audit Logs PostgreSQL Ativo
            </span>
          </div>
        </nav>

        {/* Feedback visual dinâmico de ações */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              actionFeedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : actionFeedback.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-blue-500/10 border-blue-500/30 text-blue-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : actionFeedback.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. CABEÇALHO PRINCIPAL DO PAINEL DE AUDITORIA                     */}
        {/* ================================================================= */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                <Terminal className="w-3.5 h-3.5" />
                Auditoria & Observabilidade de IA
              </span>
              <span className="text-xs text-zinc-500 font-mono">Fase 5 • DevSecOps Gamer</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1.5">
              Central de Logs & Auditoria de IA
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
              Rastreabilidade detalhada em tempo real para chamadas Gemini Flash, embeddings vetoriais pgvector,
              sincronização de RSS feeds e telemetria de disparos no X, Telegram e Discord.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Botão Atualizar */}
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Recarregar registros do banco"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>

            {/* Botão Expurgo de Logs */}
            <button
              onClick={() => setShowPurgeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Executar política de retenção (>30 dias)"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-rose-400" />
              Purgar Logs (&gt;30d)
            </button>

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </header>

        {/* ================================================================= */}
        {/* 3. CARDS DE KPIS NO TOPO                                          */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total de Falhas */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total de Falhas</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tight">
                {kpis.totalFailures.toLocaleString("pt-BR")}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  24h: {kpis.failures24h}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  7d: {kpis.failures7d}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 🚨 TAREFAS NÃO CONCLUÍDAS PELA IA (Card com Alarme Crítico) */}
          <div
            className={`p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all ${
              kpis.incompleteTasks > 0
                ? "bg-red-950/30 border-2 border-red-500/60 shadow-lg shadow-red-900/20"
                : "bg-zinc-900/60 border border-zinc-800"
            }`}
          >
            {kpis.incompleteTasks > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-xl pointer-events-none" />
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                🚨 Tarefas Incompletas
              </span>
              <ShieldAlert
                className={`w-4 h-4 ${
                  kpis.incompleteTasks > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"
                }`}
              />
            </div>
            <div>
              <div
                className={`text-3xl font-black tracking-tight ${
                  kpis.incompleteTasks > 0 ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {kpis.incompleteTasks}
              </div>
              <p className="text-[11px] mt-2 leading-tight">
                {kpis.incompleteTasks > 0 ? (
                  <span className="text-red-300 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                    Interrupções no fluxo de redação/IA
                  </span>
                ) : (
                  <span className="text-zinc-400">100% dos fluxos de IA concluídos</span>
                )}
              </p>
            </div>
          </div>

          {/* Card 3: Falhas de Redação & IA */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Falhas de IA</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tight">
                {(
                  kpis.failuresByAIModule.writer +
                  kpis.failuresByAIModule.embedding +
                  kpis.failuresByAIModule.hub
                ).toLocaleString("pt-BR")}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-zinc-400 font-mono">
                <span title="Falhas no Redator Gemini">W:{kpis.failuresByAIModule.writer}</span>
                <span>•</span>
                <span title="Falhas em Embeddings pgvector">E:{kpis.failuresByAIModule.embedding}</span>
                <span>•</span>
                <span title="Falhas em Hubs de Jogos">H:{kpis.failuresByAIModule.hub}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Falhas de Redes Sociais */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Falhas Redes</span>
              <Share2 className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tight">
                {(
                  kpis.failuresBySocialNetwork.x +
                  kpis.failuresBySocialNetwork.telegram +
                  kpis.failuresBySocialNetwork.discord +
                  kpis.failuresBySocialNetwork.instagram
                ).toLocaleString("pt-BR")}
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] text-zinc-400 font-mono">
                <span title="X / Twitter">X:{kpis.failuresBySocialNetwork.x}</span>
                <span>•</span>
                <span title="Telegram">TG:{kpis.failuresBySocialNetwork.telegram}</span>
                <span>•</span>
                <span title="Discord">DC:{kpis.failuresBySocialNetwork.discord}</span>
                <span>•</span>
                <span title="Instagram">IG:{kpis.failuresBySocialNetwork.instagram}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Taxa de Sucesso vs Falha do Pipeline */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Sucesso Pipeline</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400 tracking-tight">
                  {kpis.successRatePercentage}%
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  ({kpis.failureRatePercentage}% falhas)
                </span>
              </div>

              {/* Barra de progresso visual */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2.5 overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full"
                  style={{ width: `${kpis.successRatePercentage}%` }}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${kpis.failureRatePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. BARRA DE FILTROS E BUSCA INTERATIVA                            */}
        {/* ================================================================= */}
        <section className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          {/* Abas Rápidas */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
            <button
              onClick={() => handleTabChange("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              Todas as Falhas ({kpis.totalLogs})
            </button>

            <button
              onClick={() => handleTabChange("incomplete")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "incomplete"
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              ⚠️ Apenas Tarefas Incompletas ({kpis.incompleteTasks})
            </button>

            <button
              onClick={() => handleTabChange("ai")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ai"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-zinc-400 hover:text-purple-300 hover:bg-purple-500/10"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Falhas de IA
            </button>

            <button
              onClick={() => handleTabChange("social")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "social"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "text-zinc-400 hover:text-sky-300 hover:bg-sky-500/10"
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              Redes Sociais
            </button>

            <button
              onClick={() => handleTabChange("critical")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "critical"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Erros Críticos ({kpis.criticalErrors})
            </button>
          </div>

          {/* Linha de Busca e Seletores Dropdown */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Campo de Busca por Texto */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por mensagem de erro, ação, causa ou código..."
                className="w-full pl-9 pr-8 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-brand-purple rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    fetchLogs(1, { search: "" });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de Gravidade */}
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  fetchLogs(1, { level: e.target.value });
                }}
                className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:border-brand-purple outline-none cursor-pointer"
              >
                <option value="all">Todas Gravidades</option>
                <option value="critical">Crítico (Critical)</option>
                <option value="error">Erro (Error)</option>
                <option value="warn">Aviso (Warn)</option>
                <option value="info">Informativo (Info)</option>
              </select>

              {/* Seletor de Serviço / Módulo */}
              <select
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  fetchLogs(1, { service: e.target.value });
                }}
                className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:border-brand-purple outline-none cursor-pointer"
              >
                <option value="all">Todos os Serviços</option>
                <option value="ai_writer">ai_writer (Redator)</option>
                <option value="ai_embedding">ai_embedding (Vetores)</option>
                <option value="ai_hub">ai_hub (Hubs Games)</option>
                <option value="social_x">social_x (Twitter/X)</option>
                <option value="social_telegram">social_telegram (Canal)</option>
                <option value="social_discord">social_discord (Webhooks)</option>
                <option value="social_instagram">social_instagram (Feed)</option>
                <option value="rss_scraper">rss_scraper (Feeds)</option>
                <option value="game_enricher">game_enricher (Metadados)</option>
                <option value="affiliate_sync">affiliate_sync (Lojas)</option>
                <option value="newsletter">newsletter (Disparos)</option>
                <option value="database">database (Supabase)</option>
                <option value="system">system (Geral)</option>
              </select>

              {/* Seletor de Status */}
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  fetchLogs(1, { status: e.target.value });
                }}
                className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:border-brand-purple outline-none cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="failed">Falha (failed)</option>
                <option value="success">Sucesso (success)</option>
                <option value="skipped">Pulado (skipped)</option>
                <option value="aborted">Abortado (aborted)</option>
                <option value="retry_exhausted">Retries Esgotados</option>
              </select>

              {/* Botão Resetar Filtros */}
              {(search || service !== "all" || level !== "all" || status !== "all" || activeTab !== "all") && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  title="Limpar todos os filtros"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. LISTA / TABELA DE EVENTOS DE LOG                               */}
        {/* ================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              Exibindo{" "}
              <strong className="text-white font-mono">{logsResult.logs.length}</strong> de{" "}
              <strong className="text-white font-mono">{logsResult.total}</strong> ocorrências
            </span>
            <span className="font-mono">
              Página {logsResult.page} de {logsResult.totalPages}
            </span>
          </div>

          {logsResult.logs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white">Nenhum evento registrado</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Não foram encontrados logs que correspondam aos filtros ativos. Ajuste os termos de busca
                ou selecione outra aba de consulta.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
              >
                Resetar Filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Momento</th>
                    <th className="py-3 px-3">Gravidade</th>
                    <th className="py-3 px-3">Serviço / Ação</th>
                    <th className="py-3 px-4">Mensagem & Diagnóstico</th>
                    <th className="py-3 px-3">Retry / Resolução</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {logsResult.logs.map((log) => {
                    const isIncomplete = log.task_completed === false;
                    const isResolved = !!log.resolved_at;

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          isIncomplete ? "bg-red-950/10" : ""
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-zinc-300 text-[11px]">
                            {formatRelativeTime(log.created_at)}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                          </div>
                        </td>

                        {/* Severidade */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {getLevelBadge(log.level)}
                        </td>

                        {/* Serviço / Ação */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            {getServiceBadge(log.service)}
                            <span className="font-mono text-[10px] text-zinc-400">
                              {log.action}
                            </span>
                          </div>
                        </td>

                        {/* Mensagem e Detalhes */}
                        <td className="py-3.5 px-4 max-w-md">
                          <p className="text-zinc-200 line-clamp-2 leading-relaxed">
                            {log.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {/* Selo Explícito: Tarefa Não Concluída */}
                            {isIncomplete && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                                ⚠️ Tarefa Não Concluída
                              </span>
                            )}

                            {/* Código do Motivo de Falha */}
                            {log.failure_reason_code && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-amber-300 border border-zinc-700">
                                {log.failure_reason_code}
                              </span>
                            )}

                            {/* Contagem de Repetições */}
                            {log.repeat_count > 1 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                                x{log.repeat_count}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Retry / Resolução */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            {log.is_retryable ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                                <RotateCcw className="w-2.5 h-2.5" />
                                Retry Possível
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500">
                                Não repetível
                              </span>
                            )}

                            <div>
                              {isResolved ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  Resolvido
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  Pendente
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Inspecionar detalhes e stack trace"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Inspecionar</span>
                            </button>

                            {!isResolved && (
                              <button
                                onClick={() => handleResolveLog(log.id)}
                                className="p-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                                title="Marcar como resolvido"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {logsResult.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <span className="text-xs text-zinc-400 font-mono">
                Página {logsResult.page} de {logsResult.totalPages} (Total: {logsResult.total})
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(logsResult.page - 1)}
                  disabled={logsResult.page <= 1 || loading}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>

                <button
                  onClick={() => fetchLogs(logsResult.page + 1)}
                  disabled={logsResult.page >= logsResult.totalPages || loading}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* 6. MODAL / GAVETA DE INSPEÇÃO DE OCORRÊNCIA                        */}
        {/* ================================================================= */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col space-y-6 overflow-hidden relative">
              {/* Header do Modal */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getLevelBadge(selectedLog.level)}
                    {getServiceBadge(selectedLog.service)}
                    <span className="font-mono text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                      action: {selectedLog.action}
                    </span>
                    {selectedLog.task_completed === false && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                        ⚠️ Tarefa Não Concluída
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight pt-1">
                    Inspeção do Evento de Telemetria
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    ID: {selectedLog.id} • {formatFullDate(selectedLog.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo com Scroll */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                {/* Mensagem Principal */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Mensagem da Ocorrência
                  </div>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap font-sans">
                    {selectedLog.message}
                  </p>
                </div>

                {/* Motivo de Falha Identificado */}
                {selectedLog.failure_reason_code && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Código de Causa Padronizado (Failure Reason Code)
                      </div>
                      <div className="font-mono text-sm text-amber-200 mt-0.5">
                        {selectedLog.failure_reason_code}
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedLog.is_retryable ? "Passível de Retry" : "Falha Não Repetível"}
                    </span>
                  </div>
                )}

                {/* Stack Trace / Detalhes de Erro (Renderizado de forma segura via pre/code sem dangerouslySetInnerHTML) */}
                {selectedLog.error_details && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Stack Trace & Detalhes de Exceção
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedLog.error_details!, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                      >
                        {copiedTrace ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-400" />
                            Copiar Stack Trace
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-2xl bg-black/80 border border-rose-500/30 text-rose-300 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed select-text">
                      <code>{selectedLog.error_details}</code>
                    </pre>
                  </div>
                )}

                {/* Metadados JSON Formatados (Renderizado com segurança via pre/code) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Metadados JSON Formatados
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.metadata || {}, null, 2), false)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    >
                      {copiedMeta ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          Copiar JSON
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 text-cyan-300 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed select-text">
                    <code>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</code>
                  </pre>
                </div>

                {/* Status de Resolução */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Status de Auditoria
                    </div>
                    <div className="text-xs text-zinc-300 mt-0.5">
                      {selectedLog.resolved_at ? (
                        <span className="text-emerald-400 font-medium">
                          Resolvido por{" "}
                          <strong className="text-white font-mono">{selectedLog.resolved_by}</strong> em{" "}
                          {formatFullDate(selectedLog.resolved_at)}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium">
                          Ocorrência pendente de revisão técnica
                        </span>
                      )}
                    </div>
                  </div>

                  {!selectedLog.resolved_at && (
                    <button
                      onClick={() => handleResolveLog(selectedLog.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Marcar como Resolvido
                    </button>
                  )}
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="flex justify-end pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 7. MODAL DE CONFIRMAÇÃO DE EXPURGO DE LOGS ANTIGOS (> 30 DIAS)     */}
        {/* ================================================================= */}
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-zinc-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Expurgar Logs Antigos
                  </h3>
                  <span className="text-xs text-rose-400 font-mono">
                    Política de Retenção: &gt; 30 dias
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Esta ação executará a rotina de segurança no banco de dados e excluirá permanentemente todos os registros de telemetria criados há mais de <strong>30 dias</strong>.
              </p>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Esta operação é irreversível e preservará todos os registros recentes.</span>
              </div>

              {purgeSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  {purgeSuccessMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPurgeModal(false);
                    setPurgeSuccessMessage(null);
                  }}
                  disabled={purging}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  onClick={handlePurgeLogs}
                  disabled={purging}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {purging ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Expurgando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Confirmar Expurgo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLogsView;
export { AdminLogsView as AdminView };
