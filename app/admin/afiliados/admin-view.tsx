"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  DollarSign,
  MousePointerClick,
  Layers,
  BarChart3,
  Mail,
  MessageSquare,
  Share2,
  Terminal,
} from "lucide-react";
import { AffiliateAdminItem, AffiliateKPIs } from "@/lib/data/affiliates";


interface AdminViewProps {
  initialProducts: AffiliateAdminItem[];
  initialKpis: AffiliateKPIs;
}

export function AdminAffiliatesView({
  initialProducts,
  initialKpis,
}: AdminViewProps) {
  const router = useRouter();
  const [products, setProducts] = useState<AffiliateAdminItem[]>(initialProducts);
  const [kpis, setKpis] = useState<AffiliateKPIs>(initialKpis);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form de novo produto
  const [newTitle, setNewTitle] = useState("");
  const [newStore, setNewStore] = useState("Amazon Brasil");
  const [newCategory, setNewCategory] = useState("Jogo");
  const [newUrl, setNewUrl] = useState(
    "https://www.amazon.com.br/s?k=&tag=aigameportal-20"
  );
  const [newKeywords, setNewKeywords] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImage, setNewImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Mensagem temporária de feedback
  const notify = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Recarregar dados
  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setKpis(data.kpis || initialKpis);
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

  // Toggle de status is_active
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // Atualização otimista
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: nextStatus } : p))
    );

    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: nextStatus }),
      });

      if (!res.ok) {
        // Reverte se falhou
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: currentStatus } : p))
        );
        notify("Erro ao alterar status do produto.");
      } else {
        notify(
          `Produto ${nextStatus ? "ativado" : "pausado"} com sucesso!`
        );
      }
    } catch {
      notify("Falha de rede ao alterar status.");
    }
  };

  // Exclusão de produto
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o produto "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/affiliates?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        notify(`Produto "${title}" excluído.`);
      } else {
        notify("Erro ao excluir produto.");
      }
    } catch {
      notify("Falha de rede ao excluir.");
    }
  };

  // Cadastro de novo produto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          store_name: newStore,
          category: newCategory,
          affiliate_url: newUrl,
          keywords: newKeywords.split(",").map((k) => k.trim()).filter(Boolean),
          price_estimate: newPrice ? parseFloat(newPrice) : null,
          image_url: newImage || undefined,
          is_active: true,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewTitle("");
        setNewKeywords("");
        setNewPrice("");
        setNewImage("");
        notify("Produto cadastrado com sucesso!");
        refreshData();
      } else {
        const err = await res.json();
        notify(`Erro: ${err.error || "Não foi possível cadastrar."}`);
      }
    } catch {
      notify("Falha de comunicação com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtros
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()));

    const matchesStore =
      selectedStore === "all" || p.store_name === selectedStore;

    return matchesSearch && matchesStore;
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-purple text-white shadow-md shadow-brand-purple/30"
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

        {/* Cabeçalho Principal do Painel */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Área Restrita do Administrador
              </span>
              <span className="text-xs text-zinc-500 font-mono">v3.0</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1.5">
              Gestão de Afiliados & Monetização
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Controle de parceiros, catálogo de ofertas, ativação de lojas e métricas de cliques.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-brand-purple to-brand-cyan text-white shadow-md shadow-brand-purple/20 hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </header>

        {/* Notificação Temporária */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-brand-purple/20 border border-brand-purple/40 text-brand-cyan text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
            {actionMessage}
          </div>
        )}

        {/* Status Oficial das Lojas Parceiras */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Amazon */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400">Loja Oficial Ativa</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3" />
                100% Ativo
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">Amazon Brasil</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Tag Vinculada: <code className="text-brand-cyan font-bold bg-zinc-950 px-1.5 py-0.5 rounded">aigameportal-20</code>
            </p>
          </div>

          {/* Card KaBuM! */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400">Parceiro Pendente</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                <XCircle className="w-3 h-3" />
                Inativo
              </span>
            </div>
            <h3 className="text-lg font-black text-zinc-300 mt-1">KaBuM!</h3>
            <p className="text-xs text-zinc-500 mt-1">Aguardando aprovação no programa de associados.</p>
          </div>

          {/* Card Nuuvem */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400">Parceiro Pendente</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                <XCircle className="w-3 h-3" />
                Inativo
              </span>
            </div>
            <h3 className="text-lg font-black text-zinc-300 mt-1">Nuuvem Games</h3>
            <p className="text-xs text-zinc-500 mt-1">Aguardando aprovação no programa de associados.</p>
          </div>
        </section>

        {/* Cards de Métricas / KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
              <span>Total no Catálogo</span>
              <Layers className="w-4 h-4 text-brand-purple" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {kpis.total_products}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
              <span>Produtos Ativos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
              {kpis.active_products}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
              <span>Produtos Pausados</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
              {kpis.inactive_products}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
              <span>Cliques Gerados</span>
              <MousePointerClick className="w-4 h-4 text-brand-cyan" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-brand-cyan mt-2">
              {kpis.total_clicks}
            </div>
          </div>
        </section>

        {/* Barra de Filtros e Busca */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por produto ou palavra-chave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-purple"
            >
              <option value="all">Todas as Lojas</option>
              <option value="Amazon Brasil">Amazon Brasil</option>
              <option value="KaBuM!">KaBuM!</option>
              <option value="Nuuvem">Nuuvem</option>
            </select>
          </div>
        </section>

        {/* Tabela Interativa de Produtos */}
        <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-bold border-b border-zinc-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Produto</th>
                  <th className="py-3.5 px-3">Loja</th>
                  <th className="py-3.5 px-3">Categoria</th>
                  <th className="py-3.5 px-3">Preço Aprox.</th>
                  <th className="py-3.5 px-3 text-center">Cliques</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                      Nenhum produto encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Título e Capa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 flex items-center justify-center">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.title}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-brand-cyan transition-colors line-clamp-1 max-w-xs sm:max-w-sm">
                              {product.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                              Keywords: {product.keywords.slice(0, 3).join(", ")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Loja Parceira */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                            product.store_name === "Amazon Brasil"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {product.store_name}
                        </span>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-3 text-zinc-300 font-medium">
                        {product.category}
                      </td>

                      {/* Preço Estimado */}
                      <td className="py-3.5 px-3 font-semibold text-emerald-400">
                        {product.price_estimate
                          ? `R$ ${product.price_estimate.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>

                      {/* Cliques */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-brand-cyan bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {product.clicks_count || 0}
                        </span>
                      </td>

                      {/* Toggle de Ativação Liga/Desliga */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(product.id, product.is_active)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                            product.is_active
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                              : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              product.is_active ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                            }`}
                          />
                          {product.is_active ? "Ativo" : "Pausado"}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/out/${encodeURIComponent(product.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-brand-purple transition-colors"
                            title="Testar Redirecionamento da Oferta"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDelete(product.id, product.title)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal de Novo Produto */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-brand-purple/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-cyan" />
                  Cadastrar Produto Afiliado
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Nome do Produto Gamer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PlayStation 5 Slim 1TB, Placa RTX 4060..."
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (newStore === "Amazon Brasil") {
                        setNewUrl(
                          `https://www.amazon.com.br/s?k=${encodeURIComponent(
                            e.target.value
                          )}&tag=aigameportal-20`
                        );
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-purple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Loja Parceira *</label>
                    <select
                      value={newStore}
                      onChange={(e) => {
                        setNewStore(e.target.value);
                        if (e.target.value === "Amazon Brasil") {
                          setNewUrl(
                            `https://www.amazon.com.br/s?k=${encodeURIComponent(
                              newTitle
                            )}&tag=aigameportal-20`
                          );
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-purple"
                    >
                      <option value="Amazon Brasil">Amazon Brasil (Ativo)</option>
                      <option value="KaBuM!">KaBuM! (Pendente)</option>
                      <option value="Nuuvem">Nuuvem (Pendente)</option>
                      <option value="Mercado Livre">Mercado Livre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Categoria *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-purple"
                    >
                      <option value="Jogo">Jogo</option>
                      <option value="Console">Console</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Acessórios">Acessórios</option>
                      <option value="PC">PC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    URL com Tag de Afiliado *
                  </label>
                  <input
                    type="url"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-purple"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Palavras-chave para Match no Texto (separadas por vírgula) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ps5, playstation 5, console sony"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-purple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Preço de Referência (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 3799.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">URL da Imagem</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan text-white hover:brightness-110 disabled:opacity-50"
                  >
                    {submitting ? "Cadastrando..." : "Salvar Oferta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
