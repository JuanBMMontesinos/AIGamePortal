# Hardening de Segurança — Fase 1 (Remediação de Vulnerabilidades & Proteções Básicas)

Este documento registra todas as alterações e proteções técnicas implementadas durante a **Fase 1** do plano de segurança cibernética do portal **Made By AI Games** (Next.js 15, React 19, TypeScript, Tailwind CSS).

---

## 1. Atualização e Resolução de Dependências (PostCSS & Next.js)

### Diagnóstico Inicial
A auditoria via `npm audit` apontava vulnerabilidades de severidade alta e moderada na versão interna de PostCSS empacotada pelo framework Next.js:
- **GHSA-qx2v-qp2m-jg93**: XSS potencial via tags `</style>` não escapadas na saída do stringifier.
- **GHSA-6g55-p6wh-862q** e **GHSA-fxqj-rqcc-2cmp**: Leitura arbitrária de arquivos através de `sourceMappingURL` controlado pelo usuário em comentários CSS.
- **GHSA-r28c-9q8g-f849**: Path Traversal no carregamento automático de source maps prévios.

### Resolução Aplicada
A tentativa de correção automática via `npm audit fix --force` sugeria atualizar para o canary do Next 16, o que causaria *breaking changes* severas no projeto.
A remediação segura foi aplicada declarando **overrides** no `package.json`:
```json
{
  "devDependencies": {
    "postcss": "^8.5.28"
  },
  "overrides": {
    "postcss": "^8.5.28"
  }
}
```
Com isso, o gerenciador de pacotes dedupilou todas as instâncias dependentes (`next`, `tailwindcss`, `autoprefixer`) para a versão corrigida `8.5.28`, resultando em:
```bash
found 0 vulnerabilities
```

---

## 2. Cabeçalhos HTTP de Segurança & Content Security Policy (CSP)

Configurados em `next.config.ts` no hook `async headers()` para a rota global `/:path*`:

### 2.1 Cabeçalhos Adicionados

| Cabeçalho | Valor Configurado | Justificativa Técnica |
| :--- | :--- | :--- |
| **`Strict-Transport-Security`** (HSTS) | `max-age=31536000; includeSubDomains; preload` | Força navegadores a utilizarem estritamente conexões HTTPS seguras durante 1 ano (31536000s), incluindo subdomínios, prevenindo ataques de Man-in-the-Middle (MitM) e degradação de protocolo (SSL Stripping). |
| **`Permissions-Policy`** | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Desativa o acesso de APIs sensíveis do navegador não utilizadas pela aplicação (câmera, microfone e geolocalização), além de bloquear rastreamento de coortes FLoC (`interest-cohort`). |
| **`X-Content-Type-Options`** | `nosniff` | Impede que navegadores realizem MIME-sniffing de recursos, forçando o respeito estrito ao tipo declarado no `Content-Type`. |
| **`X-Frame-Options`** | `SAMEORIGIN` | Evita ataques de Clickjacking ao impedir que as páginas do portal sejam incorporadas em `<frame>` ou `<iframe>` de domínios externos. |
| **`Referrer-Policy`** | `strict-origin-when-cross-origin` | Envia a URL completa apenas em navegações internas (same-origin), enviando apenas a origem em requisições HTTPS externas e omitindo em conexões HTTP. |
| **`Content-Security-Policy`** | *(Ver detalhamento abaixo)* | Restringe as origens autorizadas para carregamento de scripts, estilos, mídias, conexões de API e iframes. |

### 2.2 Justificativa de Cada Diretiva da CSP

```text
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://tpc.googlesyndication.com https://ep1.adtrafficquality.google;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https://images.unsplash.com https://*.steamstatic.com https://*.steampowered.com https://*.playstation.com https://*.xbox.com https://*.nintendo.com https://*.nintendolife.com https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://*.epicgames.com https://media.rawg.io https://images.igdb.com https://*.pcgamer.com https://*.eurogamer.net https://*.gamesindustry.biz https://*.ign.com https://*.gamespot.com https://*.polygon.com https://*.videogameschronicle.com https://gematsu.com https://*.gematsu.com https://*.rockpapershotgun.com https://*.destructoid.com https://preview.redd.it https://i.redd.it https://external-preview.redd.it https://*.gamespress.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https:;
connect-src 'self' https://*.supabase.co https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://rawg.io https://api.rawg.io;
frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://pagead2.googlesyndication.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self';
upgrade-insecure-requests;
```

