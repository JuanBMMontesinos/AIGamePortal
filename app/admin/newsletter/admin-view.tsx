"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Search,
  Send,
  Trash2,
  Power,
  Server,
  Users,
  UserCheck,
  UserX,
  Calendar,
  ExternalLink,
  ShoppingBag,
  Sliders,
  Check,
  BarChart3,
  DollarSign,
  MessageSquare,
  Share2,
  Terminal,
} from "lucide-react";
import { NewsletterSettings, NewsletterSubscriber } from "@/types/database";
import { NewsletterAdminKPIs } from "@/lib/data/newsletter-admin";

interface AdminNewsletterViewProps {
  initialSettings: NewsletterSettings;
  initialKpis: NewsletterAdminKPIs;
  initialSubscribers: NewsletterSubscriber[];
}

export function AdminNewsletterView({
  initialSettings,
  initialKpis,
  initialSubscribers,
}: AdminNewsletterViewProps) {
  const router = useRouter();

  const [settings, setSettings] = useState<NewsletterSettings>(initialSettings);
  const [kpis, setKpis] = useState<NewsletterAdminKPIs>(initialKpis);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(initialSubscribers);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modais e formulários
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [toggleReason, setToggleReason] = useState(
    settings.disabled_reason || "Aguardando configuração e homologação do serviço Resend"
  );
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Teste de disparo
  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const notify = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Recarrega todos os dados da API
  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setKpis(data.kpis);
        setSubscribers(data.subscribers || []);
        notify("Dados atualizados com sucesso!");
      }
    } catch {
      notify("Falha ao recarregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.refresh();
  };

  // Alterna Habilitação / Desabilitação Geral do Envio
  const handleToggleGlobalNewsletter = async () => {
    const nextStatus = !settings.is_enabled;
    setTogglingStatus(true);

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: nextStatus,
          disabled_reason: nextStatus ? null : toggleReason,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSettings(data.settings);
        setKpis((prev) => ({
          ...prev,
          isEnabled: nextStatus,
          disabledReason: nextStatus ? null : toggleReason,
        }));
        setShowToggleModal(false);
        notify(
          nextStatus
            ? "✅ Disparo semanal HABILITADO com sucesso!"
            : "🛑 Disparo semanal DESABILITADO. Nenhum e-mail será enviado."
        );
      } else {
        notify(data.error || "Erro ao atualizar status de envio.");
      }
    } catch {
      notify("Falha de rede ao atualizar status.");
    } finally {
      setTogglingStatus(false);
    }
  };

  // Alterna status de um assinante individual
  const handleToggleSubscriber = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setSubscribers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: nextStatus } : s))
    );

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_subscriber",
          id,
          is_active: nextStatus,
        }),
      });

      if (!res.ok) {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, is_active: currentStatus } : s))
        );
        notify("Falha ao alterar status do assinante.");
      } else {
        notify(`Assinante ${nextStatus ? "ativado" : "desativado"}.`);
        refreshData();
      }
    } catch {
      notify("Erro de conexão ao alterar assinante.");
    }
  };

  // Exclui assinante permanentemente
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Tem certeza de que deseja excluir o assinante "${email}"?`)) return;

    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        notify(`Assinante "${email}" excluído.`);
        refreshData();
      } else {
        notify("Falha ao excluir assinante.");
      }
    } catch {
      notify("Erro de rede ao excluir.");
    }
  };

  // Envia disparo de teste para o e-mail digitado
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult(data.message);
        notify(data.message);
      } else {
        setTestResult(`Erro: ${data.error || "Falha no envio de teste."}`);
      }
    } catch {
      setTestResult("Erro de conexão com o servidor.");
    } finally {
      setTestLoading(false);
    }
  };

  // Filtragem de assinantes
  const filteredSubscribers = subscribers.filter((s) => {
    const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.is_active) ||
      (statusFilter === "inactive" && !s.is_active);
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Barra de Navegação Administrativa Unificada */}
        <nav className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/metricas"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Métricas B2B & Patrocínio
            </Link>

            <Link
              href="/admin/afiliados"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Afiliados & Lojas
            </Link>

            <Link
              href="/admin/newsletter"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-purple text-white shadow-md shadow-brand-purple/30"
            >
              <Mail className="w-4 h-4" />
              Newsletter
            </Link>

            <Link
              href="/admin/discord"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Discord & Alertas
            </Link>

            <Link
              href="/admin/redes"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              Redes Sociais
            </Link>

            <Link
              href="/admin/logs"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              Logs & IA
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Edge Cache 1800s Ativo
            </span>
          </div>
        </nav>

        {/* 1. Header do Painel */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Área Restrita do Administrador
              </span>
              <span className="text-xs text-zinc-500 font-mono">Módulo Newsletter v1.0</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1.5 flex items-center gap-3">
              Gestão de Newsletter Gamer
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Controle de ativação e salvaguarda de envio, diagnóstico do Resend e base de assinantes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Navegação entre painéis */}
            <Link
              href="/admin/afiliados"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors"
              title="Abrir painel de Afiliados"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-cyan" />
              Painel de Afiliados
            </Link>

            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </header>

        {/* Notificação Temporária de Ação */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-brand-purple/20 border border-brand-purple/40 text-brand-cyan text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
            {actionMessage}
          </div>
        )}

        {/* 2. BANNER MESTRE: CONTROLE DE HABILITAÇÃO / DESABILITAÇÃO */}
        <section
          className={`p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden ${
            settings.is_enabled
              ? "bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
              : "bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-950/20"
          }`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    settings.is_enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse"
                  }`}
                >
                  {settings.is_enabled ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Status: Envio Semanal Habilitado
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Status: Envio Semanal Desabilitado (Pausado)
                    </>
                  )}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                {settings.is_enabled
                  ? "Envios Automáticos Ativos no GitHub Actions"
                  : "Disparos Automáticos Bloqueados por Segurança"}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {settings.is_enabled
                  ? "O agendamento de domingo às 10:00 BRT compilará os 5 artigos mais populares e enviará a edição oficial aos assinantes."
                  : "O cron semanal abortará com status seguro (skipped) sem disparar nenhum e-mail enquanto esta opção estiver desabilitada."}
              </p>

              {!settings.is_enabled && settings.disabled_reason && (
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400">
                  <span className="font-bold text-amber-400">Motivo da pausa:</span>{" "}
                  {settings.disabled_reason}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <button
                onClick={() => setShowToggleModal(true)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-xl cursor-pointer ${
                  settings.is_enabled
                    ? "bg-red-600 hover:bg-red-500 shadow-red-900/30"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30 hover:scale-105"
                }`}
              >
                <Power className="w-4 h-4" />
                {settings.is_enabled ? "Pausar / Desabilitar Envio" : "Habilitar Envio da Newsletter"}
              </button>
            </div>
          </div>
        </section>

        {/* 3. Cards de Diagnóstico e Métricas */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Diagnóstico Resend */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
              <span>Provedor de E-mail</span>
              <Server className="w-4 h-4 text-brand-purple" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    kpis.isResendConfigured ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                  }`}
                />
                <span className="font-black text-white text-base">
                  {kpis.isResendConfigured ? "Resend Conectado" : "Resend Pendente"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 truncate">
                De: {kpis.resendFromEmail}
              </p>
            </div>
            <div className="pt-1 text-[11px] text-zinc-500">
              Chave: {kpis.resendApiKeyMasked || "Não configurada em .env"}
            </div>
          </div>

          {/* Card 2: Assinantes Ativos */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
              <span>Assinantes Ativos</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {kpis.activeSubscribers.toLocaleString("pt-BR")}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Receberão a próxima edição
              </p>
            </div>
            <div className="pt-1 text-[11px] text-emerald-400 font-semibold">
              Taxa de retenção: {(100 - kpis.churnRate).toFixed(1)}%
            </div>
          </div>

          {/* Card 3: Assinantes Cancelados */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
              <span>Descadastrados (Opt-Out)</span>
              <UserX className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <div className="text-3xl font-black text-zinc-400">
                {kpis.inactiveSubscribers.toLocaleString("pt-BR")}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Cancelaram via link no rodapé
              </p>
            </div>
            <div className="pt-1 text-[11px] text-zinc-500">
              Taxa de churn: {kpis.churnRate}%
            </div>
          </div>

          {/* Card 4: Histórico do Último Disparo */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
              <span>Último Disparo</span>
              <Calendar className="w-4 h-4 text-brand-cyan" />
            </div>
            <div>
              <div className="font-black text-white text-base capitalize">
                {kpis.lastDispatchStatus === "success"
                  ? "Sucesso"
                  : kpis.lastDispatchStatus === "skipped"
                  ? "Pausado (Skipped)"
                  : kpis.lastDispatchStatus === "failed"
                  ? "Falha"
                  : "Nenhum ainda"}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {kpis.lastDispatchedAt
                  ? new Date(kpis.lastDispatchedAt).toLocaleString("pt-BR")
                  : "Aguardando primeiro envio"}
              </p>
            </div>
            <div className="pt-1 text-[11px] text-zinc-500">
              Cron: Todo domingo às 10h BRT
            </div>
          </div>
        </section>

        {/* 4. SANDBOX DE TESTE & DIAGNÓSTICO */}
        <section className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-cyan" />
                Sandbox de Disparo de Teste
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Valide o template HTML e o funcionamento do remetente enviando um teste pontual para qualquer e-mail sem ativar os envios gerais.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="email"
                required
                placeholder="Digite um e-mail para receber o teste (ex: seu-email@gmail.com)..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-purple transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={testLoading || !testEmail}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-brand-purple hover:bg-brand-purple/90 text-white transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-neon-purple"
            >
              {testLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando Teste...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Disparar Teste</span>
                </>
              )}
            </button>
          </form>

          {testResult && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-brand-cyan">
              {testResult}
            </div>
          )}
        </section>

        {/* 5. GESTÃO DE ASSINANTES */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-purple" />
                Base de Assinantes ({filteredSubscribers.length})
              </h3>
              <p className="text-xs text-zinc-400">
                Lista de todos os usuários capturados pelo formulário do portal.
              </p>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-purple transition-colors w-48 sm:w-64"
                />
              </div>

              <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1">
                {(["all", "active", "inactive"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      statusFilter === filter
                        ? "bg-brand-purple text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {filter === "all" ? "Todos" : filter === "active" ? "Ativos" : "Inativos"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela de Assinantes */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">E-mail do Assinante</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Inscrito em</th>
                    <th className="py-3.5 px-4">Descadastrado em</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map((subscriber) => (
                      <tr
                        key={subscriber.id}
                        className="hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-white">
                          {subscriber.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              subscriber.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {subscriber.is_active ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Descadastrado
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">
                          {new Date(subscriber.subscribed_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500">
                          {subscriber.unsubscribed_at
                            ? new Date(subscriber.unsubscribed_at).toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              handleToggleSubscriber(subscriber.id, subscriber.is_active)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                              subscriber.is_active
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                          >
                            {subscriber.is_active ? "Desativar" : "Reativar"}
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteSubscriber(subscriber.id, subscriber.email)
                            }
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remover assinante"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                        Nenhum assinante encontrado para o filtro aplicado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL DE CONFIRMAÇÃO PARA HABILITAR / DESABILITAR ENVIO */}
      {showToggleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  settings.is_enabled ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {settings.is_enabled ? "Pausar Disparos Semanais?" : "Habilitar Disparos Semanais?"}
                </h3>
                <p className="text-xs text-zinc-400">
                  {settings.is_enabled
                    ? "O pipeline de domingo ignorará os envios com segurança."
                    : "Os e-mails serão disparados para toda a base ativa todo domingo às 10h BRT."}
                </p>
              </div>
            </div>

            {settings.is_enabled && (
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Motivo da pausa (visível no painel e nos logs):
                </label>
                <input
                  type="text"
                  value={toggleReason}
                  onChange={(e) => setToggleReason(e.target.value)}
                  placeholder="Ex: Aguardando homologação do domínio no Resend..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-purple"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowToggleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={togglingStatus}
                onClick={handleToggleGlobalNewsletter}
                className={`px-5 py-2 rounded-xl text-xs font-black text-white transition-all cursor-pointer ${
                  settings.is_enabled
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {togglingStatus
                  ? "Salvando..."
                  : settings.is_enabled
                  ? "Confirmar Pausa"
                  : "Confirmar Ativação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
