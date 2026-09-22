# Módulo de Afiliados Inteligentes & Monetização (Fase 3)

O **Módulo de Afiliados Inteligentes** do **AIGamePortal** é um sistema automatizado e contextual de monetização gamer desenvolvido para gerar receita contínua sem comprometer a experiência editorial e em estrito cumprimento das diretrizes de busca e indexação do **Google (E-E-A-T)**.

---

## 1. Princípios de Engenharia e Conformidade SEO

### 1.1 Diretrizes E-E-A-T e Links Patrocinados do Google
Conforme a documentação oficial do Google Search Central para links comerciais e de afiliados:
- Qualquer link que gere ganho financeiro direto ou indireto deve ser sinalizado aos robôs de busca para não manipular sinais de PageRank.
- Todos os links gerados pelo portal (tanto os contextuais inseridos dinamicamente no Markdown quanto os botões do card de recomendação) contêm rigorosamente:
  ```html
  <a href="/api/out/[id]?postId=..." rel="sponsored nofollow" target="_blank">
  ```
  - `rel="sponsored"`: Qualifica formalmente o link como publicidade ou parceria remunerada.
  - `rel="nofollow"`: Reforço para motores de busca legados que ainda não suportam a tag `sponsored`.
  - `target="_blank"`: Preserva o leitor no portal, abrindo a loja parceira em nova aba.

### 1.2 Limite e Densidade de Inserção Contextual
Para preservar a leiturabilidade do artigo e não incorrer em penalizações por excesso de links comerciais (*keyword stuffing*):
- O injetor `lib/services/affiliate-matcher.ts` aplica um teto padrão de **no máximo 3 links contextuais por notícia**.
- Apenas a **primeira ocorrência** de cada produto é convertida em link.
- Cabeçalhos de seção (`#`, `##`, `###`), blocos de código e links já existentes no texto original são protegidos de substituição.

### 1.3 Transparência Editorial com o Leitor
Todo card de recomendação exibe de forma clara e visível o aviso:
> *"Comprando pelos nossos links, o portal pode receber uma comissão sem custo adicional para você. Preços e disponibilidade sujeitos a alteração pela loja parceira."*

---

## 2. Arquitetura do Subsistema

```mermaid
flowchart TD
    A[Artigo Original em Markdown] --> B[injectAffiliateLinks]
    C[(Supabase: affiliate_products)] -->|Cache ISR| B
    B -->|rel='sponsored nofollow'| D[MarkdownContent Atualizado]
    B -->|Produtos Casados| E{Houve match no texto?}
    E -->|Sim| F[Exibe Produto Casado no Card]
    E -->|Não| G[findBestAffiliateDeal: Afinidade de Categoria/Plataforma]
    F --> H[AffiliateDealCard ao final da matéria]
    G --> H

    I[Usuário Clica no Link / Card] --> J[GET /api/out/[id]?postId=...]
    J --> K{ID Válido & Ativo?}
    K -->|Não| L[Redirect HTTP 307 -> Home /]
    K -->|Sim| M[Gravação Assíncrona na tabela affiliate_clicks]
    M -.-> N[(Supabase: affiliate_clicks)]
    K -->|Sim| O[Redirect HTTP 307 -> Loja com Tag de Parceiro]
```

---

## 3. Modelo de Dados no Supabase

A migração oficial encontra-se em `supabase/migrations/20260914000002_affiliate_system.sql`.

