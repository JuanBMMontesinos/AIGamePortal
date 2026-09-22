# Arquitetura de Autenticação Administrativa e Hardening de RLS (Fase 4)

Este documento especifica a arquitetura de segurança implementada na **Fase 4 (Remediação Crítica DevSecOps)** do portal **Made By AI Games** (Next.js 15, Supabase, TypeScript).

---

## 1. Contexto & Vulnerabilidades Eliminadas

Nas versões anteriores do portal, foram identificadas vulnerabilidades de severidade crítica na camada de administração:
1. **Token Estático Previsível**: A constante fixa `aigameportal_admin_authenticated_v1` era utilizada para validar se o usuário possuía acesso administrativo. Qualquer agente malicioso que forjasse o cookie `admin_session` com esse texto obtinha acesso irrestrito aos painéis e APIs administrativas sem fornecer senha.
2. **Senhas Mestras com Fallback Hardcoded**: Caso as variáveis `ADMIN_SECRET_KEY` ou `REVALIDATION_SECRET` não estivessem configuradas, o sistema adotava senhas padrão em texto plano (`aigameportal_admin_2026` e `aigameportal_super_secret_token_2026`).
3. **Autenticação Insegura por Query String (`?key=...`)**: O painel `/admin/metricas` aceitava a chave mestra diretamente na URL, vazando segredos em logs de servidores proxy, histórico de navegadores e cabeçalho HTTP `Referer`.
4. **Vazamento de Webhooks e E-mails no Supabase (RLS Permissivo)**: As tabelas `discord_settings`, `newsletter_settings` e `social_settings` permitiam `SELECT` público para a role `anon`, expondo webhooks do Discord, e-mails de teste e telemetria interna pela API REST do Supabase.

---

## 2. Nova Arquitetura de Sessão Criptografada (HMAC-SHA256)

