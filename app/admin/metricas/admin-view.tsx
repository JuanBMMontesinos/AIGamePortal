"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  DollarSign,
  MousePointerClick,
  Sparkles,
  RefreshCw,
  LogOut,
  FileText,
  Copy,
  Check,
  Printer,
  Download,
  ExternalLink,
  Gamepad2,
  Cpu,
  Mail,
  MessageSquare,
  Flame,
  Award,
  Calendar,
  Layers,
  CheckCircle2,
  X,
} from "lucide-react";
import { B2BMetricsSummary } from "@/lib/data/metrics-summary";

export interface AdminMetricsViewProps {
  initialSummary: B2BMetricsSummary;
}

export function AdminMetricsView({ initialSummary }: AdminMetricsViewProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<B2BMetricsSummary>(initialSummary);
  const [loading, setLoading] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/metrics/summary?refresh=true");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSummary(json.data);
          notify("Métricas e telemetria atualizadas com sucesso!");
        }
      } else {
        notify("Falha ao atualizar dados de telemetria.");
      }
    } catch {
      notify("Erro de rede ao conectar à API de telemetria.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.refresh();
  };

  const handleCopyPitch = () => {
    const pitchText = `================================================================
MEDIA KIT B2B & PITCH DECK COMERCIAL — MADE BY AI GAMES
Portal de Notícias Gamer Impulsionado por IA de Nova Geração
Relatório Gerado em: ${new Date(summary.generatedAt).toLocaleDateString("pt-BR")}
================================================================

1. AUDIÊNCIA & ALCANCE DA PLATAFORMA
----------------------------------------------------------------
- Visualizações Mensais Projetadas: ${summary.audience.monthlyProjectedPageviews.toLocaleString("pt-BR")} views
- Total de Matérias Publicadas: ${summary.posts.totalPublished} notícias especializadas
- Visualizações Acumuladas no Portal: ${summary.posts.totalViews.toLocaleString("pt-BR")} visualizações
- Tempo Médio por Sessão: ~${Math.round(summary.audience.avgTimeOnPageSeconds / 60)} minutos e ${summary.audience.avgTimeOnPageSeconds % 60}s
- Infraestrutura: 100% Edge Caching Cloudflare (99.99% disponibilidade)

2. COBERTURA EDITORIAL POR PLATAFORMA
----------------------------------------------------------------
${summary.posts.platformDistribution.map((p) => `- ${p.platform}: ${p.count} matérias (${p.percentage}%)`).join("\n")}

3. ENGAJAMENTO COMERCIAL & AFILIADOS
----------------------------------------------------------------
- Cliques Totais em Links de Produtos Gamer: ${summary.affiliates.totalClicks.toLocaleString("pt-BR")} cliques
- Taxa de Conversão Estimada (Benchmark): ${summary.affiliates.estimatedConversionRate}%
- Volume Bruto de Mercadorias (GMV Estimado): R$ ${summary.affiliates.estimatedGmvBrl.toLocaleString("pt-BR")},00
- Categorias Líderes: Consoles, Hardware para PC, Acessórios e Periféricos

4. COMUNIDADE & CANAIS DIRETOS
----------------------------------------------------------------
- Base Ativa na Newsletter Semanal: ${summary.audience.newsletterSubscribersActive} inscritos qualificados
- Taxa de Abertura da Newsletter: ${summary.audience.newsletterOpenRatePercent}% (Benchmark de mercado: 22%)
- Taxa de Cliques (CTR Newsletter): ${summary.audience.newsletterClickRatePercent}%
- Comunidade no Discord: ~${summary.audience.discordMembers} gamers ativos

5. OPORTUNIDADES & PACOTES DE PATROCÍNIO (PÁGINA 5 DO PLANO)
----------------------------------------------------------------
A) FABRICANTES DE PERIFÉRICOS & HARDWARE
   - Formato: Hero Takeover 970x250 + Selo 'Setup Recomendado' nos artigos de PC
   - Entrega: 85.000 a 120.000 impressões/mês de alta intenção de compra
   - Valor Sugerido: R$ 3.500 / mês

B) ESTÚDIOS INDIE & LANÇAMENTOS DE GAMES
   - Formato: Central Gamer Permanente (/jogos) + Matéria com Selo Editorial IA + Disparo na Newsletter
   - Entrega: 25.000 a 45.000 gamers engajados
   - Valor Sugerido: R$ 1.800 / lançamento

C) SERVIDORES DE JOGOS & HOSPEDAGEM
   - Formato: Canal dedicado no Discord + Banner Fixo na Sidebar de notícias multiplayer
   - Entrega: 40.000 a 70.000 visualizações de jogadores de PC
   - Valor Sugerido: R$ 2.200 / mês

Contato Comercial: comercial@madebyaigames.com
Painel de Telemetria: https://aigameportal.com/admin/metricas
================================================================`;

    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `made-by-ai-games-b2b-metrics-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans print:bg-white print:text-zinc-900 print:p-2">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Barra de Navegação Administrativa Unificada */}
        <nav className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-md print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/metricas"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-purple text-white shadow-md shadow-brand-purple/30"
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
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
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Edge Cache 1800s Ativo
            </span>
          </div>
        </nav>

        {/* Cabeçalho Principal do Painel */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Área Executiva B2B
              </span>
              <span className="text-xs text-zinc-500 font-mono">Fase 4 • MediaTech</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1.5">
              Dashboard de Métricas & Patrocínio
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Dados consolidados de audiência, retenção, eficiência de IA e intenção de compra para atração de marcas
              de periféricos, estúdios indie e servidores de jogos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors"
              title="Atualizar dados de telemetria"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>

            <button
              onClick={() => setShowPitchModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-purple via-indigo-600 to-brand-cyan text-white shadow-lg shadow-brand-purple/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              Exportar Pitch Deck B2B
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </header>

        {/* Notificação Temporária de Ação */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-brand-purple/20 border border-brand-purple/40 text-brand-cyan text-xs font-semibold flex items-center gap-2 animate-fadeIn print:hidden">
            <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
            {actionMessage}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CARDS HERO DE KPIs DE PATROCÍNIO (PÁGINA 5 DO PLANO) */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Audiência e Views */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 relative overflow-hidden group hover:border-brand-purple/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/10 rounded-full blur-xl group-hover:bg-brand-purple/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Alcance Mensal Projetado</span>
              <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.audience.monthlyProjectedPageviews.toLocaleString("pt-BR")}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Zero Custo
              </span>
              em servidor via Cloudflare Edge
            </p>
          </div>

          {/* Card 2: CAC de Conteúdo e Eficiência */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">CAC por Artigo Gerado</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight flex items-baseline gap-1">
              R$ {summary.cac.costPerArticleBrl.toFixed(4)}
              <span className="text-xs font-medium text-zinc-500 font-sans">/ notícia</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">99.99% economia</span> vs redator freelancer (R$ 45,00)
            </p>
          </div>

          {/* Card 3: Intenção de Compra e Cliques */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 relative overflow-hidden group hover:border-brand-cyan/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/10 rounded-full blur-xl group-hover:bg-brand-cyan/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Cliques Comerciais</span>
              <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.affiliates.totalClicks.toLocaleString("pt-BR")}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-brand-cyan font-bold">{summary.affiliates.estimatedConversionRate}% conv.</span> ~R$ {summary.affiliates.estimatedGmvBrl.toLocaleString("pt-BR")} GMV
            </p>
          </div>

          {/* Card 4: Newsletter & Comunidade */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Assinantes Newsletter</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.audience.newsletterSubscribersActive}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-indigo-400 font-bold">{summary.audience.newsletterOpenRatePercent}% abertura</span> taxa líder no setor gamer
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 1: VOLUME EDITORIAL & DISTRIBUIÇÃO POR PLATAFORMA */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Cards de Volume de Notícias */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
                Frequência de Publicação
              </span>
              <h2 className="text-lg font-bold text-white mt-1">Volume de Matérias</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Produção automatizada 24/7 com curadoria de fontes oficiais.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Total Publicado</div>
                    <div className="text-[11px] text-zinc-500">Histórico de matérias</div>
                  </div>
                </div>
                <div className="text-lg font-black text-white">{summary.posts.totalPublished}</div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Últimas 24 Horas</div>
                    <div className="text-[11px] text-zinc-500">Frequência diária ativa</div>
                  </div>
                </div>
                <div className="text-lg font-black text-emerald-400">+{summary.posts.last24h}</div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Últimos 7 Dias</div>
                    <div className="text-[11px] text-zinc-500">Volume semanal contínuo</div>
                  </div>
                </div>
                <div className="text-lg font-black text-white">+{summary.posts.last7d}</div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Média de Views / Artigo</div>
                    <div className="text-[11px] text-zinc-500">Engajamento por pauta</div>
                  </div>
                </div>
                <div className="text-lg font-black text-amber-400">
                  {summary.posts.avgViewsPerPost} <span className="text-xs text-zinc-500">views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Gráfico de Distribuição por Plataforma */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand-cyan">
                    Demografia de Interesse
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">Distribuição de Cobertura por Plataforma</h2>
                </div>
                <span className="text-xs text-zinc-500 font-mono">100% dos artigos catalogados</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Proporção editorial balanceada para garantir visibilidade segmentada a patrocinadores de consoles, PC
                e periféricos.
              </p>
            </div>

            {/* Barra de Distribuição Segmentada Contínua */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-zinc-800 shadow-inner">
                {summary.posts.platformDistribution.map((item) => (
                  <div
                    key={item.platform}
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full bg-gradient-to-r ${item.color} transition-all duration-500 hover:brightness-125`}
                    title={`${item.platform}: ${item.percentage}% (${item.count} matérias)`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>PlayStation</span>
                <span>Xbox</span>
                <span>PC Gaming</span>
                <span>Nintendo</span>
                <span>Hardware</span>
              </div>
            </div>

            {/* Grid dos Cards de Plataforma com Barras Individuais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {summary.posts.platformDistribution.map((p) => (
                <div
                  key={p.platform}
                  className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${p.badgeBg}`}>
                      {p.platform}
                    </span>
                    <span className="text-sm font-black text-white">{p.percentage}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${p.color} rounded-full`}
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{p.count} matérias publicadas</span>
                    <span className="text-zinc-500">~{Math.round(p.count * summary.posts.avgViewsPerPost)} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 2: CAC DE CONTEÚDO (IA GEMINI VS JORNALISMO TRADICIONAL) */}
        {/* ========================================================================= */}
        <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Eficiência Operacional & Vantagem Competitiva
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                CAC de Conteúdo: Inteligência Artificial vs Redação Humana
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-3xl">
                O custo marginal de geração de artigos aproxima-se de zero, viabilizando margens operacionais superiores
                a 99% e garantindo que cada Real investido pelo patrocinador seja revertido em alcance e tecnologia.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Economia Total Acumulada</span>
              <span className="text-xl font-black text-emerald-400">
                R$ {summary.cac.totalSavingsBrl.toLocaleString("pt-BR")},00
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco 1: Pipeline Made By AI Games (Gemini Flash) */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-brand-purple/10 to-transparent border border-brand-purple/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-brand-purple text-white">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-black text-white text-sm">Pipeline Made By AI Games (Gemini 2.0 Flash)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                  Operação Atual
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Custo por Matéria:</span>
                  <span className="font-black text-emerald-400 text-sm">R$ {summary.cac.costPerArticleBrl.toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Tempo Médio de Geração:</span>
                  <span className="font-bold text-white">~{summary.cac.generationTimeSeconds} segundos</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Consumo de Tokens API:</span>
                  <span className="font-bold text-zinc-300">~2.700 tokens (Gemini 2.0 Flash)</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-zinc-400">Margem Operacional de Mídia:</span>
                  <span className="font-black text-brand-cyan">99.9%</span>
                </div>
              </div>
            </div>

            {/* Bloco 2: Mídia Tradicional (Redator Humano Freelancer) */}
            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-black text-zinc-300 text-sm">Mídia Tradicional (Redator Freelancer)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400">
                  Benchmark de Mercado
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Custo por Matéria:</span>
                  <span className="font-bold text-red-400 text-sm">R$ {summary.cac.traditionalCostBrl.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Tempo Médio de Produção:</span>
                  <span className="font-bold text-zinc-300">~90 minutos</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Horas Economizadas pela IA:</span>
                  <span className="font-bold text-emerald-400">+{summary.cac.hoursSavedTotal} horas de trabalho</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-zinc-400">Escalabilidade Editorial:</span>
                  <span className="font-bold text-amber-400">Limitada por custo e equipe</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 3: MONETIZAÇÃO DE AFILIADOS & INTENÇÃO DE COMPRA */}
        {/* ========================================================================= */}
        <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-cyan">
              Comércio Eletrônico & Auditoria de Conversão
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
              Desempenho Comercial de Afiliados (B2B E-commerce)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Rastreamento de intenção de compra contextual nos artigos e guias de compra gamer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-medium uppercase">Cliques Registrados</span>
              <div className="text-2xl font-black text-white mt-1">
                {summary.affiliates.totalClicks.toLocaleString("pt-BR")}
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                +{summary.affiliates.clicksLast7d} nos últimos 7 dias
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-medium uppercase">Taxa de Conversão Estimada</span>
              <div className="text-2xl font-black text-brand-cyan mt-1">
                {summary.affiliates.estimatedConversionRate}%
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                ~{summary.affiliates.estimatedConversions} compras concretizadas
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-medium uppercase">Volume Bruto (GMV Gerado)</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                R$ {summary.affiliates.estimatedGmvBrl.toLocaleString("pt-BR")}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Ticket médio de R$ {summary.affiliates.avgTicketBrl}</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-medium uppercase">Comissão Estimada Portal</span>
              <div className="text-2xl font-black text-brand-purple mt-1">
                R$ {summary.affiliates.estimatedCommissionBrl.toLocaleString("pt-BR")}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Média de 7.5% de repasse</span>
            </div>
          </div>

          {/* Breakdown por Categoria de Produto */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Engajamento por Categoria de Oferta
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {summary.affiliates.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                  <div className="text-xs font-bold text-white">{cat.category}</div>
                  <div className="text-base font-black text-brand-cyan mt-1">{cat.clicks} cliques</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{cat.count} produtos ativos</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 4: CANAIS DIRETOS & COMUNIDADE GAMER */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Newsletter Box */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                Canal Proprietário
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Newsletter Semanal</h3>
            <div className="text-2xl font-black text-white">
              {summary.audience.newsletterSubscribersActive} assinantes
            </div>
            <p className="text-xs text-zinc-400">
              Audiência hiper-fiel com taxa de abertura de{" "}
              <strong className="text-indigo-400">{summary.audience.newsletterOpenRatePercent}%</strong> e CTR de{" "}
              <strong className="text-indigo-400">{summary.audience.newsletterClickRatePercent}%</strong>.
            </p>
          </div>

          {/* Discord Box */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                Comunidade Gamer
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Servidor no Discord</h3>
            <div className="text-2xl font-black text-white">
              ~{summary.audience.discordMembers.toLocaleString("pt-BR")} membros
            </div>
            <p className="text-xs text-zinc-400">
              Canal de avisos automatizados de jogos grátis da Epic Games e Steam com{" "}
              <strong className="text-purple-400">{summary.audience.discordDealsPosted} ofertas</strong> publicadas.
            </p>
          </div>

          {/* Twitter / Redes Sociais */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                Redes Sociais
              </span>
            </div>
            <h3 className="text-base font-bold text-white">X / Twitter & Web</h3>
            <div className="text-2xl font-black text-white">
              ~{summary.audience.twitterFollowersEstimated.toLocaleString("pt-BR")} seguidores
            </div>
            <p className="text-xs text-zinc-400">
              Robô publicador automático com distribuição instantânea de breaking news e matérias exclusivas.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 5: PACOTES DE PATROCÍNIO COMERCIAL (PÁGINA 5 DO PLANO) */}
        {/* ========================================================================= */}
        <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
              Monetização B2B Direta (Página 5 do Plano de Negócios)
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
              Pacotes Comerciais para Marcas & Patrocinadores
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Propostas desenhadas especificamente para fabricantes de periféricos, estúdios indie e servidores gamer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summary.sponsorshipPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between space-y-5 hover:border-brand-purple/50 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                      {pkg.targetAudience}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Disponível
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-cyan transition-colors">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-zinc-400">{pkg.format}</p>

                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-zinc-300 block">Entregáveis Incluídos:</span>
                    <ul className="space-y-1.5 text-xs text-zinc-400">
                      {pkg.deliverables.map((d, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Investimento Sugerido</span>
                    <span className="text-base font-black text-white">{pkg.recommendedMonthlyBrl}</span>
                  </div>
                  <button
                    onClick={() => setShowPitchModal(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  >
                    Ver Pitch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rodapé Administrativo */}
        <footer className="pt-6 border-t border-zinc-800 text-center text-xs text-zinc-500 space-y-1 print:hidden">
          <p>Made By AI Games • Módulo Executivo B2B & Infraestrutura Edge Caching</p>
          <p className="text-[11px]">
            Telemetria consolidada às {new Date(summary.generatedAt).toLocaleTimeString("pt-BR")} • Próxima atualização
            em {new Date(summary.cachedUntil).toLocaleTimeString("pt-BR")}
          </p>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* MODAL / PITCH DECK DE MÍDIA PARA EXPORTAÇÃO */}
      {/* ========================================================================= */}
      {showPitchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:relative print:p-0 print:bg-white">
          <div className="bg-zinc-900 border border-brand-purple/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 print:border-none print:shadow-none print:p-0 print:my-0">
            {/* Botão Fechar */}
            <button
              onClick={() => setShowPitchModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                <Sparkles className="w-3.5 h-3.5" />
                Resumo Comercial Executivo
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pitch Deck de Mídia para Patrocinadores
              </h2>
              <p className="text-xs text-zinc-400">
                Relatório pronto e formatado para envio em propostas comerciais e captação de marcas B2B.
              </p>
            </div>

            {/* Conteúdo Formatado do Pitch */}
            <div className="p-4 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-4 max-h-[50vh] overflow-y-auto select-all print:max-h-none print:bg-white print:text-zinc-900 print:border-zinc-300">
              <div className="text-brand-cyan font-bold"># RELATÓRIO EXECUTIVO DE MÍDIA — MADE BY AI GAMES (FASE 4)</div>
              <div>
                <strong>Audiência Mensal:</strong> {summary.audience.monthlyProjectedPageviews.toLocaleString("pt-BR")}{" "}
                visualizações projetadas com sustentação Cloudflare Edge
              </div>
              <div>
                <strong>Cobertura Editorial:</strong> {summary.posts.totalPublished} matérias especializadas publicadas
                (PlayStation {summary.posts.platformDistribution[0]?.percentage}%, Xbox{" "}
                {summary.posts.platformDistribution[1]?.percentage}%, PC{" "}
                {summary.posts.platformDistribution[2]?.percentage}%, Nintendo{" "}
                {summary.posts.platformDistribution[3]?.percentage}%)
              </div>
              <div>
                <strong>Intenção Comercial:</strong> {summary.affiliates.totalClicks.toLocaleString("pt-BR")} cliques em
                produtos gamer com {summary.affiliates.estimatedConversionRate}% de conversão estimada e R${" "}
                {summary.affiliates.estimatedGmvBrl.toLocaleString("pt-BR")} em GMV gerado.
              </div>
              <div>
                <strong>Newsletter & Retenção:</strong> {summary.audience.newsletterSubscribersActive} inscritos ativos
                com {summary.audience.newsletterOpenRatePercent}% de taxa de abertura e Discord com{" "}
                {summary.audience.discordMembers} membros.
              </div>
              <div>
                <strong>Proposta de Valor Tecnológica:</strong> Produção ultra-ágil com IA Google Gemini (CAC R${" "}
                {summary.cac.costPerArticleBrl.toFixed(4)}/notícia), gerando margem comercial de 99.9% para reinvestimento
                em mídia e alcance para os patrocinadores.
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPitch}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-brand-purple hover:bg-brand-purple/90 text-white transition-all shadow-md shadow-brand-purple/20"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado para a Área de Transferência!" : "Copiar Texto Formatado"}
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  title="Baixar JSON de telemetria"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>

                <button
                  onClick={() => setShowPitchModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-950 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMetricsView;
