# Hardening de Segurança — Fase 5 (Prevenção de Spoofing, Honeypot Anti-Spam & Headers ISR)

Este documento detalha as medidas de segurança cibernética e DevSecOps implementadas durante a **Fase 5** do plano de hardening do portal **Made By AI Games** (Next.js 15, TypeScript, Tailwind CSS).

---

## 1. Prevenção contra IP Spoofing no Rate Limiter

### 1.1 Diagnóstico do Problema
O utilitário de rate limiting ([lib/utils/rate-limit.ts](file:///d:/IAProjects/AIGamePortal/lib/utils/rate-limit.ts)) inspeciona a requisição HTTP recebida para extrair o endereço IP do cliente através da função `getClientIp(request: NextRequest)`.

Anteriormente, a função avaliava o cabeçalho `x-forwarded-for` **antes** de `cf-connecting-ip`:
```typescript
// Implementação vulnerável anterior
const forwarded = request.headers.get("x-forwarded-for");
if (forwarded) {
  const firstIp = forwarded.split(",")[0].trim();
  if (firstIp) return firstIp;
}
// cf-connecting-ip só era avaliado depois...
```

**Vetor de Ataque**:
Em infraestruturas sob Cloudflare ou outros proxies reversos, o cabeçalho `X-Forwarded-For` enviado pelo cliente malicioso pode ser apenas anexado ou repassado dependendo das regras de reescrita do proxy. Um atacante poderia enviar cabeçalhos forjados arbitrários (ex: `X-Forwarded-For: 203.0.113.1`, `X-Forwarded-For: 203.0.113.2`, etc.) a cada requisição, gerando novas chaves de rate limit no Redis ou na memória (`ratelimit:rl:203.0.113.x`), contornando completamente os bloqueios 429.

### 1.2 Remediação e Nova Precedência Estrita
A função foi reestruturada para seguir a hierarquia de confiança de borda para origem:

```typescript
export function getClientIp(request: NextRequest): string {
  // 1. Cloudflare (maior prioridade: CDN autoritativa de borda)
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  // 2. Proxy reverso direto confiável (Nginx, Vercel x-real-ip)
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  // 3. X-Forwarded-For (sanitizado, primeiro IP da cadeia de proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    // Remove possível sufixo de porta (ex: "192.168.1.1:8080" -> "192.168.1.1")
    const cleanIp = firstIp.replace(/:\d+$/, "").trim();
    if (cleanIp) return cleanIp;
  }

  // 4. Fallback local seguro
  return "127.0.0.1";
}
```

### 1.3 Tabela de Hierarquia de Confiança

| Ordem | Cabeçalho | Confiança | Justificativa |
| :---: | :--- | :---: | :--- |
| **1º** | `cf-connecting-ip` | **Máxima** | Sobrescrito obrigatoriamente pela borda da Cloudflare. Clientes externos não conseguem falsificar este valor quando o tráfego passa pela CDN. |
| **2º** | `x-real-ip` | **Alta** | Injetado por proxies reversos diretos (como Nginx via `proxy_set_header X-Real-IP $remote_addr` ou Vercel Edge). |
| **3º** | `x-forwarded-for` | **Média** | Utilizado apenas na ausência dos anteriores. Extrai o primeiro endereço da lista e sanitiza eventuais sufixos de porta `:port`. |
| **4º** | `127.0.0.1` | **Fallback** | Garante que requisições locais ou em ambientes de desenvolvimento nunca resultem em `undefined` ou `null`. |

---

## 2. Honeypot Anti-Spam na Newsletter

### 2.1 Princípio de Funcionamento
Bots de spam e web crawlers automatizados costumam iterar sobre os elementos `<form>` do DOM e preencher todos os campos do tipo `<input>` para maximizar as chances de submissão com sucesso.

A estratégia de **Honeypot** introduz um campo invisível para usuários humanos legítimos, mas detectável e preenchível por robôs.

### 2.2 Camada de Interface (`components/NewsletterBox.tsx`)
No formulário da newsletter, foi adicionado um campo com nome atrativo para bots (`website_url_hp`):

```tsx
{/* Campo Honeypot Anti-Spam (invisível para humanos, atrai bots automatizados) */}
<div
  className="sr-only absolute -left-[9999px] opacity-0 pointer-events-none"
  aria-hidden="true"
>
  <label htmlFor={`newsletter-hp-${variant}`}>Website URL</label>
  <input
    id={`newsletter-hp-${variant}`}
    type="text"
    name="website_url_hp"
    value={honeypot}
    onChange={(e) => setHoneypot(e.target.value)}
    tabIndex={-1}
    autoComplete="off"
  />
</div>
```

**Propriedades de Ocultação Aplicadas**:
- `sr-only`: Esconde visualmente usando padrões de acessibilidade.
- `absolute -left-[9999px]`: Posiciona fora do viewport visível.
- `opacity-0 pointer-events-none`: Impede cliques ou foco acidental.
- `tabIndex={-1}`: Impede que navegadores foquem no campo ao pressionar a tecla `Tab`.
- `aria-hidden="true"`: Oculta de leitores de tela assistivos, evitando confusão para usuários com deficiência visual.
- `autoComplete="off"`: Impede que gerenciadores de preenchimento automático preencham o campo inadvertidamente.

### 2.3 Camada de API & Descarte Silencioso (`app/api/newsletter/subscribe/route.ts`)
Quando uma requisição é recebida:
1. O backend inspeciona o valor de `body.website_url_hp` (ou alias `body.hp`).
2. Se qualquer valor de string preenchida for detectado:
   - Um alerta é registrado no servidor: `[Newsletter Subscribe] Bot detectado via honeypot field ("..."). Descarte silencioso executado.`
   - O endpoint responde com **HTTP 200 OK** e mensagem de sucesso idêntica à normal (`🎉 Inscrição confirmada!`).
   - O processamento é abortado imediatamente: **nenhuma consulta ao banco**, **nenhuma inserção no Supabase** e **nenhum disparo de e-mail**.

### 2.4 Benefícios do Descarte Silencioso (*Silent Discard*)
- **Enganação do Bot**: O bot acredita que obteve êxito e não altera seus parâmetros nem tenta técnicas mais agressivas de evasão.
- **Economia de Banco de Dados**: Poupa operações de leitura/escrita e conexões no pool do PostgreSQL/Supabase.
- **Proteção de Quota de E-mail**: Evita o envio de confirmações para caixas de correio inexistentes ou spamtrap que poderiam degradar a reputação do domínio no Resend.

---

## 3. Autenticação por Cabeçalhos HTTP na Revalidação ISR (`/api/revalidate`)

### 3.1 Risco do Método Anterior (Query String)
Anteriormente, o endpoint `/api/revalidate` exigia o segredo passado exclusivamente como parâmetro na URL:
```text
POST /api/revalidate?secret=MEU_SEGREDO_SUPER_CRITICO&slug=minha-materia
```

**Problemas de Segurança em Query String**:
1. **Logs de Servidor e CDN**: URLs completas com query strings são gravadas em texto plano nos logs de acesso de servidores web (Nginx, Apache), proxies, balanceadores e CDNs.
2. **Histórico de Navegadores e Ferramentas**: Ficam armazenadas no histórico de requisições do navegador ou de ferramentas de teste.
3. **Cabeçalhos `Referer`**: Podem vazar se o endpoint redirecionar ou carregar recursos de terceiros.
4. **Visibilidade em Ferramentas de APM/Tracing**: Datadog, Sentry ou CloudWatch gravam a URL da requisição.

### 3.2 Suporte a Cabeçalhos HTTP Seguros
O endpoint [app/api/revalidate/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/revalidate/route.ts) agora suporta extração em 3 níveis:

1. **`x-revalidate-secret`**: Cabeçalho dedicado HTTP (Recomendado).
2. **`Authorization: Bearer <token>`**: Padrão RFC 6750 de autorização via Bearer Token.
3. **`?secret=<token>`**: Query string legada (mantida estritamente para compatibilidade retroativa com fluxos legados).

```typescript
// 1. Extração do token de autenticação
let secret = request.headers.get("x-revalidate-secret")?.trim() || null;

if (!secret) {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    secret = authHeader.slice(7).trim();
  }
}

if (!secret) {
  secret = searchParams.get("secret");
}
```

### 3.3 Mitigação de Timing Attacks
A validação utiliza a função utilitária `safeConstantTimeCompare(secret, expectedSecret)` de [lib/utils/security.ts](file:///d:/IAProjects/AIGamePortal/lib/utils/security.ts):
- Converte ambos os valores para hashes SHA-256 de comprimento fixo (32 bytes).
- Executa `crypto.timingSafeEqual()`, impedindo que atacantes descubram a chave medindo tempos de resposta microssegundo a microssegundo.

### 3.4 Exemplos de Utilização Segura

#### Exemplo com `x-revalidate-secret` (Recomendado):
```bash
curl -X POST "https://madebyai.games/api/revalidate?slug=materia-gamer" \
  -H "x-revalidate-secret: SEU_REVALIDATION_SECRET"
```

#### Exemplo com `Authorization: Bearer`:
```bash
curl -X POST "https://madebyai.games/api/revalidate?path=/" \
  -H "Authorization: Bearer SEU_REVALIDATION_SECRET"
```

---

## 4. Matriz de Conformidade da Fase 5

| Requisito | Status | Implementação | Arquivo de Origem |
| :--- | :---: | :--- | :--- |
| **Prevenção de IP Spoofing** | ✅ Concluído | Ordem: `cf-connecting-ip` -> `x-real-ip` -> `x-forwarded-for` -> `127.0.0.1` | [rate-limit.ts](file:///d:/IAProjects/AIGamePortal/lib/utils/rate-limit.ts) |
| **Honeypot na UI** | ✅ Concluído | Campo `website_url_hp` invisível com `aria-hidden` e `tabIndex={-1}` | [NewsletterBox.tsx](file:///d:/IAProjects/AIGamePortal/components/NewsletterBox.tsx) |
| **Silent Discard de Bots** | ✅ Concluído | Resposta 200 simulada sem escrita em BD/Resend | [app/api/newsletter/subscribe/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/newsletter/subscribe/route.ts) |
| **Auth por Headers ISR** | ✅ Concluído | `x-revalidate-secret` e `Authorization: Bearer` com `safeConstantTimeCompare` | [app/api/revalidate/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/revalidate/route.ts) |
| **Retrocompatibilidade** | ✅ Concluído | Suporte contínuo a `?secret=` mantido para fluxos legados do n8n | [routes-and-isr.md](file:///d:/IAProjects/AIGamePortal/docs/routes-and-isr.md) |