A autenticação administrativa foi unificada no módulo [`lib/utils/admin-auth.ts`](file:///d:/IAProjects/AIGamePortal/lib/utils/admin-auth.ts).

### 2.1 Estrutura do Token de Sessão

Cada sessão administrativa gera um token dinâmico assinado criptograficamente com **HMAC-SHA256** utilizando a chave mestra `ADMIN_SECRET_KEY` como segredo compartilhado:

```
┌─────────────────────────────────┐   .   ┌─────────────────────────────────┐
│     Base64URL(Payload JSON)     │       │    Base64URL(Assinatura HMAC)   │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

#### Payload:
```json
{
  "role": "admin",
  "iat": 1789226400000,
  "exp": 1789831200000,
  "nonce": "e4f8d9b13c72a0e5b8d2345678abcdef"
}
```

- **`role`**: Perfil estrito `"admin"`.
- **`iat`**: Timestamp milissegundos da emissão do token.
- **`exp`**: Timestamp milissegundos da expiração (tempo de vida estrito de **7 dias** = 604.800 segundos).
- **`nonce`**: Salt criptográfico pseudoaleatório de 16 bytes (`crypto.randomBytes(16)`), garantindo que tokens gerados no mesmo segundo possuam assinaturas únicas e imprevisíveis.

### 2.2 Verificação de Sessão Criptográfica

A validação do token ocorre através de `verifyAdminSessionToken(token)`:
1. Divide o token em `<payloadB64>` e `<signature>`.
2. Computa a assinatura HMAC-SHA256 esperada:
   $$\text{Signature} = \text{HMAC-SHA256}(\text{ADMIN\_SECRET\_KEY}, \text{payloadB64})$$
3. Compara a assinatura fornecida contra a esperada utilizando **`safeConstantTimeCompare()`**, neutralizando Timing Attacks.
4. Decodifica o payload JSON e valida:
   - `payload.role === "admin"`
   - `Date.now() <= payload.exp` (rejeição automática de tokens expirados).
5. Se qualquer etapa falhar, o token é categoricamente rejeitado (`false`).

### 2.3 Atributos de Segurança do Cookie `admin_session`

Ao autenticar com sucesso em `POST /api/admin/auth`, o cookie é gravado com as diretrizes recomendadas pela OWASP:

| Atributo | Configuração | Motivo de Segurança |
| :--- | :--- | :--- |
| `name` | `admin_session` | Identificador padronizado da sessão administrativa. |
| `httpOnly` | `true` | Impede leitura ou furto do cookie via JavaScript cliente (mitiga XSS). |
| `secure` | `process.env.NODE_ENV === "production"` | Exige transmissão exclusiva por canal criptografado HTTPS em produção. |
| `sameSite` | `"lax"` | Protege contra Cross-Site Request Forgery (CSRF). |
| `maxAge` | `604800` (7 dias) | Expiração automática coordenada com o payload do token. |
| `path` | `"/"` | Válido para todas as rotas administrativas `/admin/*` e `/api/admin/*`. |

---

## 3. Eliminação de Senhas Fallback e Auth por Query String

### 3.1 Proibição de Senhas Previsíveis

Foi estabelecida uma regra de código estrita: **Nenhum segredo de segurança pode conter valores padrão (fallback) em texto plano.**

- **`ADMIN_SECRET_KEY`**:
  Caso a variável não esteja configurada no `.env.local` ou nos secrets de produção:
  - O servidor loga um erro de segurança crítico: `[CRITICAL SECURITY] ADMIN_SECRET_KEY não está configurada no ambiente do servidor!`.
  - A API responde com status **`HTTP 500`** e mensagem segura: `"Erro de configuração de segurança: ADMIN_SECRET_KEY não configurada no servidor."`
  - Nenhuma tentativa de login é autorizada.
- **`REVALIDATION_SECRET` / `REVALIDATE_SECRET`**:
  Caso a chave não esteja configurada:
  - O endpoint `/api/revalidate` recusa a requisição com **`HTTP 500`**, bloqueando revalidações não autenticadas.

### 3.2 Descontinuação da Autenticação por Query String

O suporte a `?key=SEU_ADMIN_SECRET_KEY` na rota `/admin/metricas` foi **totalmente removido**:
- O acesso a executivos e administradores agora exige o fluxo de autenticação padrão com cookie seguro assinado.
- Previne que segredos apareçam em logs de proxy, ferramentas de APM, histórico do navegador ou cabeçalhos `Referer` de links externos.

---

## 4. Blindagem de Segredos no Supabase via Row Level Security (RLS)

A migração [`supabase/migrations/20260922000001_harden_admin_settings_rls.sql`](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260922000001_harden_admin_settings_rls.sql) reestruturou o isolamento de dados no banco.

### 4.1 Políticas RLS Atualizadas

| Tabela | Operação | Role Autorizada | Política Implementada |
| :--- | :--- | :--- | :--- |
| `public.discord_settings` | `SELECT` | `service_role` | `Permitir leitura de discord_settings apenas para service_role` |
| `public.discord_settings` | `INSERT / UPDATE` | `service_role` | `Permitir alteracao de settings discord apenas para service_role` |
| `public.newsletter_settings` | `SELECT` | `service_role` | `Permitir leitura de newsletter_settings apenas para service_role` |
| `public.newsletter_settings` | `INSERT / UPDATE` | `service_role` | `Permitir alteracao de settings apenas para service_role` |
| `public.social_settings` | `SELECT` | `service_role` | `Permitir leitura de social_settings apenas para service_role` |
| `public.social_settings` | `INSERT / UPDATE` | `service_role` | `Permitir alteracao de settings de redes sociais apenas para service_role` |

### 4.2 Views e Funções Seguras para Consulta Pública

Para que a interface do usuário possa verificar se a newsletter está ativa sem expor colunas confidenciais (`test_recipient_email`, `last_dispatch_log`), foi criada a view:

```sql
CREATE OR REPLACE VIEW public.public_newsletter_status AS
SELECT
    id,
    is_enabled,
    sender_name,
    created_at,
    updated_at
FROM public.newsletter_settings;

GRANT SELECT ON public.public_newsletter_status TO anon, authenticated, service_role;
```

E a RPC `public.get_newsletter_public_status()` com execução `SECURITY DEFINER` e `search_path = public`.

---

## 5. Mascaramento Mandatório em APIs Administrativas

Mesmo para administradores autenticados, as APIs não devem retornar Webhook URLs e chaves privadas completas para o navegador, reduzindo a superfície de exposição no tráfego de rede e DevTools:

- Em `GET /api/admin/discord` e `PATCH /api/admin/discord`:
  `deals_webhook_url` e `news_webhook_url` são higienizados por `maskDiscordWebhookUrl()`, convertendo:
  - Entrada: `https://discord.com/api/webhooks/1234567890/aBcDeFgHiJkLmNoPqRsTuVwXyZ`
  - Saída: `https://discord.com/api/webhooks/1234567890/aBcD...XyZ`
- Em `GET /api/admin/social`:
  Tokens de acesso e chaves de API do X e Telegram são apresentados com máscara (`maskSecretKey()`): `74ub...AzR`.

---

## 6. Checklist de Homologação da Fase 4

- [x] Eliminação completa do token estático `aigameportal_admin_authenticated_v1` em 100% dos arquivos.
- [x] Utilização exclusiva de `isServerAdminAuthenticated()` em todos os Server Components e Route Handlers.
- [x] Eliminação de fallbacks em texto plano de `ADMIN_SECRET_KEY` e `REVALIDATION_SECRET`.
- [x] Remoção da autenticação por query string `?key=` em `/admin/metricas`.
- [x] Criação da migration RLS revogando `SELECT` para `anon` em tabelas de settings.
- [x] Mascaramento de Webhook URLs do Discord nas respostas JSON das rotas administrativas.
- [x] Validação com testes automatizados (`scratch/test-phase4-security.ts`) e build limpo (`npm run build`).
