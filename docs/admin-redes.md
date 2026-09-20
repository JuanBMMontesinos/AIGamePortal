# Painel Administrativo de Redes Sociais (`/admin/redes`) — AIGamePortal

Este documento detalha o funcionamento, arquitetura e instruções operacionais do **Painel Administrativo de Redes Sociais** ([app/admin/redes/page.tsx](file:///d:/IAProjects/AIGamePortal/app/admin/redes/page.tsx)), módulo responsável pelo controle centralizado de publicações no **X (Twitter)** e **Telegram**.

---

## 1. Visão Geral e Princípio de Segurança

Para garantir que o portal opere com 100% de confiabilidade e sem desperdício de requisições ou erros em cascata:

1. **Padrão Inicial Desabilitado para o X**: O X (Twitter) opera no modelo pré-pago por uso (*pay-per-use*). O portal é configurado com a chave mestre do X desabilitada (`is_twitter_enabled: false`) por padrão.
2. **Degradação Elegante no Pipeline**: Se o envio para o X estiver desabilitado, o pipeline jornalístico ([scripts/sync-news.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-news.ts)) pula a requisição do Twitter de forma não-bloqueante (`skipped: true`), mantendo o Telegram, o Discord e a publicação no site totalmente ativos.
3. **Ativação Imediata via Interface**: Assim que o administrador recarregar créditos no [X Developer Portal](https://developer.x.com/), basta entrar em `/admin/redes`, ligar o switch e salvar. Nenhum deploy ou reinicialização de servidor é necessário.

---

## 2. Acesso e Autenticação

- **URL Local**: `http://localhost:3000/admin/redes`
- **URL Produção**: `https://aigameportal.vercel.app/admin/redes`
- **Mecanismo de Segurança**: Protegido por sessão autenticada (`admin_session`) validada pela chave mestra `ADMIN_SECRET_KEY` configurada no `.env.local` e nos secrets da Vercel/GitHub Actions.

---

## 3. Funcionalidades do Painel

### 3.1 Chaves Mestras de Ativação
- **X (Twitter)**: Switch Liga/Desliga para envios no perfil oficial `@MadeByAiGames`.
  - Permite definir a justificativa da pausa (ex: *"Aguardando recarga de créditos no X Developer Portal"*).
- **Telegram**: Switch Liga/Desliga para envios no canal público `@aigameportal_noticias`.

### 3.2 Disparos de Teste Controlados
O painel inclui botões dedicados de teste:
- **Testar Tweet**: Executa uma chamada direta à API do X publicando uma mensagem de validação com data e hora. Ideal para testar se os novos créditos recarregados no X estão ativos sem esperar um cron.
- **Testar Mensagem no Telegram**: Envia um card de teste para o canal do Telegram validando o bot.

### 3.3 Telemetria e Diagnóstico
- Exibe o status da última tentativa de envio de cada canal (`OK`, `Pulado`, `Falhou`).
- Registra no banco o log detalhado do último disparo e a data/hora exata da execução.
- Exibe o mascaramento de segurança das credenciais ativas (`TWITTER_API_KEY`, `TWITTER_ACCESS_TOKEN`, `TELEGRAM_BOT_TOKEN`).

---

## 4. Como Reativar o X Quando Tiver Créditos

Quando você optar por adicionar saldo à conta de desenvolvedor do X:

1. Acesse o **[X Developer Portal](https://developer.x.com/)** e faça uma recarga de créditos (mínimo de $5 USD) na aba **Billing / Credits**.
2. Abra o painel administrativo:
   ```text
   http://localhost:3000/admin/redes
   ```
3. Digite sua senha de administrador (`ADMIN_SECRET_KEY`).
4. Clique no botão **Testar Tweet** para confirmar que a API do X aceitou o crédito.
5. Ligue o switch **"Envios Automáticos para o X"**.
6. Clique no botão azul **"Salvar Configurações de Redes"**.

Pronto! A partir desse momento, todas as novas notícias mineradas e geradas pela inteligência artificial serão automaticamente publicadas no feed do X e no Telegram.
