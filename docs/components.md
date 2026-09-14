# Catálogo de Componentes de UI — AIGamePortal

Este documento detalha todos os componentes visuais desenvolvidos para o **AIGamePortal**, incluindo suas interfaces de props, comportamentos interativos, dependências e padrões de acessibilidade.

---

## 1. Componentes Estruturais Globais

### `<Header categories={categories} />`
- **Arquivo**: [components/header.tsx](file:///d:/IAProjects/AIGamePortal/components/header.tsx)
- **Tipo**: Client Component (`"use client"`)
- **Props**:
  ```typescript
  interface HeaderProps {
    categories: Category[];
  }
  ```
- **Funcionalidades**:
  - Logo gamer minimalista com gradiente dinâmico (`from-brand-purple to-brand-cyan`).
  - Barra de status de micro-ticker no topo indicando se o pipeline de IA está ativo e quantidade de fontes monitoradas.
  - Navegação responsiva de categorias com destaque para a rota ativa via `usePathname()`.
  - Botão alternador de tema claro/escuro (`<ThemeToggle />`).
  - Gaveta móvel (drawer) com animação suave de transição para telas menores que `1024px`.
- **Acessibilidade**: Atributos `aria-label` em botões e navegação semântica com `<header>` e `<nav>`.

---

### `<Footer />`
- **Arquivo**: [components/footer.tsx](file:///d:/IAProjects/AIGamePortal/components/footer.tsx)
- **Tipo**: Server Component
- **Props**: Nenhuma.
- **Funcionalidades**:
  - Banner superior de garantia editorial E-E-A-T e política anti-alucinação.
  - Quatro colunas estruturadas: Identidade da Marca, Plataformas, Governança/Transparência e Feeds Homologados.
  - Links institucionais com rotas diretas para manifesto de IA e formulário de retificação de conteúdo.

---

## 2. Componentes de Feed e Homepage

### `<HeroFeatured post={post} />`
- **Arquivo**: [components/hero-featured.tsx](file:///d:/IAProjects/AIGamePortal/components/hero-featured.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface HeroFeaturedProps {
    post: Post;
  }
  ```
- **Funcionalidades**:
  - Destaque visual principal da Homepage com aspecto cinematográfico.
  - Imagem de capa otimizada via `next/image` com flag `priority={true}` para otimizar a métrica **LCP (Largest Contentful Paint)**.
  - **Guarda de Imagem Segura**: Validação defensiva via `isValidImageUrl` que impede renderização de formatos inválidos ou áudios `.mp3`.
  - Camadas de gradiente escuro (`from-zinc-950 via-zinc-950/70 to-transparent`) que preservam o contraste do texto mesmo em imagens claras.
  - Badges informativas: Categoria, Plataformas suportadas, tempo de leitura e data relativa.

---

### `<NewsCard post={post} priority={priority} />`
- **Arquivo**: [components/news-card.tsx](file:///d:/IAProjects/AIGamePortal/components/news-card.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface NewsCardProps {
    post: Post;
    priority?: boolean;
  }
  ```
- **Funcionalidades**:
  - Card responsivo para exibição no grid de notícias.
  - **Guarda Defensiva de Capa**: Renderiza a imagem via `next/image` apenas se validada por `isValidImageUrl()`. Em caso de URL inválida, exibe o placeholder gradiente gamer com ícone de raio neon sem quebrar o layout.
  - Efeito suave de zoom na capa no estado `:hover` (`group-hover:scale-105 duration-500`).
  - **Bullet point rápido de TL;DR**: Exibe o primeiro fato resumido da matéria diretamente no card, economizando tempo de navegação do leitor.
  - Badges de plataforma flutuantes com efeito de vidro fosco (`backdrop-blur-md`).

---

### `<Sidebar trendingPosts={trendingPosts} categories={categories} />`
- **Arquivo**: [components/sidebar.tsx](file:///d:/IAProjects/AIGamePortal/components/sidebar.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface SidebarProps {
    trendingPosts: Post[];
    categories: Category[];
  }
  ```
- **Funcionalidades**:
  - **Ranking Mais Lidas**: Lista ordenada numericamente (#1 a #5) com contador formatado de visualizações.
  - **Pulso de Sentimento da Comunidade Dinâmico**: Extrai dados reais do Supabase a partir dos campos `post.game_metadata.game_name` e `post.community_sentiment`, calculando barras de progresso proporcionais com score de hype/aprovação e **links clicáveis diretos** para a matéria correspondente (`/noticias/[slug]`). Conta com fallback para tópicos em alta caso o banco esteja vazio.
  - **Atalhos Rápidos**: Botões de navegação direta por plataforma.
  - **Card de Governança Algorítmica**: Explicação condensada do filtro vetorial do Gemini.

---

## 3. Componentes da Página do Artigo

### `<RumorBanner warning={warning} reliabilityScore={reliabilityScore} />`
- **Arquivo**: [components/RumorBanner.tsx](file:///d:/IAProjects/AIGamePortal/components/RumorBanner.tsx) (com re-export em [components/rumor-banner.tsx](file:///d:/IAProjects/AIGamePortal/components/rumor-banner.tsx))
- **Tipo**: Server / Client Component compatível
- **Props**:
  ```typescript
  interface RumorBannerProps {
    warning?: string | null;
    reliabilityScore?: number;
    className?: string;
  }
  ```
- **Design & Funcionalidades**:
  - Banner de alerta visual gamer exibido no topo da matéria quando `post.is_rumor === true`.
  - Estilização moderna com borda e fundo em acento âmbar néon (`border-amber-500/30 bg-amber-500/10`).
  - Glow âmbar ambiente de fundo (`bg-amber-500/15 blur-2xl`) sem bloquear interações.
  - Ícone pulsante de perigo da Lucide (`AlertTriangle`) em caixa destacada com efeito de vidro fosco.
  - Badge de status com ponto animado (`animate-ping`) indicando *"Rumor / Vazamento Não Confirmado"*.
  - **Medidor de Confiabilidade da Fonte (1 a 5)**: Barras visuais e legenda contextual (ex: 5 = Oficial, 4 = Investigação, 3 = Patente, 2 = Datamine, 1 = Fórum anônimo).
  - Texto regulatório padronizado: *"Atenção: Esta notícia é baseada em rumores ou vazamentos não confirmados oficialmente pelas empresas envolvidas. Trate as informações com cautela."*
  - Bloco expansivo para o aviso contextual (`rumor_warning`) formulado pelo modelo de IA.

---

### `<TldrBox bullets={bullets} />`
- **Arquivo**: [components/tldr-box.tsx](file:///d:/IAProjects/AIGamePortal/components/tldr-box.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface TldrBoxProps {
    bullets: string[];
  }
  ```
- **Design**:
  - Borda dupla em roxo neon (`border-brand-purple/40`), fundo em gradiente translúcido e ambient glow no canto superior direito.
  - Ícone de raio (`Zap`) e marcadores numéricos circulares em roxo.

---

### `<GameMetadataCard metadata={metadata} />`
- **Arquivo**: [components/game-metadata-card.tsx](file:///d:/IAProjects/AIGamePortal/components/game-metadata-card.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface GameMetadataCardProps {
    metadata?: GameMetadata | null;
  }
  ```
- **Funcionalidades**:
  - Ficha técnica estruturada do jogo.
  - Badge de pontuação do Metacritic com coloração condicional (verde para $\ge 75$, amarelo para $50-74$, vermelho para $< 50$).
  - Lista de plataformas suportadas, desenvolvedora, publicadora, gênero e data de lançamento formatada em `pt-BR`.

---

### `<CommunitySentimentBox sentimentText={sentimentText} />`
- **Arquivo**: [components/community-sentiment-box.tsx](file:///d:/IAProjects/AIGamePortal/components/community-sentiment-box.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface CommunitySentimentBoxProps {
    sentimentText?: string | null;
  }
  ```
- **Funcionalidades**:
  - Resumo de repercussão do Reddit e X/Twitter capturado pelos crawlers.
  - Avatares estilizados de fóruns comunitários (`r/` e `𝕏`).
  - Citação estilizada em itálico.

---

### `<EeatAttributionBox sourceOriginalUrl={url} sourceOriginalTitle={title} source={source} />`
- **Arquivo**: [components/eeat-attribution-box.tsx](file:///d:/IAProjects/AIGamePortal/components/eeat-attribution-box.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface EeatAttributionBoxProps {
    sourceOriginalUrl: string;
    sourceOriginalTitle?: string | null;
    source?: Source | null;
  }
  ```
- **Conformidade E-E-A-T**:
  - Cita o nome da redação ou blog oficial de primeira mão.
  - Informa o título original do artigo capturado no RSS.
  - Botão com link direto para a fonte com `rel="noopener noreferrer nofollow"`.

---

### `<ShareButtons title={title} url={url} />`
- **Arquivo**: [components/share-buttons.tsx](file:///d:/IAProjects/AIGamePortal/components/share-buttons.tsx)
- **Tipo**: Client Component (`"use client"`)
- **Props**:
  ```typescript
  interface ShareButtonsProps {
    title: string;
    url?: string;
  }
  ```
- **Funcionalidades**:
  - Botão de **Copiar Link** com retorno visual imediato (*"Copiado!"* com ícone de check verde por 2.5 segundos).
  - Links diretos com intent URL para compartilhamento no **X (Twitter)**, **WhatsApp** e **Reddit**.

---

### `<MarkdownContent content={content} />`
- **Arquivo**: [components/markdown-content.tsx](file:///d:/IAProjects/AIGamePortal/components/markdown-content.tsx)
- **Tipo**: Server Component
- **Props**:
  ```typescript
  interface MarkdownContentProps {
    content: string;
  }
  ```
- **Funcionalidades**:
  - Converte Markdown semântico em elementos HTML puros (`<h2>`, `<h3>`, `<blockquote>`, `<ul>`, `<p>`, `<strong>`, `<em>`).
  - Suporte a tags HTML `<a>` com `rel="sponsored nofollow"` e `target="_blank"` injetadas pelo módulo de afiliados.
  - Suporte a links Markdown `[texto](url)` com estilização gamer neon (`text-brand-purple hover:text-brand-cyan`).
  - Zero dependências pesadas de parsing no cliente, gerando saída HTML ultraleve com estilização `.article-content`.

---

### `<AffiliateDealCard product={product} postId={postId} />` (Fase 3)
- **Arquivo**: [components/AffiliateDealCard.tsx](file:///d:/IAProjects/AIGamePortal/components/AffiliateDealCard.tsx)
- **Tipo**: Client Component (`"use client"`)
- **Props**:
  ```typescript
  interface AffiliateDealCardProps {
    product: AffiliateProduct | null;
    postId?: string | null;
    className?: string;
  }
  ```
- **Funcionalidades**:
  - Card gamer moderno com visual dark/glassmorphism e luzes difusas neon.
  - Badge *"Oferta Recomendada"* com ícone `Sparkles` e tag da categoria gamer.
  - Imagem do produto otimizada com `next/image` e fallback elegante para erros de carregamento.
  - Exibição de preço formatado em Real brasileiro (`R$`) com alta legibilidade.
  - Botão de ação (CTA) com gradiente gamer apontando para a rota de saída `/api/out/[id]?postId=...` com `rel="sponsored nofollow"` e `target="_blank"`.
  - Aviso de transparência e conformidade Google E-E-A-T: *"Comprando pelos nossos links, o portal pode receber uma comissão sem custo adicional para você."*

---

## 4. Componentes de Tema e Acessibilidade

### `<ThemeToggle />`
- **Arquivo**: [components/theme-toggle.tsx](file:///d:/IAProjects/AIGamePortal/components/theme-toggle.tsx)
- **Tipo**: Client Component
- **Prevenção de Hydration Mismatch**: Utiliza flag `mounted` com `useEffect` para aguardar a montagem no cliente antes de renderizar o ícone correspondente ao tema resolvido.
- **Micro-animação**: Rotação suave do ícone do sol (`rotate-45`) e da lua (`-rotate-12`).
