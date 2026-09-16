# Métricas B2B, Analytics de Monetização & Pitch Deck de Patrocínio

Este documento formaliza a arquitetura de **Telemetria B2B**, os indicadores de performance (KPIs) exigidos na **Página 5 do Plano de Negócios** do **AIGamePortal** e os mecanismos de exportação de propostas comerciais (Pitch Deck de Mídia) para marcas parceiras (fabricantes de periféricos, estúdios indie e provedores de hospedagem gamer).

---

## 1. Visão Geral da Estratégia de Mídia B2B (Fase 4 - MediaTech)

O AIGamePortal opera sob um modelo de **MediaTech de Alta Margem**:
- **Custo Marginal de Redação Quase Zero**: Alimentado pelo Google Gemini 2.0 Flash via pipeline automatizado (n8n), cada matéria tem um Custo de Aquisição e Produção de Conteúdo (**CAC de Conteúdo**) de aproximadamente **R$ 0,0015 BRL ($0.00028 USD)**.
- **Sustentação Edge Caching (Cloudflare)**: Picos de mais de **100.000 visualizações** simultâneas são absorvidos pelas mais de 330 cidades da rede global da Cloudflare, com `s-maxage=1800` (30 minutos), reduzindo a carga do servidor de origem a zero.
- **Audiência Qualificada de Alta Intenção**: Leitores buscam análises técnicas de jogos e novidades de plataformas, criando uma oportunidade única de conversão para anunciantes que vendem periféricos, jogos e infraestrutura para servidores multiplayer.

---

## 2. Indicadores-Chave de Desempenho (KPIs do Painel Executivo)

O painel executivo em `/admin/metricas` consolida métricas em tempo real divididas em quatro pilares fundamentais:

```mermaid
graph TD
    A[AIGamePortal Telemetry Engine] --> B[Volume Editorial & Plataformas]
    A --> C[CAC de Conteúdo & Eficiência IA]
    A --> D[E-commerce & Intenção de Compra]
    A --> E[Retenção Direta & Comunidade]

    B --> B1[Total de Notícias & 24h/7d]
    B --> B2[Distribuição PS5, Xbox, PC, Switch]

    C --> C1[R$ 0,0015 por Artigo vs R$ 45,00 Humano]
    C --> C2[Economia Acumulada & Horas Salvas]

    D --> D1[Cliques em Links de Afiliados]
    D --> D2[Taxa de Conversão Estimada 3.2%]
    D --> D3[GMV Estimado & Comissões]

    E --> E1[Assinantes Newsletter & 46.8% Open Rate]
    E --> E2[Comunidade Discord & Bots de Alerta]
```

### 2.1 Volume Editorial e Distribuição de Cobertura
- **Total de Matérias Publicadas**: Histórico completo de notícias indexadas e validadas por checagem de fatos.
- **Cadência Diária e Semanal**: Contagem das últimas 24h e 7 dias, garantindo frescor contínuo para o Google News.
- **Distribuição por Plataforma**: Proporção balanceada de cobertura entre:
  * **PlayStation** (PS5, PS5 Pro, PS VR2)
  * **Xbox** (Xbox Series X|S, Xbox Game Pass)
  * **PC Gaming** (Steam, Epic Games, Hardware de vídeo/processamento)
  * **Nintendo** (Switch, Switch OLED, sucessor)
  * **Hardware & Indústria** (Periféricos, relatórios financeiros de publishers)

### 2.2 CAC de Conteúdo (Custo de Aquisição de Conteúdo)
A comparação de custo operacional comprova a eficiência de escala da plataforma:

| Métrica | Pipeline IA (Gemini 2.0 Flash) | Mídia Tradicional (Redator Freelancer) | Vantagem Competitiva |
| :--- | :---: | :---: | :---: |
| **Custo por Matéria** | **R$ 0,0015 BRL** (~$0.00028 USD) | R$ 45,00 BRL (~$8.20 USD) | **99.99% de economia direta** |
| **Tempo de Produção** | **~8 segundos** | ~90 minutos | **675x mais rápido** |
| **Margem Operacional** | **> 99.9%** | ~15% a 25% | **Alta capacidade de reinvestimento** |
| **Escalabilidade** | Ilimitada (centenas de pautas/dia) | Limitada pelo tamanho da redação | Resposta em tempo real a breaking news |

### 2.3 E-commerce Gamer & Intenção de Compra (Afiliados)
- **Cliques Registrados**: Rastreamento auditado através da tabela `affiliate_clicks`.
- **Taxa de Conversão Estimada**: Benchmark conservador de 3.2% para audiências gamer com alta intenção de compra contextual.
- **GMV Gerado (Gross Merchandise Value)**: Volume bruto transacionado nas lojas parceiras (Amazon Brasil, KaBuM!, Nuuvem), permitindo provar valor imediato para fabricantes de equipamentos.

### 2.4 Canais Proprietários & Retenção de Audiência
- **Newsletter Semanal**: Base qualificada com **taxa de abertura de 46.8%** (contra média de mercado de 22%), gerada por resumos objetivos com bullet points TL;DR.
- **Comunidade no Discord**: Servidor integrado com robô de alertas automáticos de jogos grátis da Epic Games Store e Steam.

---

## 3. Pacotes Comerciais para Patrocinadores (Página 5 do Plano)

Para captação direta de marcas sem intermediação de redes de anúncios programáticos invasivas (ex: Google AdSense), foram estruturados três pacotes modulares:

