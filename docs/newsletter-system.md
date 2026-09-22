# Sistema de Newsletter Gamer — Visão Geral & Segurança

Este documento documenta os fluxos, arquitetura de dados e políticas de segurança da Newsletter Gamer do **Made By AI Games**.

---

## 1. Fluxo de Inscrição (`/api/newsletter/subscribe`)

- **Método**: `POST`
- **Rate Limit**: Máximo de 3 inscrições por IP por minuto (`Sliding Window`).
- **Validação de Entrada**: Normalização para caixa baixa, verificação de formato via regex RFC 5322 e limite máximo de 255 caracteres.
- **Tratamento de Estado**:
  - Novo usuário: Insere registro em `newsletter_subscribers` com `is_active: true`.
  - Usuário previamente desativado: Reativa a inscrição com `is_active: true` e `unsubscribed_at: null`.
  - Usuário já ativo: Retorna confirmação amigável sem criar duplicatas.

---

## 2. Fluxo Seguro de Descadastro (Unsubscribe)

Para conformidade com as normas internacionais (RFC 8058, CAN-SPAM) e a LGPD, o cancelamento opera em duas camadas:

1. **Camada Idempotente (GET)**:
   - Rota: `GET /api/newsletter/unsubscribe?email=...&token=...` ou acesso direto à página `GET /newsletter/unsubscribe?email=...&token=...`.
   - **Garantia de Não-Mutação**: Requisições `GET` **nunca alteram o estado do banco**. Isso neutraliza bots de antivírus de e-mail (ex: Microsoft Defender, Gmail Link Checker) que pré-carregam links da caixa de entrada.
   - Apresenta uma tela interativa gamer solicitando a confirmação do leitor.

2. **Camada de Mutação Autenticada (POST)**:
   - Rota: `POST /api/newsletter/unsubscribe`
   - **Autenticação Criptográfica**: Exige um token HMAC-SHA256 gerado exclusivamente pelo servidor a partir do e-mail do assinante.
   - **Proteção CSRF**: Validação de Same-Origin nos cabeçalhos `Origin` e `Referer`.
   - **Rate Limiting**: Máximo de 5 requisições por minuto por IP.
   - **Efeito no Banco**: Atualiza `is_active = false` e `unsubscribed_at = now()`.

---

## 3. Acesso a Dados & Políticas RLS no Supabase

- **Tabela `newsletter_subscribers`**:
  - `INSERT`: Liberado para usuários anônimos e autenticados (inscrição pública).
  - `SELECT`, `UPDATE`, `DELETE`: **Restritos exclusivamente à role `service_role`**.
- **Painel Administrativo (`/admin/newsletter`)**:
  - A camada de dados [`lib/data/newsletter-admin.ts`](../lib/data/newsletter-admin.ts) utiliza `createAdminClient() || createServerClient()`.
  - Operações administrativas utilizam a chave `SUPABASE_SERVICE_ROLE_KEY` do ambiente, contornando com segurança o bloqueio de RLS.
  - Caso a chave administrativa não esteja configurada no ambiente local, um fallback resiliente apresenta a contagem de demonstração sem quebrar a interface.

---

## 4. Documentação Complementar

- [Automação e Template da Newsletter](NEWSLETTER_AUTOMATION.md)
- [Painel Administrativo da Newsletter](admin-newsletter.md)
- [Hardening de Rate Limiting e Fluxos Criptográficos](security/rate-limiting-and-flows.md)
