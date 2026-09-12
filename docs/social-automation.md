# Automação e Distribuição em Redes Sociais — AIGamePortal

Este documento detalha o funcionamento, arquitetura, templates de copywriting e procedimentos de configuração do módulo de **Distribuição Multi-canal Automática** ([lib/services/social-publisher.ts](file:///d:/IAProjects/AIGamePortal/lib/services/social-publisher.ts)).

---

## 1. Visão Geral

Assim que uma notícia inédita e verificada é gravada no banco de dados e seu cache ISR é invalidado, o sistema dispara publicações otimizadas para as redes sociais conectadas:

1. **Telegram**: Envio via Bot API (`sendPhoto` ou `sendMessage`) para canal público ou grupo gamer, com formatação HTML rica, capa e botão inline interativo.
2. **X (Twitter)**: Publicação de tweet via `twitter-api-v2` utilizando OAuth 1.0a User Context, respeitando rigorosamente o limite de 280 caracteres.

```mermaid
flowchart LR
    A[Artigo Salvo no Supabase] --> B[sync-news.ts]
    B --> C[triggerISRRevalidation]
    B --> D[publishToSocialNetworks]
    
    subgraph Publisher ["lib/services/social-publisher.ts"]
        D --> E[generateSocialCopy]
        E --> F1[Telegram Bot API]
        E --> F2[Twitter API v2]
    end
    
    F1 -->|Foto + HTML + Botão| G1[Canal Telegram]
    F2 -->|Tweet <= 280 chars| G2[Feed X/Twitter]
```

---

## 2. Social Copywriter (Regras de Copy Gamer)

A função `generateSocialCopy(payload)` transforma os metadados brutos do artigo em textos magnéticos:

### 2.1 Gancho Forte (Hook)
- **Notícias Verificadas**: Iniciadas com emojis temáticos da comunidade gamer (`🎮`, `💥`, `🔥`).
- **Rumores / Vazamentos (`is_rumor: true`)**: Prefixa obrigatoriamente `🚨 [RUMOR]` para total transparência editorial com a audiência.

### 2.2 Resumo em Bullet Points
- Extrai exatamente **2 bullet points ultra-resumidos** a partir do array `tldr` gerado pelo Gemini.
- Utiliza marcadores padronizados `▪️`.

### 2.3 Link Canônico
- Aponta diretamente para o artigo completo no portal (`https://aigameportal.com.br/noticias/[slug]`).

### 2.4 Hashtags Estratégicas Contextuais
- Mapeadas automaticamente pela categoria principal e metadados de plataformas:
  - **PlayStation**: `#PlayStation #PS5 #Games #Gaming`
  - **Xbox**: `#Xbox #XboxSeriesX #GamePass #Games`
  - **Nintendo**: `#Nintendo #NintendoSwitch #Games #Gaming`
  - **PC Gaming**: `#PCGaming #Steam #PCGamer #Games`
  - **Geral**: `#Games #Gaming #NoticiasGames #Gamer`
  - **Se Rumor**: Adiciona `#Rumor` estrategicamente no conjunto de hashtags.

---

## 3. Especificações por Canal

### 3.1 Telegram (Bot API)

- **Endpoints**:
  - `POST https://api.telegram.org/bot<TOKEN>/sendPhoto` (prioridade quando há capa válida)
  - `POST https://api.telegram.org/bot<TOKEN>/sendMessage` (fallback automático)
- **Modo de Parse**: `HTML` (com sanitização via `escapeTelegramHtml` para prevenir erros de parsing em tags como `<`, `>`, `&`).
- **Botão Inline**:
  ```json
  {
    "inline_keyboard": [
      [
        {
          "text": "Ler Matéria Completa 🎮",
          "url": "https://aigameportal.com.br/noticias/[slug]"
        }
      ]
    ]
  }
  ```
- **Exemplo de Renderização no Telegram**:
  ```
  🎮 PlayStation anuncia novo State of Play com 40 minutos de novidades

  ▪️ Transmissão ao vivo acontecerá na próxima quinta-feira às 18h com foco em títulos first-party.
  ▪️ Mais de 15 jogos para PlayStation 5 e PS VR2 receberão datas de lançamento e trailers.

  🔗 aigameportal.com.br/noticias/playstation-anuncia-novo-state-of-play

  #PlayStation #PS5 #Games #Gaming
  [ Botão: Ler Matéria Completa 🎮 ]
  ```

### 3.2 X / Twitter (API v2)

- **Biblioteca**: `twitter-api-v2` (`^1.29.1`).
- **Autenticação**: OAuth 1.0a User Context com 4 chaves (Consumer Key/Secret + Access Token/Secret).
- **Controle de 280 Caracteres**:
  - URLs contam como 23 caracteres na API v2 do Twitter (`t.co`).
  - O algoritmo `buildTwitterCopy` aplica compressão progressiva em 5 níveis caso o texto exceda a margem:
    1. Hook completo + 2 bullets + URL + Hashtags.
    2. Bullets comprimidos para até 60 caracteres.
    3. Redução para 1 bullet ultra-curto.
    4. Remoção de bullets (Hook + URL + Hashtags).
    5. Truncamento com reticências no Hook para assegurar `<= 280` caracteres.

---

## 4. Como Configurar as Credenciais

### 4.1 Telegram

1. Abra o Telegram e procure por [@BotFather](https://t.me/BotFather).
2. Envie `/newbot` e siga as instruções para criar seu bot e obter o `TELEGRAM_BOT_TOKEN`.
3. Crie um canal público no Telegram (ex: `t.me/aigameportal_noticias`).
4. Adicione o bot criado como **Administrador** do canal com a permissão "Post Messages" habilitada.
5. Defina no seu `.env.local`:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_example
   TELEGRAM_CHAT_ID=@aigameportal_noticias
   ```

### 4.2 X (Twitter)

1. Acesse o [Developer Portal do X](https://developer.x.com/en/portal/dashboard).
2. Crie um novo **Project & App**.
3. Em **User Authentication Settings**, configure:
   - App permissions: **Read and Write**.
   - Type of App: **Web App, Automated App or Bot**.
4. Em **Keys and Tokens**, gere e guarde:
   - **Consumer Keys**: API Key e API Secret Key (`TWITTER_API_KEY`, `TWITTER_API_SECRET`).
   - **Authentication Tokens**: Access Token e Access Token Secret (`TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`).
5. Defina no seu `.env.local`:
   ```env
   TWITTER_API_KEY=sua_api_key
   TWITTER_API_SECRET=seu_api_secret
   TWITTER_ACCESS_TOKEN=seu_access_token
   TWITTER_ACCESS_SECRET=seu_access_secret
   ```

---

## 5. Testes e Validação Manual

O repositório inclui um script dedicado para testar e inspecionar a geração das copies e validar disparos reais:

```bash
# 1. Modo DRY-RUN (inspeciona a formatação e contagem de caracteres sem gastar requisições)
npx tsx scripts/test-social-publisher.ts

# 2. Modo LIVE (executa envio real nas redes configuradas no .env.local)
npx tsx scripts/test-social-publisher.ts --live
```

---

## 6. Tolerância a Falhas e Segurança

- **100% Não-Bloqueante**: Toda a lógica social é executada com `Promise.allSettled`. Qualquer falha de rede, timeout ou rate limit da API é capturada e documentada no log do pipeline sem lançar exceção não tratada.
- **Zero Vazamento de Chaves**: As credenciais nunca são expostas com o prefixo `NEXT_PUBLIC_` e residem exclusivamente no servidor e nos Secrets do GitHub Actions.
- **Degradação Elegante**: Se os tokens não forem configurados no ambiente, o serviço emite um log amigável com status `skipped: true`, permitindo executar o pipeline normalmente em ambientes locais ou de desenvolvimento.