1. **`default-src 'self'`**: Qualquer recurso não explicitado tem como padrão o bloqueio ou permissão estrita apenas da própria origem.
2. **`script-src`**:
   - `'self'`: Permite scripts compilados do Next.js.
   - `'unsafe-inline'` / `'unsafe-eval'`: Necessário para scripts de hidratação do React, temas (next-themes) e bibliotecas de runtime.
   - `https://pagead2.googlesyndication.com`, `https://adservice.google.com`, `https://www.googletagservices.com`, `https://tpc.googlesyndication.com`, `https://ep1.adtrafficquality.google`: SDK do Google AdSense, telemetria de qualidade de anúncios e Google Publisher Tags.
3. **`style-src`**:
   - `'self'`: Folhas de estilo da aplicação.
   - `'unsafe-inline'`: Estilos injetados em runtime pelo Next.js/Tailwind CSS e transições de tema escuro/claro.
   - `https://fonts.googleapis.com`: Folhas de estilo de fontes do Google.
4. **`font-src`**:
   - `'self'` e `https://fonts.gstatic.com`: Permite arquivos WOFF2 de fontes (`Inter`, `Outfit`).
   - `data:`: Fontes embutidas em base64.
5. **`img-src`**:
   - `'self'`, `data:`, `blob:`: Imagens locais, ícones SVG em data-uri e miniaturas dinâmicas.
   - CDNs Oficiais: Unsplash, Steam (`steamstatic.com`), PlayStation (`playstation.com`), Xbox (`xbox.com`), Nintendo (`nintendo.com`, `nintendolife.com`), Amazon (`media-amazon.com`), Epic Games, RAWG e veículos de mídia de games.
   - `https:`: Permite imagens remotas de novos feeds RSS agregados sem quebra de exibição.
   - `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`: Pixels e criativos do AdSense.
6. **`connect-src`**:
   - `'self'`: APIs locais do Next.js.
   - `https://*.supabase.co`: Comunicação segura com o banco PostgreSQL / Supabase REST e Auth.
   - Google AdSense: Telemetria de impressões e cliques.
   - `https://rawg.io`, `https://api.rawg.io`: Enriquecimento de metadados de jogos.