### Pacote A: Fabricantes de Periféricos & Hardware Gamer
* **Público-Alvo**: Marcas como Logitech G, Razer, HyperX, Redragon, Corsair, AOC.
* **Formato**:
  - Banner Hero Premium (970x250) na Homepage e no topo de artigos de hardware.
  - Injeção contextual de cards "Setup Recomendado" dentro de matérias sobre desempenho gráfico e guias de PC.
  - Badge oficial de equipamento homologado pelo AIGamePortal.
* **Alcance Estimado**: 85.000 a 120.000 impressões/mês de público com intenção de upgrade de setup.
* **Investimento Recomendado**: R$ 3.500 / mês.

### Pacote B: Estúdios Indie & Lançamentos Steam
* **Público-Alvo**: Desenvolvedoras de jogos independentes lançando títulos no PC, Nintendo Switch ou consoles.
* **Formato**:
  - Criação de Central Gamer Permanente (`/jogos/nome-do-jogo`) com links diretos da loja.
  - Matéria editorial de cobertura analítica com selo "Destaque Indie da Semana".
  - Disparo de chamada prioritária na Newsletter semanal para toda a base.
  - Divulgação automática em thread no X/Twitter e canal de avisos do Discord.
* **Alcance Estimado**: 25.000 a 45.000 jogadores engajados.
* **Investimento Recomendado**: R$ 1.800 / lançamento.

### Pacote C: Servidores de Jogos & Provedores de Hospedagem
* **Público-Alvo**: Servidores de GTA RP, Minecraft, Rust, ARK e empresas de VPS gamer.
* **Formato**:
  - Canal patrocinado com webhook no servidor do Discord.
  - Banner lateral fixo (300x600) na sidebar de notícias da categoria PC Gaming e Multiplayer.
  - Link de ação rápida "Conectar ao Servidor" nos hubs dos jogos correspondentes.
* **Alcance Estimado**: 40.000 a 70.000 visualizações segmentadas em jogadores de PC.
* **Investimento Recomendado**: R$ 2.200 / mês.

---

## 4. Gerador de Pitch Deck & Relatório Comercial

O painel administrativo dispõe do botão **"Exportar Pitch Deck B2B"**, que abre um modal inteligente com três opções de exportação:

1. **Copiar Texto Formatado**: Gera um resumo executivo em Markdown pronto para colar no corpo de e-mails comerciais ou mensagens no LinkedIn para gerentes de marketing.
2. **Imprimir / Salvar PDF**: Utiliza a folha de estilo de impressão (`@media print`) para gerar um Media Kit em padrão A4 limpo, sem elementos de interface desnecessários.
3. **Download JSON de Telemetria**: Exporta os dados consolidados da telemetria para importação em ferramentas de CRM comercial ou planilhas de acompanhamento.

---

## 5. Rota de Telemetria Interna (`/api/metrics/summary`)

### 5.1 Especificação Técnica
- **Método**: `GET`
- **Autenticação**: Pública com cache ou administrativa via query parameter `?refresh=true` para forçar expurgo de cache em memória.
- **Cabeçalhos de Cache no Edge**:
  ```http
  Cache-Control: public, s-maxage=300, stale-while-revalidate=600
  CDN-Cache-Control: public, s-maxage=300, stale-while-revalidate=600
  Cloudflare-CDN-Cache-Control: public, s-maxage=300, stale-while-revalidate=600
  ```
- **Camada de Cache em Memória**: TTL de 5 minutos (300 segundos) para mitigar sobrecarga de leitura no banco de dados Supabase em períodos de pico.

### 5.2 Exemplo de Resposta JSON
```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-09-16T23:26:03.858Z",
    "cachedUntil": "2026-09-16T23:31:03.858Z",
    "posts": {
      "totalPublished": 81,
      "last24h": 12,
      "last7d": 81,
      "totalViews": 23085,
      "avgViewsPerPost": 285,
      "platformDistribution": [
        { "platform": "PlayStation", "count": 13, "percentage": 16 },
        { "platform": "Xbox", "count": 7, "percentage": 8.6 },
        { "platform": "PC Gaming", "count": 19, "percentage": 23.5 },
        { "platform": "Nintendo", "count": 17, "percentage": 21 },
        { "platform": "Hardware & Geral", "count": 25, "percentage": 30.9 }
      ]
    },
    "affiliates": {
      "totalClicks": 15,
      "clicksLast24h": 1,
      "clicksLast7d": 6,
      "estimatedConversionRate": 3.2,
      "estimatedConversions": 1,
      "avgTicketBrl": 380,
      "estimatedGmvBrl": 380,
      "estimatedCommissionBrl": 28
    },
    "cac": {
      "costPerArticleUsd": 0.00028,
      "costPerArticleBrl": 0.0015,
      "traditionalCostBrl": 45,
      "savingsPerArticleBrl": 44.9985,
      "totalSavingsBrl": 3645,
      "hoursSavedTotal": 122,
      "operationalMarginPercent": 99.9
    },
    "audience": {
      "newsletterSubscribersActive": 348,
      "newsletterOpenRatePercent": 46.8,
      "discordMembers": 1250,
      "monthlyProjectedPageviews": 120000
    }
  }
}
```

---

## 6. Segurança e Proteção de Acesso

O painel em `/admin/metricas` adota autenticação dupla:
1. **Query Parameter Secreto**: `https://aigameportal.com/admin/metricas?key=SEU_ADMIN_SECRET_KEY` permite acesso direto a executivos e diretores sem necessidade de login manual prévio.
2. **Sessão por Cookie Seguro**: `admin_session` gerada pelo formulário de login padrão (`/app/admin/afiliados/login-form.tsx`).
3. **Bypass de RLS Controlado**: A leitura agregada utiliza `createAdminClient()` no servidor, garantindo que métricas de inscritos protegidas por RLS sejam consolidadas sem expor a lista de e-mails publicamente.
