# Bot de Alertas de Jogos Grátis e Breaking News para o Discord (Fase 4)

O ecossistema **AIGamePortal** conta com uma integração automatizada e serverless com o **Discord**, criada para engajar a comunidade gamer através de notificações em tempo real de **Jogos 100% Gratuitos** (Epic Games Store, Steam, Prime Gaming, GOG, Ubisoft) e alertas urgentes de **Breaking News (Impacto 5/5)**.

---

## 1. Arquitetura Serverless vs. WebSocket Tradicional

Diferente de bots legados que exigem um processo Node.js persistente mantendo uma conexão WebSocket ativa 24/7 (com alto consumo de memória, custo de servidor e risco de quedas silenciosas de socket), nossa solução opera **100% via Discord Webhook API**:

| Característica | Bot WebSocket Legado | Automação via Webhook (AIGamePortal) |
| :--- | :--- | :--- |
| **Custo de Hospedagem** | Requer VPS dedicada 24/7 | **R$ 0,00** (Executado via GitHub Actions Cron) |
| **Consumo de Memória** | Constante (150MB - 300MB) | **Zero** quando ocioso |
| **Confiabilidade de Rede** | Sujeito a desconexões e reconexões | **Stateless HTTP** com retries automáticos |
| **Velocidade de Disparo** | Dependente do heartbeat do bot | **Instantâneo** via chamada HTTP POST |
| **Resiliência a Rate-Limit** | Pode travar toda a conexão | Trata HTTP 429 com backoff e `retry_after` |

---

## 2. Estrutura de Arquivos

```
AIGamePortal/
├── .github/
│   └── workflows/
│       └── cron-discord-deals.yml       # Agendamento no GitHub Actions (a cada 2 horas)
├── lib/
│   └── services/
│       └── discord-notifier.ts          # Serviço central tipado de disparo de webhooks
├── scripts/
│   ├── discord-bot.ts                   # Rastreador autônomo de jogos grátis (GamerPower API)
│   └── sync-news.ts                     # Ingestão com disparo integrado de Breaking News (5/5)
├── supabase/
│   └── migrations/
│       └── 20260916000004_free_games_history.sql # Tabela de histórico de promoções enviadas
└── docs/
    └── discord-bot.md                   # Esta documentação completa
```

---

## 3. Rastreador de Jogos Grátis (`scripts/discord-bot.ts`)

O script consome a API da GamerPower (`https://www.gamerpower.com/api/giveaways?type=game`) e filtra promoções ativas de jogos completos para PC e consoles:

### 3.1. Prevenção de Duplicidade (Supabase + Fallback)
1. **Banco Supabase (`free_games_history`)**: Verifica se o `deal_id` retornado pela API já foi postado anteriormente.
2. **Fallback Local Redundante (`scratch/free_games_history.json`)**: Caso o banco de dados esteja inacessível ou em ambiente local sem migrações executadas, o script mantém a lista em arquivo JSON para garantir operação contínua.

### 3.2. Formatação do Rich Embed Oficial
O alerta enviado ao Discord é formatado visualmente no mais alto padrão de design gamer:
- **Cor de Destaque**: Verde Esmeralda Gamer (`#10B981`).
- **Título**: `🚨 JOGO GRÁTIS: [Nome do Jogo Higienizado]`.
- **Preço Original Cortado**: Ex: `De ~~$24.99~~ por **GRÁTIS!** 🏷️` ou `🔥 **100% GRÁTIS!**`.
- **Plataformas Identificadas**: Ex: `PC, Epic Games Store`, `PC, Steam`, etc.
- **Validade do Resgate**: Data formatada em PT-BR (ex: `📅 Até 23/09/2026 às 23:59`) ou aviso de tempo limitado.
- **Capa Promocional em HD**: Renderizada diretamente no corpo do embed (`image.url`).
- **Botões Interativos (ActionRow Link Buttons)**:
  1. `Resgatar na Loja 🎁` -> Redireciona diretamente para a página de resgate oficial.
  2. `Ver no AIGamePortal 🌐` -> Abre a seção de jogos e ofertas do portal.
  3. **Fallback Markdown**: Links embutidos também no corpo da descrição para clientes antigos do Discord que não renderizam botões em webhooks.

---

## 4. Disparo de Breaking News (`lib/services/discord-notifier.ts`)

Integrado diretamente ao pipeline de notícias (`scripts/sync-news.ts`), a função `sendDiscordNewsAlert(post)` é disparada automaticamente quando o sistema identifica um evento de impacto máximo (5/5):