7. **`frame-src`**:
   - Permite os iframes de entrega de criativos do Google AdSense (`googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, `www.google.com`, `pagead2.googlesyndication.com`).
8. **`object-src 'none'`**:
   - Neutraliza completamente a execução de plugins legados do navegador (Flash, Java Applets).
9. **`base-uri 'self'`**:
   - Impede injeção de tags `<base href="...">` que redirecionem requisições relativas para domínios maliciosos.
10. **`form-action 'self'`**:
    - Garante que envios de formulários (como cadastro de newsletter ou login administrativo) só sejam enviados para o próprio domínio.
11. **`frame-ancestors 'self'`**:
    - Equivalente e sucessor do `X-Frame-Options`, impedindo que terceiros embutam o portal em iframes.
12. **`upgrade-insecure-requests`**:
    - Solicita que navegadores convertam automaticamente links legados `http://` para `https://`.

---

## 3. Mitigação de Timing Attacks (`safeConstantTimeCompare`)

### Fundamentação Teórica
Operadores tradicionais de comparação (`===`, `!==`) realizam saída prematura (*early exit*) no primeiro caractere divergente. Um invasor enviando requisições automatizadas consegue mensurar variações de tempo de processamento na ordem de microssegundos/nanossegundos para descobrir chaves de acesso caractere por caractere.

Adicionalmente, a função nativa `crypto.timingSafeEqual` do Node.js requer que ambos os buffers de entrada tenham **exatamente o mesmo tamanho**, lançando uma exceção `RangeError: Input buffers must have the same length` se forem de comprimentos distintos. Testar comprimentos previamente com `a.length !== b.length` vazaria o tamanho exato da chave.

### Implementação em `lib/utils/security.ts`
Para garantir tempo estritamente constante independentemente do comprimento do input, implementamos a técnica de **pré-hashing com SHA-256**:

```typescript
import crypto from "crypto";

export function safeConstantTimeCompare(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Gera digests SHA-256 de tamanho estritamente fixo (32 bytes)
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();

  return crypto.timingSafeEqual(hashA, hashB);
}
```

### Onde a Função é Utilizada no Projeto
1. **Autenticação Administrativa (`app/api/admin/auth/route.ts`)**:
   - Comparação da senha mestre `secretKey` contra `ADMIN_SECRET_KEY`.
   - Comparação do token do cookie de sessão `admin_session`.
2. **Revalidação Incremental sob Demanda (`app/api/revalidate/route.ts`)**:
   - Validação do token `secret` recebido via webhook HTTP contra `REVALIDATE_SECRET`.
3. **Painel de Métricas B2B (`app/admin/metricas/page.tsx`)**:
   - Validação da query param `?key=` contra `ADMIN_SECRET_KEY`.
   - Validação do cookie de sessão administrativo.
4. **Rotas de Gestão de Mídias Sociais & Campanhas**:
   - `app/api/admin/social/route.ts`: Validação de `x-admin-key` e cookie `admin_session`.
   - `app/api/admin/newsletter/route.ts`: Validação de `x-admin-key` e cookie `admin_session`.
   - `app/api/admin/discord/route.ts`: Validação de `x-admin-key` e cookie `admin_session`.
   - `app/api/admin/affiliates/route.ts`: Validação de `x-admin-key` e cookie `admin_session`.

---

## 4. Sanitização de Links no Renderizador Markdown

### Vetores de Ataque Identificados
Em `components/markdown-content.tsx`, os links gerados por Markdown `[texto](href)` ou tags `<a>` eram inseridos diretamente no DOM. Isso permitia vetores clássicos de XSS (Cross-Site Scripting):
- `[Clique aqui](javascript:alert(document.cookie))`
- `[Payload](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)`
- `[Script](vbscript:msgbox(1))`
- Links com caracteres de controle nulos (`java\0script:`) ou esquemas relativos a protocolo (`//attacker.com`).

### Regra de Sanitização Implementada (`sanitizeHref`)
A função exportada `sanitizeHref` valida cada URL antes de sua renderização:
```typescript
export function sanitizeHref(rawHref: string): { isSafe: boolean; href: string } {
  if (!rawHref) return { isSafe: false, href: "#" };

  const trimmed = rawHref.trim();

  // Rejeita caracteres de controle nulos ou invisíveis
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { isSafe: false, href: "#" };
  }

  // 1. Caminhos relativos seguros (ex: /noticias/..., /api/out/...)
  // Bloqueia '//' (protocol-relative) para impedir redirecionamento aberto
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return { isSafe: true, href: trimmed };
  }

  // 2. Âncoras internas
  if (trimmed.startsWith("#")) {
    return { isSafe: true, href: trimmed };
  }

  // 3. Protocolos absolutos estritamente permitidos
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol === "https:" || protocol === "http:" || protocol === "mailto:") {
      return { isSafe: true, href: trimmed };
    }
  } catch {
    return { isSafe: false, href: "#" };
  }

  return { isSafe: false, href: "#" };
}
```

### Comportamento de Neutralização
Se a URL fornecida pertencer a esquemas proibidos (`javascript:`, `data:`, `vbscript:`, etc.) ou for malformada:
- A tag `<a>` é **completamente suprimida**.
- O conteúdo de texto é renderizado de forma segura dentro de um `<span>` neutro:
  ```tsx
  <span className="text-zinc-600 dark:text-zinc-400" title="Link bloqueado por segurança">
    {renderInline(innerText)}
  </span>
  ```
- Nenhuma execução de script ou navegação involuntária é possível.

---

## 5. Resumo da Conformidade da Fase 1

- ✅ **Dependências**: 0 vulnerabilidades no `npm audit`.
- ✅ **Cabeçalhos HTTP**: HSTS, CSP, Permissions-Policy, X-Frame-Options, X-Content-Type-Options e Referrer-Policy ativos.
- ✅ **Timing Attacks**: `safeConstantTimeCompare` cobrindo 100% dos fluxos de autenticação de segredos.
- ✅ **Sanitização Markdown**: Bloqueio de `javascript:`, `data:`, `vbscript:` e URLs protocol-relative.
- ✅ **Integridade do Bundle**: Build estático e compilação TypeScript executados com sucesso (código de saída 0).
