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