- **Critérios de Detecção de Alto Impacto**:
  - Anúncios de novos consoles ou hardware oficial (`Switch 2`, `PS6`, `PlayStation 6`, `Xbox Next`).
  - Revelações globais e trailers mundiais de grandes franquias (`GTA 6`, `World Premiere`).
  - Terremotos na indústria (cancelamentos definitivos de grandes projetos, fechamento de estúdios, aquisições bilionárias).
  - Nota de confiabilidade 4/5 ou 5/5 validada pela IA.
- **Visual do Alerta**:
  - **Cor de Destaque**: Vermelho Vibrante de Plantão (`#DC2626`) ou Âmbar para Rumores Quentes (`#F59E0B`).
  - **Título**: `🔥 [BREAKING NEWS] [Título]` ou `🚨 [RUMOR BOMBA] [Título]`.
  - **Resumo TL;DR**: Marcadores dos pontos cruciais do fato.
  - **Botão**: `Ler Matéria Completa 🎮` apontando para o artigo publicado com ISR no AIGamePortal.

---

## 5. Como Configurar os Webhooks no Discord

1. No seu servidor do Discord, acesse as **Configurações do Servidor** (ícone da engrenagem).
2. Vá até a aba **Integrações** > **Webhooks** e clique em **Novo Webhook**.
3. Crie dois webhooks distintos para canais separados:
   - **Canal de Jogos Grátis** (ex: `#jogos-gratis` ou `#ofertas`):
     - Nome: `AIGamePortal Deals`
     - Copie a URL do Webhook e salve em `DISCORD_WEBHOOK_FREE_GAMES`.
   - **Canal de Notícias Urgentes** (ex: `#plantao-noticias` ou `#anuncios`):
     - Nome: `AIGamePortal Notícias`
     - Copie a URL do Webhook e salve em `DISCORD_WEBHOOK_NEWS`.

---

## 6. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env.local` (e nos **Secrets** do repositório no GitHub):

```env
# Discord Webhooks (Fase 4)
DISCORD_WEBHOOK_FREE_GAMES=https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz_deals
DISCORD_WEBHOOK_NEWS=https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz_news
```

---

## 7. Como Executar e Testar Localmente

### 7.1. Simulação sem envio real (Modo Dry-Run)
Executa a busca completa na GamerPower, checa o banco e renderiza o preview dos alertas no terminal sem enviar requisições ao Discord:
```bash
npx tsx scripts/discord-bot.ts --dry-run
```

### 7.2. Envio Real via CLI
Dispara as novas oportunidades para o canal configurado:
```bash
npm run deals:discord
```

### 7.3. Opções Avançadas de Linha de Comando (CLI Flags)
- `--limit=N`: Define a quantidade máxima de novas ofertas disparadas nesta execução (padrão: 5 para evitar flood).
  ```bash
  npx tsx scripts/discord-bot.ts --limit=2
  ```
- `--force`: Ignora a tabela de histórico e reenvia alertas mesmo que já tenham sido postados (útil para testes visuais de layout).
  ```bash
  npx tsx scripts/discord-bot.ts --dry-run --force
  ```

---

## 8. Agendamento no GitHub Actions

O workflow `.github/workflows/cron-discord-deals.yml` roda automaticamente em ambiente Ubuntu no GitHub:
- **Frequência**: A cada 2 horas (`0 */2 * * *`).
- **Disparo Manual**: Suporte ao botão `Run workflow` na interface do GitHub Actions (`workflow_dispatch`).
- **Prevenção de Colisão**: Concorrência configurada para impedir duas execuções simultâneas.

---

## 9. Resiliência e Tratamento de Erros

1. **Rate Limiting (HTTP 429)**: O serviço lê o cabeçalho `retry_after` retornado pelo Discord, aguarda o intervalo indicado com backoff exponencial e reexecuta o disparo.
2. **Pausa Entre Disparos**: O bot aplica uma pausa de 1,5 segundo entre postagens sucessivas, garantindo estabilidade e respeito às diretrizes de uso da API do Discord.
3. **Fallback para Rejeição de Componentes (HTTP 400)**: Caso algum webhook não tenha permissão de postar botões interativos (`components`), o despachante remove os botões automaticamente e reenvia apenas os Embeds e links Markdown.
4. **Isolamento de Falhas no Pipeline**: Se a API do Discord oscilar ou falhar durante a publicação de uma notícia, o pipeline principal (`sync-news.ts`) registra o erro em log e continua normalmente sem interromper a publicação do site ou das demais redes sociais.
