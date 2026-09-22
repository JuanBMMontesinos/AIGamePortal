# Manual Operacional: Central de Logs & Auditoria de IA (`/admin/logs`)

Este manual operacional detalha o funcionamento, arquitetura de visualização, procedimentos de triagem, dicionário de códigos de erro e rotinas de manutenção da **Central de Logs & Auditoria de IA** ([app/admin/logs/page.tsx](file:///d:/IAProjects/AIGamePortal/app/admin/logs/page.tsx)), módulo responsável pela observabilidade em tempo real de todo o ecossistema autônomo do portal **Made By AI Games**.

---

## 1. Visão Geral e Arquitetura de Acesso

O portal Made By AI Games opera com agentes autônomos de inteligência artificial (Gemini 1.5 Flash e Google Embeddings), scrapers multi-tier de feeds RSS/Atom e publicadores multi-canal para redes sociais (X/Twitter, Telegram, Discord e Instagram). 

A **Central de Logs & Auditoria** unifica a telemetria desses serviços na tabela PostgreSQL `public.ai_system_logs`, oferecendo visibilidade completa de:
- Sucessos e falhas em cada etapa de ingestão, sumarização e deduplicação de notícias.
- Despachos e rejeições de postagens em redes sociais.
- Métricas consolidadas (KPIs) de confiabilidade e disponibilidade dos agentes.
- Rastreamento cirúrgico de **Tarefas Não Concluídas pela IA** (`task_completed = false`).

### 1.1 Credenciais e URLs de Acesso
- **URL Local**: `http://localhost:3000/admin/logs`
- **URL em Produção**: `https://aigameportal.vercel.app/admin/logs`
- **Mecanismo de Autenticação**: Protegido por sessão com cookie criptográfico `admin_session` assinado digitalmente com HMAC-SHA256 ou validação da chave mestra `ADMIN_SECRET_KEY` configurada no ambiente.
- **Proteção contra Indexação**: A rota possui cabeçalhos e metadados estritos `robots: { index: false, follow: false }`, sendo invisível para rastreadores de motores de busca.

---

## 2. Guia de Uso da Interface Administrativa

A interface do painel foi desenhada com design system gamer em tema escuro (`zinc-950`/`slate-900`) e componentes visuais de alta legibilidade divididos em quatro áreas principais:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎮 MADE BY AI GAMES — CENTRAL DE LOGS & AUDITORIA DE IA                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [KPI: Total Logs]  [KPI: Falhas 24h/7d]  [KPI: Incompletas]  [KPI: Críticos] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Abas: Todas | ⚠️ Incompletas | 🤖 IA | 📡 Redes Sociais | 🚨 Críticos]      │
│ [Busca Textual Sanitizada] [Filtro Serviço] [Filtro Nível] [Filtro Status] │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📋 TABELA DE REGISTROS PAGINADA (Horário, Serviço, Ação, Status, Mensagem)  │
│    -> Botão "Ver Detalhes" para abrir o Modal de Inspeção Forense           │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Botão: Expurgar Logs Antigos (RPC)]              [Paginação: < 1 2 3 ... >]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Cards de KPIs em Tempo Real
No topo da página, cards interativos calculam dinamicamente a saúde operacional do ecossistema:
1. **Total de Eventos Registrados**: Volume total de registros de telemetria persistidos no banco.
2. **Taxa de Falhas & Sucesso**: Percentual ponderado de requisições concluídas com êxito versus erros.
3. **Falhas Recentes (24h / 7d)**: Indicador de incidentes nas últimas 24 horas e nos últimos 7 dias para identificação rápida de anomalias pontuais ou quedas de APIs parceiras.
4. **Tarefas Não Concluídas pela IA**: Contador em destaque vermelho das matérias ou publicações onde a IA foi acionada, mas não concluiu a entrega final (`task_completed = false`).
5. **Erros Críticos**: Contagem de exceções classificadas com severidade `critical` (ex: exaustão de fallbacks do Gemini ou corrupção de RPC).
6. **Saúde dos Serviços**: Matriz de disponibilidade relativa de cada agente (`ai_writer`, `ai_embedding`, `social_x`, `social_telegram`, `social_discord`, `social_instagram`).

