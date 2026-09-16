# Painel Administrativo da Newsletter Gamer

O **AIGamePortal** possui uma área administrativa exclusiva e dedicada para controle, monitoramento e salvaguarda do sistema de **Newsletter Semanal**:

- **Rota do Painel**: `/admin/newsletter`
- **Rota da API**: `/api/admin/newsletter`
- **Autenticação**: Chave Mestra (`ADMIN_SECRET_KEY`) via cookie seguro `admin_session`.

> [!IMPORTANT]
> **Separação Rigorosa de Responsabilidades**: A gestão da newsletter opera de forma totalmente independente da administração de afiliados (`/admin/afiliados`). Cada módulo possui suas próprias rotas, APIs e tabelas no banco de dados.

---

## 1. Salvaguarda de Envio: Estado Inicial Desabilitado

Por padrão de segurança, o envio semanal de newsletters **inicia desabilitado** (`is_enabled: false`) no banco de dados através da tabela `public.newsletter_settings`:

```sql
INSERT INTO public.newsletter_settings (id, is_enabled, disabled_reason)
VALUES (
    'default',
    false,
    'Aguardando configuração e homologação do serviço Resend'
)
ON CONFLICT (id) DO NOTHING;
```

### Comportamento do Pipeline Semanal (`scripts/send-weekly-newsletter.ts`):
1. **Verificação Prévia (Etapa 0/4)**: O script consulta `newsletter_settings.is_enabled` antes de buscar matérias ou montar templates.
2. **Se Desabilitado**:
   - Registra no log o motivo da pausa (`disabled_reason`).
   - Atualiza `last_dispatch_status = 'skipped'` no Supabase.
   - **Encerra com sucesso (exit code 0)** sem realizar nenhuma chamada à API do Resend e sem disparar nenhum e-mail, garantindo que o fluxo do GitHub Actions não falhe com alerta vermelho desnecessário.
3. **Se Habilitado**:
   - Executa a compilação das 5 matérias mais lidas + ofertas e dispara os e-mails para a base ativa.

---

## 2. Funcionalidades do Painel (`/admin/newsletter`)

### 2.1 Banner Mestre de Controle (Habilitar / Desabilitar)
- **Status Visual Imediato**:
  - 🛑 **Vermelho/Âmbar (Pausado)**: Disparos automáticos bloqueados. Exibe a justificativa cadastrada pelo administrador.
  - ✅ **Verde Esmeralda (Habilitado)**: Disparos liberados para execução todo domingo às 10h BRT.
- **Botão com Confirmação Modal**:
  - Ao pausar, solicita o preenchimento do motivo (ex: *"Aguardando validação do domínio no Resend"*).
  - Ao habilitar, exige confirmação explícita do administrador.

### 2.2 Diagnóstico de Conexão com o Resend
- Verifica automaticamente se a variável `RESEND_API_KEY` está configurada no ambiente e se possui o formato oficial (`re_...`).
- Exibe o e-mail de remetente configurado (`RESEND_FROM_EMAIL`).

### 2.3 Métricas & KPIs em Tempo Real
- **Assinantes Ativos**: Quantidade de e-mails que receberão a próxima edição.
- **Assinantes Descadastrados**: Total de usuários que solicitaram opt-out pelo link de descadastro.
- **Taxa de Retenção & Churn**: Cálculo percentual da retenção da base de inscritos.
- **Histórico do Último Disparo**: Data/hora e status da última execução (`success`, `skipped` ou `failed`).

### 2.4 Sandbox de Disparo de Teste
- Campo para digitação de um e-mail de teste.
- Botão *"Disparar Teste"*: Envia um e-mail de homologação exclusivamente para o destinatário informado, permitindo validar o remetente e a entrega no Gmail/Outlook **sem precisar ativar o envio geral para toda a base**.

### 2.5 Gerenciamento da Base de Assinantes
- Tabela com todos os e-mails capturados pelo portal.
- Filtros por status: `Todos`, `Ativos`, `Inativos (Descadastrados)`.
- Campo de busca instantânea por e-mail.
- Ações por assinante:
  - **Desativar / Reativar**: Altera manualmente o campo `is_active`.
  - **Excluir**: Remove permanentemente o registro do banco de dados.

---

## 3. Endpoints da API Administrativa (`/api/admin/newsletter`)

Todos os endpoints exigem autenticação prévia (cookie `admin_session` ou header `x-admin-key`):

| Método | Finalidade | Payload de Exemplo |
| :--- | :--- | :--- |
| `GET` | Carrega configurações, KPIs e lista de assinantes | N/A (suporta `?search=...&status=active`) |
| `PATCH` | Habilita/Desabilita envio geral ou altera status de assinante | `{ "is_enabled": true }` ou `{ "action": "toggle_subscriber", "id": "...", "is_active": false }` |
| `POST` | Dispara e-mail de teste no sandbox | `{ "email": "meu-email@teste.com" }` |
| `DELETE` | Exclui assinante da base | `?id=uuid-do-assinante` |

---

## 4. Como Habilitar os Disparos em Produção

Quando a conta do Resend estiver configurada com domínio validado (DNS DKIM/SPF) e a chave `RESEND_API_KEY` for adicionada aos Secrets do GitHub:

1. Acesse o portal em `/admin/newsletter`.
2. Digite a sua `ADMIN_SECRET_KEY` configurada no ambiente.
3. No Banner Mestre, clique em **"Habilitar Envio da Newsletter"**.
4. Confirme no modal.
5. Pronto! A partir do próximo domingo às 10:00 BRT, os resumos gamer serão enviados automaticamente.
