# Painel Administrativo do Discord (`/admin/discord`) — AIGamePortal

O **Painel Administrativo do Discord** é a central de comando dedicada e isolada para controle, auditoria e homologação de todos os envios automatizados para o **Discord** no **AIGamePortal**.

---

## 1. Princípios de Arquitetura e Segurança

1. **Isolamento de Módulos**: O painel do Discord opera em rota própria (`/admin/discord`), sem compartilhar formulários, tabelas ou rotas de API com os painéis de Afiliados (`/admin/afiliados`) ou Newsletter (`/admin/newsletter`).
2. **Padrão de Segurança (Safety-First / Disabled by Default)**:
   - Por diretriz estrita, **todos os disparos para o Discord iniciam desabilitados por padrão** (`is_deals_enabled = false` e `is_news_enabled = false`).
   - Nenhum alerta é enviado ao Discord até que o administrador ative expressamente a chave correspondente no painel.
3. **Autenticação Unificada por Sessão**:
   - Acesso restrito via `ADMIN_SECRET_KEY`.
   - Emissão de cookie seguro `admin_session` (`HttpOnly, SameSite=Strict`).
4. **Proteção Contra Indexação (SEO)**:
   - Metatags explícitas: `robots: { index: false, follow: false }`.
   - Renderização dinâmica do servidor: `export const dynamic = "force-dynamic"`.

---

## 2. Estrutura de Arquivos

```
AIGamePortal/
├── app/
│   ├── admin/
│   │   └── discord/
│   │       ├── page.tsx                 # Server Component com verificação de sessão e SSR
│   │       ├── login-form.tsx           # Formulário gamer de login por senha mestra
│   │       └── admin-view.tsx           # Interface reativa com switches, testes e tabela
│   └── api/
│       └── admin/
│           └── discord/
│               └── route.ts             # API REST (GET dados, PATCH toggles, POST testes)
├── lib/
│   └── data/
│       └── discord-admin.ts             # Camada de dados e telemetria para o painel
├── supabase/
│   └── migrations/
│       └── 20260916000005_discord_settings.sql # Tabela discord_settings com padrão desabilitado
└── docs/
    └── admin-discord.md                 # Esta documentação
```

---

## 3. Funcionalidades do Painel

### 3.1 Chaves Mestras de Habilitação (Toggles Independentes)

O painel oferece controle granular e desacoplado para as duas frentes de automação:

| Automação | Switch de Controle | Comportamento quando Desabilitado |
| :--- | :---: | :--- |
| **Jogos Grátis (Deals)** | Liga / Desliga | O cron a cada 2 horas executa a checagem, detecta a pausa, registra o motivo no banco com status `skipped` e encerra sem disparar webhooks. |
| **Breaking News (5/5)** | Liga / Desliga | O pipeline de ingestão de notícias publica o artigo no site normalmente, mas ignora o disparo de alerta para o Discord. |

- **Campo de Motivo/Justificativa**: Permite registrar o motivo da pausa (ex: *"Pausado temporariamente para manutenção no servidor do Discord"*), que é gravado em banco e exibido nos logs do sistema.

### 3.2 Diagnóstico e Disparo de Testes Controlados

Permite homologar os canais do Discord em tempo real sem depender de novas notícias ou promoções externas:
- **Exibição Protegida de Webhooks**: As URLs configuradas em `DISCORD_WEBHOOK_FREE_GAMES` e `DISCORD_WEBHOOK_NEWS` são exibidas com mascaramento seguro de tokens (ex: `https://discord.com/api/webhooks/1234.../ab***yz`).
- **Botão "Disparar Alerta de Teste (Deals)"**: Envia um Rich Embed esmeralda formatado com capa promocional e botões de resgate para certificar a entrega no canal de promoções.
- **Botão "Disparar Alerta de Teste (News)"**: Envia um Rich Embed vermelho de Breaking News urgente para homologar o canal de plantão jornalístico.

### 3.3 Cards de Indicadores (KPIs)

- **Total de Ofertas Notificadas**: Contagem exata de registros na tabela `free_games_history`.
- **Último Ciclo de Jogos Grátis**: Data/hora formatada em PT-BR e status da última execução (`idle`, `success`, `failed` ou `skipped`).
- **Frequência do Cron**: Indicação da rotina no GitHub Actions (a cada 2 horas).

### 3.4 Histórico e Auditoria de Ofertas

- Tabela interativa com busca em tempo real por título do jogo ou plataforma.
- Exibe miniatura da capa, título, ID da promoção no GamerPower, plataforma (Steam, Epic, etc.), valor original e data do envio.
- Link direto para abertura da oferta original na loja.
- Paginação com 15 itens por página.

---

## 4. Integração com Scripts e Pipelines

### 4.1 Script de Jogos Grátis (`scripts/discord-bot.ts`)
Antes de varrer a API externa, o script consulta `public.discord_settings`:
```bash
# Execução normal (bloqueia se desabilitado no painel)
npm run deals:discord

# Simulação forçada para testes locais (ignora a chave mestre apenas para preview no terminal)
npx tsx scripts/discord-bot.ts --dry-run
```

Ao concluir ou ser pausado, o script registra automaticamente o status (`success`, `failed` ou `skipped`) e o log detalhado em `discord_settings`.

### 4.2 Pipeline de Notícias (`scripts/sync-news.ts`)
No Passo G.1, quando uma notícia tem impacto nível 5/5, o script verifica se `is_news_enabled === true` antes de enviar o webhook.

---

## 5. Como Acessar o Painel

1. Inicie o servidor local:
   ```bash
   npm run dev
   ```
2. Abra no navegador: [http://localhost:3000/admin/discord](http://localhost:3000/admin/discord).
3. Digite sua senha mestra de administrador (`ADMIN_SECRET_KEY` configurada no `.env.local`).
4. Ative os switches de envio desejados e clique em **"Salvar Configurações de Envio"**.