### 2.2 Abas de Navegação Rápida
- **Todos os Logs (`all`)**: Exibe o fluxo cronológico global de eventos do sistema.
- **Tarefas Não Concluídas (`incomplete`)**: Ativa o filtro indexado `task_completed = false`, priorizando incidentes que demandam triagem humana.
- **Módulos de IA (`ai`)**: Filtra eventos pertencentes a `ai_writer`, `ai_embedding`, `ai_hub` e `game_enricher`.
- **Redes Sociais (`social`)**: Filtra publicações direcionadas ao `social_x`, `social_telegram`, `social_discord` e `social_instagram`.
- **Incidentes Críticos (`critical`)**: Lista apenas registros de nível `critical` e `error`.

### 2.3 Filtros Parametrizados e Busca
- **Busca por Palavra-Chave**: Campo com debounce e sanitização contra injeções que pesquisa simultaneamente em `message`, `action`, `failure_reason_code` e `error_details`.
- **Filtro de Serviço**: Seleção individual de serviços emissores.
- **Filtro de Severidade**: `info`, `warn`, `error` e `critical`.
- **Filtro de Status**: `success`, `failed`, `skipped`, `aborted` e `retry_exhausted`.

### 2.4 Modal de Inspeção Forense e Resolução
Ao clicar no botão de visualização de qualquer linha:
- **Metadados Completos**: Visualização formatada do JSONB de contexto (URLs raspadas, tempos de execução, modelos acionados e tentativas).
- **Stack Trace Sanitizado**: Detalhamento do erro livre de segredos ou tokens com botão de cópia rápida.
- **Botão "Marcar como Resolvido"**: Atualiza o log no banco preenchendo `resolved_at` e `resolved_by = "admin"`, documentando que o operador tratou o incidente.

---

## 3. Dicionário Completo de Códigos de Erro (`failure_reason_code`)

Todos os erros emitidos pelos serviços utilizam identificadores universais padronizados em TypeScript (`FailureReasonCode`). A tabela abaixo cataloga todos os 28 códigos de erro, seu significado técnico, impacto operacional e procedimento de correção recomendado:

| Código de Erro | Significado Técnico | Impacto Operacional | Procedimento de Correção Recomendado |
| :--- | :--- | :--- | :--- |
| `GEMINI_QUOTA_EXCEEDED` | Limite de requisições por minuto (RPM) ou diário (RPD) da API do Google Gemini atingido (HTTP 429). | A matéria atual não é redigida e o cron aguarda o próximo ciclo. | 1. Verificar a cota do projeto no [Google Cloud Console](https://console.cloud.google.com/).<br>2. Se recorrente, solicitar aumento de quota ou ativar billing pré-pago.<br>3. O script aguardará o próximo ciclo agendado para reprocessar o feed. |
| `GEMINI_SAFETY_BLOCK` | Filtros de segurança e moderação do Gemini bloquearam o prompt devido a palavras sensíveis na matéria de origem. | O artigo é descartado pelo agente redator por cautela editorial. | 1. Inspecionar o texto de origem nos metadados do log.<br>2. Se for notícia legítima sobre jogos com violência contextual, ajustar as diretrizes de moderação do modelo no prompt do sistema se necessário.<br>3. Marcar o incidente como resolvido. |
| `GEMINI_FALLBACK_EXHAUSTED` | Falha sucessiva em todos os modelos de IA tentados (ex: Gemini 1.5 Flash -> Fallback -> Falha total). | A notícia não é publicada. | 1. Verificar se a Google Gemini API está passando por instabilidade global via [Google Workspace Status](https://www.google.com/appsstatus).<br>2. Validar a integridade da chave `GEMINI_API_KEY`. |
| `GEMINI_GENERATION_FAILED` | Erro genérico na chamada de geração de texto (HTTP 500, socket timeout ou interrupção de conexão). | Falha temporária na redação do artigo. | O pipeline possui retry automático. Se o erro persistir, verificar a conectividade de saída do servidor e o payload enviado. |
| `EMBEDDING_ALL_MODELS_FAILED` | Falha na geração do vetor de 768 dimensões com `text-embedding-004` e `gemini-embedding-001`. | A matéria não pode ser verificada contra duplicatas no banco de dados e é retida por segurança. | 1. Testar o endpoint de embeddings com uma requisição direta.<br>2. Confirmar se a API Gemini está autorizada para modelos de embedding na sua chave de API. |
| `JSON_SCHEMA_INVALID` | A resposta retornada pelo Gemini não atendeu à estrutura rígida de schema JSON esperada (campos obrigatórios ausentes ou tipos trocados). | A matéria é rejeitada para evitar publicação de dados truncados ou defeituosos no portal. | 1. Revisar os metadados do log para identificar o campo divergente.<br>2. Se o erro ocorrer frequentemente, ajustar o schema de resposta em [scripts/sync-news.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-news.ts). |
| `CONTENT_TOO_SHORT` | O artigo raspado possui menos de 300 caracteres úteis de texto (frequentemente causado por paywalls, galerias ou bloqueios anti-bot). | O artigo é ignorado pela IA para não produzir matérias sem substância ("thin content"). | Nenhuma ação obrigatória. O sistema descarta intencionalmente notas curtas para resguardar a pontuação de qualidade E-E-A-T do portal no Google. |
| `RSS_FEED_UNREACHABLE` | O feed RSS ou Atom da fonte externa não respondeu (timeout de rede, DNS não resolvido ou HTTP 404/500/503). | Nenhuma matéria nova daquela fonte específica é ingerida durante a execução. | 1. Verificar se a URL do feed mudou acessando-a diretamente no navegador.<br>2. Se o site de notícias encerrou o feed RSS, desativar a fonte no banco (`UPDATE sources SET is_active = false WHERE id = ...`). |
| `TWITTER_CREDITS_DEPLETED` | Saldo pré-pago de créditos na conta de desenvolvedor da API do X/Twitter está esgotado (HTTP 402 / Billing Error). | O portal para de postar automaticamente no X, mas continua publicando no site, Telegram e Discord normalmente. | 1. Acessar o [X Developer Portal](https://developer.x.com/) e adicionar créditos ($5 USD mínimo) na aba Billing.<br>2. Executar o teste em `/admin/redes` e reativar o switch de envio. |
| `TWITTER_FORBIDDEN_403` | O X recusou a requisição por falta de permissões (ex: chaves configuradas em modo "Read-Only" ou endpoint restrito). | Postagem no Twitter rejeitada. | 1. Acessar o portal de desenvolvedores do X e verificar se o App possui permissão **"Read and Write"**.<br>2. Se as permissões foram alteradas, gerar novos tokens de acesso (Access Token & Secret) e atualizar no `.env` e Vercel. |
| `TWITTER_RATE_LIMITED` | A cota de postagens por janela de tempo no Twitter foi atingida (HTTP 429). | O tweet é suspenso temporariamente e marcado com retry automático no próximo ciclo. | Aguardar a renovação da janela de rate limit (geralmente 15 minutos a 24 horas no plano Free/Basic). |
| `TWITTER_NOT_CONFIGURED` | As variáveis de ambiente do Twitter não estão presentes ou a chave mestre de envio está desligada em `/admin/redes`. | Publicações no X são ignoradas de forma graciosa (`skipped`). | Se desejar ativar o Twitter, configurar as credenciais no `.env` e ligar o switch no painel `/admin/redes`. |
| `TELEGRAM_PARSE_ERROR` | A mensagem enviada ao Telegram continha caracteres especiais sem escape para a sintaxe `MarkdownV2` ou `HTML` da Telegram Bot API. | O post não chega ao canal do Telegram. | 1. Inspecionar o log para ver o caractere que quebrou a sintaxe (ex: `_`, `*`, `[`, `]`, `(`).<br>2. A função `sanitizeTelegramMessage` trata isso automaticamente, mas caracteres exóticos podem exigir escape adicional. |
| `TELEGRAM_TIMEOUT_ERROR` | Timeout na conexão com os servidores da API do Telegram (`api.telegram.org`). | Envio no Telegram suspenso. | Falha transitória de rede. O sistema tentará novamente no próximo disparo. |
| `TELEGRAM_BLOCKED_ERROR` | O bot foi removido do canal do Telegram ou perdeu a permissão de administrador ("Post Messages"). | O bot não consegue postar no canal do portal. | Acessar as configurações do canal no Telegram, verificar se o `@MadeByAiGamesBot` está na lista de Administradores com permissão de publicar mensagens e fotos. |
| `TELEGRAM_NOT_CONFIGURED` | `TELEGRAM_BOT_TOKEN` ou `TELEGRAM_CHANNEL_ID` ausentes ou switch desativado em `/admin/redes`. | Publicação no Telegram pulada silenciosamente. | Preencher as credenciais no `.env` e ligar o canal em `/admin/redes`. |
| `DISCORD_WEBHOOK_ERROR` | Erro genérico na comunicação com o webhook serverless do Discord. | O alerta comunitário não é entregue ao servidor do Discord. | Testar o webhook através do botão de teste em `/admin/discord`. |
| `DISCORD_BAD_REQUEST_400` | Payload enviado ao webhook do Discord violou os limites da Discord API (ex: embed excedeu 6000 caracteres ou URL de imagem inválida). | Alerta de quebra de notícia ou jogo grátis rejeitado. | Verificar o tamanho do título e do resumo no log para garantir conformidade com as restrições da Discord Webhook API. |
| `DISCORD_NOT_FOUND_404` | A URL do Webhook do Discord foi excluída ou o canal correspondente foi apagado no servidor. | Falha permanente em todos os alertas subsequentes do Discord. | 1. Criar uma nova Integração/Webhook no canal do Discord.<br>2. Atualizar a URL no `.env` e nas configurações em `/admin/discord`. |
| `DISCORD_RATE_LIMITED` | O webhook do Discord recebeu muitas requisições simultâneas em curta janela de tempo (HTTP 429). | O envio é adiado temporariamente respeitando o cabeçalho `Retry-After`. | O sistema aguarda automaticamente o tempo estipulado pela API do Discord antes de nova tentativa. |
| `INSTAGRAM_API_ERROR` | Erro retornado pela Meta Graph API ao publicar imagem ou carrossel no perfil do Instagram. | O conteúdo não é publicado no Instagram. | Verificar validade do token de longa duração da Meta (que expira a cada 60 dias) e permissões da página do Facebook vinculada. |
| `INSTAGRAM_NOT_CONFIGURED` | Credenciais da Meta Graph API ausentes ou desativadas. | Publicação no Instagram pulada de forma não-bloqueante. | Inserir as credenciais quando a integração de mídia social estiver autorizada. |
| `GAMERPOWER_API_ERROR` | A API pública da GamerPower retornou erro HTTP 500, dados malformados ou esteve fora do ar. | O rastreador de jogos grátis não coleta promoções no ciclo atual. | Falha temporária na API externa da GamerPower. O robô reexecutará na próxima janela de 2 horas. |
| `RESEND_BATCH_ERROR` | A API de envio transacional da Resend rejeitou o lote de e-mails da newsletter semanal. | A newsletter não chega aos inscritos. | 1. Acessar o dashboard do [Resend](https://resend.com/) e conferir logs de rejeição.<br>2. Verificar se o domínio possui registros SPF, DKIM e DMARC ativos. |
| `RESEND_KEY_MISSING` | `RESEND_API_KEY` ausente no ambiente ou disparos desabilitados em `/admin/newsletter`. | Disparo da newsletter suspenso por segurança. | Configurar a chave no `.env` e liberar o envio no painel da newsletter. |
| `PGVECTOR_RPC_ERROR` | Falha na execução da função RPC `match_recent_articles` no PostgreSQL (extensão `vector` ausente ou índice indisponível). | A deduplicação vetorial falha, forçando o pipeline a usar fallback de URL única. | Verificar se a extensão `pgvector` e a RPC estão aplicadas no Supabase executando a migração `20260912000001_initial_schema.sql`. |
| `DATABASE_INSERT_ERROR` | Falha ao tentar gravar registro na tabela `posts` ou tabelas satélites do Supabase. | A notícia foi gerada pela IA, mas não foi salva no banco. | 1. Verificar os detalhes técnicos (`error_details`) no log.<br>2. Inspecionar constraints de tamanho, unicidade de slug ou limites de conexão do Supabase. |
| `HUB_SUGGESTION_FAILED` | O agente de IA falhou ao propor ou catalogar automaticamente um novo Hub permanente de jogos. | A matéria é publicada normalmente, mas fica sem vínculo com um Game Hub permanente. | Associar a matéria manualmente a um Hub existente se desejado, ou aguardar o enriquecimento no próximo ciclo. |

---

## 4. Procedimento de Triagem de Tarefas Não Concluídas

Quando o operador acessa `/admin/logs`, o foco prioritário deve ser resolver registros sinalizados na aba **Tarefas Não Concluídas** (`task_completed = false`).

### Passo a Passo de Triagem:

```
Passo 1: Acessar aba "Tarefas Não Concluídas"
         └─ Identificar registros com status 'failed' ou 'retry_exhausted'

Passo 2: Abrir o Modal de Inspeção Forense
         ├─ Avaliar o 'failure_reason_code'
         ├─ Ler a 'message' e 'error_details'
         └─ Verificar o 'metadata' (URL de origem, título do feed e horário)

Passo 3: Aplicar Correção de Acordo com a Causa-Raiz
         ├─ Caso cota de IA (GEMINI_QUOTA_EXCEEDED): aguardar renovação da cota
         ├─ Caso erro de rede (RSS_FEED_UNREACHABLE): testar URL no navegador
         └─ Caso erro de rede social (TWITTER_CREDITS_DEPLETED): recarregar créditos

Passo 4: Reexecutar o Fluxo Manualmente via Terminal/CLI (se aplicável)
         └─ npm run sync:news

Passo 5: Concluir o Atendimento
         └─ Clicar no botão "Marcar como Resolvido" para auditoria técnica
```

### Comandos de Reexecução via Terminal:
Para reexecutar a sincronização imediatamente sem aguardar o cron do GitHub Actions:
```bash
# Executa o pipeline de ingestão e redação de notícias
npm run sync:news

# Executa o bot de promoções e jogos grátis do Discord
npm run deals:discord

# Testa o disparo da newsletter em modo seguro (sem envio real)
npm run newsletter:send -- --dry-run
```

---

## 5. Política de Retenção, Expurgo e Privacidade de Logs

Para evitar o inchaço desnecessário do banco PostgreSQL (`table bloat`), degradação de performance nos índices e conformidade com boas práticas de privacidade:

### 5.1 Regra Geral de Retenção
- **Período Recomendado**: Manter os logs dos **últimos 30 dias** em produção.
- Registros com mais de 30 dias devem ser expurgados periodicamente.

### 5.2 Procedimento de Expurgo Manual no Painel
1. No canto superior direito do painel `/admin/logs`, clique no botão vermelho **"Expurgar Logs Antigos"**.
2. No modal de confirmação, selecione a janela de corte:
   - Manter últimos **15 dias**
   - Manter últimos **30 dias** (recomendado padrão)
   - Manter últimos **60 dias**
   - Manter últimos **90 dias**
3. Confirme a operação. O painel invocará a função RPC `public.purge_old_system_logs(days_to_keep)` no Supabase com permissões `service_role`.
4. Uma notificação verde confirmará o número exato de linhas deletadas do banco de dados.

### 5.3 Expurgo Automático via Supabase / pg_cron (Opcional)
Para automatizar a limpeza sem intervenção manual, pode-se programar a extensão `pg_cron` no Supabase:
```sql
-- Agenda a limpeza diária às 03:00 UTC mantendo os últimos 30 dias
SELECT cron.schedule(
    'purge-ai-logs-daily',
    '0 3 * * *',
    $$ SELECT public.purge_old_system_logs(30); $$
);
```

### 5.4 Privacidade e Proteção de Dados (LGPD & GDPR)
- **Zero Dados Pessoais Identificáveis (PII)**: O sistema de logs de IA não armazena dados de navegação de visitantes, endereços IP de usuários finais ou dados de pagamento.
- **Sanitização Universal Pré-Persistência**: Todas as chamadas à API são filtradas pelo motor sanitizador (`lib/services/logger.ts`), garantindo que nenhuma chave de API, token de bot ou segredo confidencial seja gravado no banco de dados.
