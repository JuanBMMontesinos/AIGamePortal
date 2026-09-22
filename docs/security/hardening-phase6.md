# Hardening de Segurança — Fase 6 (Eliminação de Fallback Hardcoded & Anti-Click Fraud)

Este documento detalha as medidas de segurança cibernética e integridade de dados implementadas durante a **Fase 6** do plano de hardening do portal **Made By AI Games** (Next.js 15, TypeScript, Tailwind CSS, Supabase).

---

## 1. Eliminação de Fallback Hardcoded em Tokens de Descadastro (CWE-798)

### 1.1 Diagnóstico do Problema
O módulo criptográfico ([lib/utils/security.ts](file:///d:/IAProjects/AIGamePortal/lib/utils/security.ts)) gerencia a assinatura e verificação de tokens HMAC-SHA256 para links de cancelamento de newsletter (*unsubscribe*).

Anteriormente, a função `getUnsubscribeSecret()` apresentava uma chave padrão estática como último fallback:
```typescript
// Implementação vulnerável anterior
function getUnsubscribeSecret(): string {
  return (
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "aigameportal_newsletter_unsubscribe_secret_default" // ❌ VULNERABILIDADE CWE-798
  );
}
```

**Vetor de Ataque**:
Caso uma instância fosse executada sem as variáveis de ambiente devidamente configuradas ou durante falha transitória no carregamento de env vars, a aplicação recorreria silenciosamente à string pública `"aigameportal_newsletter_unsubscribe_secret_default"`.
Qualquer atacante que consultasse o código-fonte ou repositório poderia calcular tokens HMAC-SHA256 válidos para qualquer endereço de e-mail alvo:
$$\text{token} = \text{HMAC-SHA256}(\text{"aigameportal\_newsletter\_unsubscribe\_secret\_default"}, \text{email})$$
Isso permitiria desinscrever em lote assinantes legítimos de forma não autorizada e forjada via `POST /api/newsletter/unsubscribe`.

### 1.2 Remediação e Filosofia *Fail-Closed*
A string estática de fallback foi totalmente removida. A nova arquitetura adota uma hierarquia estrita de segredos e recusa qualquer operação criptográfica caso nenhuma chave seja detectada (*fail-closed*):

```typescript
function getUnsubscribeSecret(): string {
  const secret = (
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

  if (!secret) {
    console.error(
      "[Security CRITICAL] Nenhum segredo configurado para tokens de cancelamento de newsletter. " +
        "Defina NEWSLETTER_UNSUBSCRIBE_SECRET, ADMIN_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY."
    );
    return "";
  }

  return secret;
}
```

### 1.3 Proteção em `generateUnsubscribeToken` e `verifyUnsubscribeToken`
As funções geradora e validadora foram atualizadas para verificar a presença de segredo válido antes de instanciar a rotina criptográfica:

```typescript
export function generateUnsubscribeToken(email: string): string {
  if (!email || typeof email !== "string") return "";
  const secret = getUnsubscribeSecret();
  if (!secret) {
    console.error("[Security] Geração de token de cancelamento abortada: segredo ausente.");
    return "";
  }
  const normalized = email.trim().toLowerCase();
  return crypto.createHmac("sha256", secret).update(normalized).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token || typeof email !== "string" || typeof token !== "string") {
    return false;
  }
  const secret = getUnsubscribeSecret();
  if (!secret) {
    console.error("[Security] Verificação de token de cancelamento abortada: segredo ausente.");
    return false;
  }
  const expectedToken = generateUnsubscribeToken(email);
  if (!expectedToken) return false;
  return safeConstantTimeCompare(token.trim(), expectedToken);
}
```

### 1.4 Hierarquia de Resolução de Segredos

| Prioridade | Variável de Ambiente | Descrição |
| :---: | :--- | :--- |
| **1º** | `NEWSLETTER_UNSUBSCRIBE_SECRET` | Chave dedicada isolada exclusivamente para assinatura de newsletter. |
| **2º** | `ADMIN_SECRET_KEY` | Chave mestra de autenticação do portal. |
| **3º** | `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço interna do Supabase. |
| **Fallback** | *(Nenhum - Erro Crítico)* | Retorna string vazia e recusa geração/validação de tokens. |

---

## 2. Rate Limiting e Prevenção contra Click Fraud nos Redirecionamentos de Afiliados

### 2.1 Diagnóstico do Problema
Os endpoints de redirecionamento comercial:
- `GET /api/out/[id]` (redirecionamento de produto afiliado individual)
- `GET /api/out/search` (fallback de busca inteligente na loja parceira)

Anteriormente não possuíam controle de taxa de requisições por IP.

**Vetores de Risco**:
1. **Click Fraud**: Bots automatizados clicando repetidamente em links comerciais para inflar métricas artificiais de engajamento.
2. **Denial of Service (DoS) no Banco**: Cada clique iniciava uma gravação assíncrona na tabela `affiliate_clicks`. Um disparo em massa por robôs poderia exaurir as conexões do banco de dados relacional.
3. **Penalidades por Redirecionamento Abusivo**: Lojas parceiras (como a Amazon) podem suspender contas de associados caso identifiquem rajadas suspeitas de cliques robotizados sem tráfego humano correspondente.

### 2.2 Remediação e Aplicação de Limites
Ambas as rotas foram integradas ao utilitário de rate limiting ([lib/utils/rate-limit.ts](file:///d:/IAProjects/AIGamePortal/lib/utils/rate-limit.ts)):

- **Limite Aplicado**: Máximo de **30 requisições por minuto por IP**.
- **Sliding Window Log**: Janela deslizante de 60 segundos com suporte automático a Upstash Redis (se configurado) e fallback in-memory de alta performance com GC oportunista.
- **Detecção de IP Segura**: Utiliza a precedência anti-spoofing implementada na Fase 5 (`cf-connecting-ip` -> `x-real-ip` -> `x-forwarded-for`).
- **Resposta Padronizada RFC 6585**: Em caso de excesso, retorna HTTP 429 Too Many Requests com cabeçalhos explicativos:
  ```http
  HTTP/1.1 429 Too Many Requests
  Content-Type: application/json
  Retry-After: 60
  X-RateLimit-Limit: 30
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1727025600
  ```
- **Neutralização de Inserção**: O bloqueio ocorre antes da chamada `recordAffiliateClick`, garantindo que **nenhuma** linha seja gravada em `affiliate_clicks` quando o rate limit estiver ativo.

---

## 3. Prevenção contra Open Redirect e Execução de Esquemas Inseguros em `/api/out/[id]`

### 3.1 Diagnóstico do Problema
O endpoint `/api/out/[id]` realiza um redirecionamento HTTP 307 para o endereço configurado em `product.affiliate_url`.
Caso uma URL cadastrada no banco de dados sofresse adulteração ou contivesse esquemas não-web (ex: `javascript:alert(1)`, `data:text/html,...`, `file:///...`), a aplicação poderia expor os leitores a vulnerabilidades de XSS ou Open Redirect arbitrário.

### 3.2 Remediação
Antes de despachar o redirecionamento HTTP 307, a URL de destino é submetida a uma validação estrita via `new URL()` nativo:

```typescript
// Validação estrita de protocolo de URL de destino (mitigação de Open Redirect e XSS)
const rawAffiliateUrl = product.affiliate_url.trim();
let destinationUrl: string;

try {
  const parsedUrl = new URL(rawAffiliateUrl);
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error(`Protocolo não permitido: ${parsedUrl.protocol}`);
  }
  destinationUrl = parsedUrl.toString();
} catch {
  console.warn(`[Affiliate Out] URL de afiliado malformada ou protocolo inseguro para id ${cleanId}: ${rawAffiliateUrl}`);
  return NextResponse.redirect(new URL("/", siteUrl), { status: 307 });
}
```

Se o protocolo for inseguro ou a URL for inválida, a requisição é desviada com segurança para a página inicial (`/`), impedindo qualquer ataque.

---

## 4. Matriz de Conformidade

| Requisito de Segurança | Status Anterior | Status Fase 6 | Nível de Mitigação |
| :--- | :---: | :---: | :---: |
| Chave estática padrão de unsubscribe | 🔴 Vulnerável (CWE-798) | 🟢 Eliminada (Fail-Closed) | Completo |
| Rate Limiting em `/api/out/[id]` | 🔴 Inexistente | 🟢 30 req/min por IP | Completo |
| Rate Limiting em `/api/out/search` | 🔴 Inexistente | 🟢 30 req/min por IP | Completo |
| Click Fraud / DoS em `affiliate_clicks` | 🔴 Suscetível a flood | 🟢 Interceptação pré-DB | Completo |
| Validação de esquema em redirect de afiliados | 🟡 Parcial (apenas string) | 🟢 Estrito (http/https via new URL) | Completo |
| Documentação em `.env.example` | 🟡 Chave não listada | 🟢 Documentada | Completo |