### 3.1 Tabela `public.affiliate_products`
Catálogo de produtos monitorados:
```sql
CREATE TABLE public.affiliate_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Hardware', 'Console', 'PC', 'Jogo', 'Acessórios')),
    keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    store_name TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    price_estimate NUMERIC(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 Tabela `public.affiliate_clicks`
Auditoria analítica de conversão:
```sql
CREATE TABLE public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.affiliate_products(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    referrer TEXT,
    user_agent TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 4. Como Cadastrar ou Atualizar Produtos de Parceiros

Para incluir novas ofertas de lojas parceiras (Amazon Brasil, KaBuM!, Nuuvem, etc.), basta executar o comando SQL no Supabase SQL Editor:

```sql
INSERT INTO public.affiliate_products (
    title,
    category,
    keywords,
    store_name,
    affiliate_url,
    image_url,
    price_estimate,
    is_active
) VALUES (
    'Placa de Vídeo RTX 4070 Ti Super 16GB',
    'Hardware',
    ARRAY['rtx 4070 ti', 'geforce rtx 4070 ti', '4070 ti super'],
    'KaBuM!',
    'https://www.kabum.com.br/produto/...?partner=aigameportal',
    'https://images.unsplash.com/photo-...',
    5799.00,
    true
);
```

### Dicas para escolha de `keywords`:
1. Use variações populares em minúsculas (ex: `['ps5 pro', 'playstation 5 pro']`).
2. O sistema automaticamente ordena palavras-chave por tamanho decrescente, garantindo que termos longos e específicos sejam testados antes de termos genéricos.

---

## 5. Rota de Redirecionamento e Tracking (`/api/out/[id]`)

- **URL**: `/api/out/[id]?postId=[id_do_post]`
- **Características**:
  - **HTTP 307 (Temporary Redirect)**: Garante que os navegadores não façam cache permanente da URL, permitindo alterar o link de afiliado no banco a qualquer instante sem que o usuário acesse links desatualizados.
  - **Headers Anti-Cache**:
    ```http
    Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
    Pragma: no-cache
    Expires: 0
    ```
  - **Auditoria Assíncrona**: O clique é inserido na tabela `affiliate_clicks` em background, sem onerar o tempo de resposta do redirecionamento.
  - **Fail-Safe**: Qualquer ID inválido ou inativo conduz o visitante de forma elegante para a página inicial do portal.

---

## 6. Componentes de Interface

### 6.1 Injeção no Markdown (`components/markdown-content.tsx`)
Renderiza links de afiliados em destaque estilizado:
- Cor temática neon: `text-brand-purple hover:text-brand-cyan`.
- Decoração sublinhada sutil: `underline decoration-brand-purple/40 hover:decoration-brand-cyan`.
- Garantia de `rel="sponsored nofollow"` e `target="_blank"`.

### 6.2 Card Gamer de Recomendação (`components/AffiliateDealCard.tsx`)
- Localizado ao término da matéria.
- Badge *"Oferta Recomendada"* com visual âmbar gamer.
- Nome, categoria, preço estimado em BRL e loja parceira.
- Botão interativo *"Ver Menor Preço na [Loja]"*.
- Aviso transparente de comissão de afiliado.

---

## 7. Automação em 100% — As 4 Formas Integradas

Para eliminar a necessidade de cadastro manual repetitivo e garantir cobertura de monetização contínua, o sistema implementa 4 camadas de automação:

### Forma 1: Auto-Cadastro de Produtos por IA no Pipeline de Notícias
- **Localização**: `scripts/sync-news.ts` (`autoRegisterAffiliateProductFromNews`).
- **Como Funciona**: Sempre que o robô de notícias publica um novo artigo com `game_metadata.game_name` identificado, o script verifica se já existe produto cadastrado para aquele jogo. Caso não exista:
  1. Cria um registro em `affiliate_products` apontando para a busca do jogo na Amazon Brasil com a tag oficial `aigameportal-20`.
  2. Gera palavras-chave contextuais automáticas a partir do nome do jogo e variantes populares.
  3. Preenche categoria `'Jogo'`, capa da notícia e status `is_active = true`.
- **Benefício**: Novos jogos noticiados passam a monetizar instantaneamente sem qualquer intervenção humana.

### Forma 2: Smart Search Fallback Dinâmico
- **Localização**: `lib/data/affiliates.ts` (`findBestAffiliateDeal`) e `app/api/out/search/route.ts`.
- **Como Funciona**: Se uma matéria for publicada sobre um tema sem produto direto casado no acervo (ex: uma matéria sobre novidade de hardware genérico ou jogo sem ficha):
  1. O algoritmo gera uma oferta de busca inteligente ("Buscar [Tema] na Amazon").
  2. Aponta para `/api/out/search?q=...&category=...&postId=...`.
  3. O endpoint registra o clique analítico em background e redireciona (HTTP 307) para a Amazon Brasil com a tag `aigameportal-20`.
- **Benefício**: 100% das matérias do portal possuem monetização ativa mesmo que o banco de dados esteja vazio ou em fase inicial de catálogo.

### Forma 3: Sincronização & Auditoria Autônoma por Cron
- **Localização**: `scripts/sync-affiliates.ts` (`npm run sync:affiliates`).
- **Como Funciona**: Script executado periodicamente ou sob demanda para auditar todo o acervo:
  1. Garante que todos os links da Amazon Brasil contenham obrigatoriamente a tag `aigameportal-20`.
  2. Garante que produtos de lojas parceiras ainda não aprovadas (KaBuM! e Nuuvem) permaneçam estritamente inativos (`is_active = false`).
  3. Gera relatório detalhado no terminal de métricas, produtos ativos/inativos e cliques auditados.
- **Execução**:
  ```bash
  npm run sync:affiliates
  ```

### Forma 4: Portal Administrativo Visual (`/admin/afiliados`)
- **Localização**: `app/admin/afiliados/` e `app/api/admin/`.
- **Como Funciona**: Painel protegido exclusivamente para o gestor do portal:
  - Exibição em tempo real de Total de Produtos, Produtos Ativos, Total de Cliques e Taxa de Ativação.
  - Cards de Status das Lojas com tags e badges de ativação (Amazon Brasil ATIVO; KaBuM! e Nuuvem INATIVOS).
  - Toggles instantâneos (Liga/Desliga) para ativar ou desativar qualquer produto com 1 clique.
  - Modal para cadastrar novos produtos manualmente com estimativa de preço, loja, URL e palavras-chave.
  - Exclusão rápida de itens descontinuados.

---

## 8. Status Atual das Lojas Parceiras

| Loja | Tag de Afiliado | Status Atual | Comportamento no Sistema |
| :--- | :--- | :---: | :--- |
| **Amazon Brasil** | `aigameportal-20` | 🟢 **ATIVO** | Produtos ativos gerando links contextuais, fallback de busca e tracking. |
| **KaBuM!** | `aigameportal-kabum` (Pendente) | ⚪ **INATIVO** | Produtos mantidos em standby (`is_active = false`). Não aparecem para os leitores até ativação no painel. |
| **Nuuvem** | `aigameportal-nuuvem` (Pendente) | ⚪ **INATIVO** | Produtos digitais de PC mantidos em standby (`is_active = false`). Não aparecem para os leitores até ativação no painel. |

> 📌 **Como ativar KaBuM! ou Nuuvem no futuro**: Assim que sua conta for aprovada nos programas de parceiros, basta acessar `/admin/afiliados`, clicar no botão liga/desliga do produto desejado ou rodar um `UPDATE affiliate_products SET is_active = true WHERE store_name = 'KaBuM!';`.

---

## 9. Segurança e Acesso ao Portal `/admin/afiliados`

### 9.1 Autenticação Segura por Chave Mestra
- Acesso restrito via senha mestre configurada na variável de ambiente `ADMIN_SECRET_KEY` (padrão local: `aigameportal_admin_2026`).
- Sessão persistida em cookie seguro `admin_session` com flags:
  - `HttpOnly`: Inacessível via JavaScript no navegador (proteção contra XSS).
  - `SameSite: Strict`: Proteção contra Cross-Site Request Forgery (CSRF).
  - `Max-Age: 86400`: Expiração automática em 24 horas.

### 9.2 Proteção SEO (Anti-Indexação)
O portal administrativo é estritamente fechado para motores de busca via metatags no Server Component:
```typescript
export const metadata: Metadata = {
  title: "Painel de Afiliados | AIGamePortal Admin",
  robots: {
    index: false,
    follow: false,
  },
};
```
Além disso, o arquivo `public/robots.txt` possui a diretiva:
```
Disallow: /admin/
Disallow: /api/admin/
```

### 9.3 Privilégios de Acesso e Supabase RLS
- **Leitura Pública vs Administrativa**:
  - Usuários anônimos e leitores só têm permissão RLS para consultar produtos com `is_active = true`.
  - A tabela analítica `affiliate_clicks` possui permissão de leitura restrita exclusivamente para `service_role`.
- **Camada de Dados Administrativa**:
  - As operações de gestão em [`lib/data/affiliates.ts`](../lib/data/affiliates.ts) (`getAllAffiliateProductsAdmin`, `toggleAffiliateProductActive`, `createAffiliateProductAdmin`, `deleteAffiliateProductAdmin`) utilizam a padronização:
    ```typescript
    const supabase = createAdminClient() || createServerClient();
    ```
  - Isso garante a passagem da chave `SUPABASE_SERVICE_ROLE_KEY` para contornar o bloqueio de RLS e calcular métricas de cliques por produto, com fallback resiliente para o catálogo mock caso a chave não esteja presente em ambiente local.

---

## 10. Rota de Redirecionamento de Busca (`GET /api/out/search`)

- **URL**: `/api/out/search?q=...&category=...&postId=...`
- **Finalidade**: Fallback resiliente para matérias sem produto cadastrado.
- **Funcionamento**:
  1. Cria dinamicamente ou reutiliza um produto tipo busca na tabela `affiliate_products`.
  2. Registra o clique analítico em `affiliate_clicks`.
  3. Redireciona via **HTTP 307** para:
     `https://www.amazon.com.br/s?k=[query]&tag=aigameportal-20`

