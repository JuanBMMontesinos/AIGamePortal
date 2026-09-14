import { Category, Post, Source } from "@/types/database";

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "PlayStation", slug: "playstation", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-2", name: "Xbox", slug: "xbox", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-3", name: "Nintendo", slug: "nintendo", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-4", name: "PC Gaming", slug: "pc-gaming", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-5", name: "Hardware", slug: "hardware", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-6", name: "Indústria", slug: "industria", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-7", name: "Geral", slug: "geral", created_at: "2026-01-01T00:00:00Z" },
];

export const MOCK_SOURCES: Record<string, Source> = {
  "playstation-blog": {
    id: "src-1",
    name: "PlayStation Blog",
    feed_url: "https://blog.playstation.com/feed/",
    website_url: "https://blog.playstation.com",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  "xbox-wire": {
    id: "src-2",
    name: "Xbox Wire",
    feed_url: "https://news.xbox.com/en-us/feed/",
    website_url: "https://news.xbox.com",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  "nintendo-life": {
    id: "src-3",
    name: "Nintendo Life",
    feed_url: "https://www.nintendolife.com/feeds/news",
    website_url: "https://www.nintendolife.com",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  "nintendo-everything": {
    id: "src-8",
    name: "Nintendo Everything",
    feed_url: "https://nintendoeverything.com/feed/",
    website_url: "https://nintendoeverything.com",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  "pc-gamer": {
    id: "src-4",
    name: "PC Gamer",
    feed_url: "https://www.pcgamer.com/rss/",
    website_url: "https://www.pcgamer.com",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  eurogamer: {
    id: "src-5",
    name: "Eurogamer",
    feed_url: "https://www.eurogamer.net/feed/news",
    website_url: "https://www.eurogamer.net",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  "gamesindustry-biz": {
    id: "src-6",
    name: "GamesIndustry.biz",
    feed_url: "https://www.gamesindustry.biz/feed",
    website_url: "https://www.gamesindustry.biz",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
};

export const MOCK_POSTS: Post[] = [
  {
    id: "post-1",
    title: "Ghost of Yōtei: Novo gameplay revela sistema de combate com duas espadas e mundo aberto dinâmico no PS5 Pro",
    slug: "ghost-of-yotei-gameplay-ps5-pro-combate",
    tldr: [
      "A Sucker Punch demonstrou 18 minutos de gameplay capturados diretamente no PlayStation 5 Pro rodando em 4K nativo a 60 FPS com Ray Tracing completo.",
      "A protagonista Atsu poderá alternar em tempo real entre posturas tradicionais e um estilo mortal com duas espadas (Dual Wielding Katana).",
      "O clima severo ao redor do Monte Yōtei impacta a mobilidade e o comportamento dos inimigos, criando emboscadas dinâmicas durante tempestades de neve.",
      "Lançamento global confirmado para outubro de 2025 exclusivamente no PlayStation 5.",
    ],
    content: `
A **Sucker Punch Productions** e a **Sony Interactive Entertainment** revelaram novos detalhes aprofundados sobre **Ghost of Yōtei**, a aguardada sequência espiritual de Ghost of Tsushima.

Durante uma transmissão técnica especial, o estúdio demonstrou a jogabilidade rodando nativamente no **PlayStation 5 Pro**, destacando o uso pioneiro do **PlayStation Spectral Super Resolution (PSSR)** para manter fidelidade ultra-nítida em conjunto com efeitos avançados de iluminação global e oclusão de ambiente por Ray Tracing.

### O Estilo Mortal de Atsu

Ambientado em 1603 nas terras selvagens de Ezo (atual Hokkaido), o jogo coloca os jogadores no controle de **Atsu**, uma ronin solitária guiada por vingança e sobrevivência. A grande novidade mecânica fica por conta do combate com **empunhadura dupla**:

- **Dual Katana Stance**: Permite aparar ataques simultâneos de múltiplos adversários e quebrar defesas pesadas com golpes rápidos em cruz.
- **Armas de Fogo Antigas**: Introdução de matchlocks (espingardas japonesas de mecha) como opções táticas de médio alcance.
- **Kusarigama e Armas de Arremesso**: Ferramentas flexíveis para puxar oponentes de cavalos ou controlar multidões.

> "Queríamos que Atsu transmitisse uma sensação de poder diferente de Jin Sakai. O Japão feudal ao redor do Monte Yōtei é indomado, sem códigos de honra formais de clãs samurais; lutar aqui é uma questão visceral de sobreviver a todo custo", explicou Nate Fox, diretor criativo.

### Clima Hostil e Monte Yōtei em Erupção

A montanha que dá nome ao título não é apenas um pano de fundo visual deslumbrante. Avalanches ocasionais, ventos cortantes e fumaça vulcânica alteram dinamicamente a visibilidade das missões secundárias e o rastreamento por pegadas na neve.

O jogo contará com áudio 3D Tempest totalmente remapeado para fones e suporte completo aos gatilhos adaptáveis do controle DualSense, transmitindo o atrito do aço e a tensão da corda do arco.
    `.trim(),
    excerpt: "Sucker Punch exibe 18 minutos de combate visceral de Ghost of Yōtei no PS5 Pro. Veja detalhes de empunhadura dupla e ambientação no Monte Yōtei.",
    cover_image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600&auto=format&fit=crop",
    cover_image_alt: "Paisagem montanhosa japonesa com neve e névoa representando Ghost of Yōtei",
    category_id: "cat-1",
    source_id: "src-1",
    source_original_url: "https://blog.playstation.com/2026/ghost-of-yotei-deep-dive-ps5-pro",
    source_original_title: "Ghost of Yōtei: Next-Gen Combat and Environmental Systems Detailed",
    game_metadata: {
      game_name: "Ghost of Yōtei",
      platforms: ["PlayStation 5", "PlayStation 5 Pro"],
      metacritic_score: null,
      release_date: "2025-10-15",
      developer: "Sucker Punch Productions",
      publisher: "Sony Interactive Entertainment",
      genre: "Ação / Aventura / Mundo Aberto",
    },
    community_sentiment: "Empolgação massiva nas comunidades do Reddit (r/PS5) com aclamação unânime à direção de arte e ao combate com duas espadas. Usuários elogiam a coragem de introduzir uma nova protagonista em outra era histórica.",
    is_rumor: false,
    reliability_score: 5,
    rumor_warning: null,
    status: "published",
    views_count: 14280,
    published_at: "2026-09-12T11:30:00Z",
    created_at: "2026-09-12T11:30:00Z",
    updated_at: "2026-09-12T11:30:00Z",
    categories: MOCK_CATEGORIES[0],
    sources: MOCK_SOURCES["playstation-blog"],
  },
  {
    id: "post-2",
    title: "Grand Theft Auto VI: Rockstar confirma suporte a física de água sem precedentes e nova data para Trailer 2",
    slug: "gta-vi-rockstar-fisica-agua-trailer-2-detalhes",
    tldr: [
      "Engenheiros da Rockstar Games registraram nova patente para simulação hidrodinâmica volumétrica realista no motor RAGE 9.",
      "Leonida contará com marés em tempo real, furacões sazonais e barcos reagindo a ondas dinâmicas provocadas por tráfego marítimo.",
      "Fontes internas confirmam que a campanha de marketing para o segundo trailer oficial começa nas próximas semanas.",
      "Lançamento segue programado para outono de 2025 nos consoles Xbox Series X|S e PlayStation 5.",
    ],
    content: `
A **Rockstar Games** deu mais um vislumbre das inovações de ponta que farão de **Grand Theft Auto VI** o lançamento mais impactante da história dos videogames.

Uma análise aprofundada das patentes recém-concedidas à Take-Two Interactive revelou uma tecnologia revolucionária de **física de fluidos em tempo real** aplicada ao estado ficcional de Leonida e aos icônicos pântanos dos Everglades.

### Água Viva e Tempestades Tropicais

Diferente de mundos abertos anteriores, a água em GTA VI não é uma malha estática com textura de shader:
- **Flutuabilidade Dinâmica**: Lanchas e jet-skis sentem o impacto individual de cada crista de onda, afetando peso e dirigibilidade.
- **Clima Extremo**: Tempestades tropicais podem inundar ruas costeiras de Vice City temporariamente, alterando o tráfego urbano.
- **Interação com a Fauna**: Jacarés, tubarões e golfinhos reagem ao fluxo da corrente e à aproximação de motores de embarcações.

O título continua sendo o mais esperado da década, com analistas de Wall Street projetando mais de 1 bilhão de dólares em receita nas primeiras 24 horas.
    `.trim(),
    excerpt: "Novas patentes da Rockstar Games detalham física de água e tempestades tropicais em GTA VI. Saiba quando o Trailer 2 deve chegar.",
    cover_image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
    cover_image_alt: "Costa ensolarada com palmeiras e água cristalina no estilo Vice City",
    category_id: "cat-7",
    source_id: "src-5",
    source_original_url: "https://www.eurogamer.net/rockstar-gta-6-water-physics-patent-details",
    source_original_title: "Rockstar Patents Hint at Revolutionary Water Physics in GTA 6",
    game_metadata: {
      game_name: "Grand Theft Auto VI",
      platforms: ["PlayStation 5", "Xbox Series X|S"],
      metacritic_score: null,
      release_date: "2025-11-20",
      developer: "Rockstar Studios",
      publisher: "Rockstar Games",
      genre: "Ação / Aventura / Crime Sandbox",
    },
    community_sentiment: "O hype continua estratosférico no X e Reddit. A comunidade celebra a fidelidade técnica, mas demonstra ansiedade crescente por novas cenas oficiais de jogabilidade.",
    is_rumor: false,
    reliability_score: 4,
    rumor_warning: null,
    status: "published",
    views_count: 28910,
    published_at: "2026-09-12T09:15:00Z",
    created_at: "2026-09-12T09:15:00Z",
    updated_at: "2026-09-12T09:15:00Z",
    categories: MOCK_CATEGORIES[6],
    sources: MOCK_SOURCES["eurogamer"],
  },
  {
    id: "post-3",
    title: "Nintendo Switch 2: Relatório detalha tela OLED personalizada de 120Hz e retrocompatibilidade física total",
    slug: "nintendo-switch-2-oled-120hz-retrocompatibilidade-total",
    tldr: [
      "Fontes de manufatura asiáticas revelam painel OLED personalizado de 8 polegadas com taxa de atualização variável de até 120Hz.",
      "A retrocompatibilidade com cartuchos e biblioteca digital do Nintendo Switch original é garantida com melhorias automáticas de resolução.",
      "Novo dock inclui refrigeração ativa com ventoinha dedicada para alimentar o SoC Nvidia Tegra com suporte a DLSS 3.5.",
      "Anúncio oficial é esperado para o início do próximo trimestre fiscal.",
    ],
    content: `
Novas informações de fornecedores da cadeia de suprimentos de Kyoto apontam que o aguardado sucessor do Nintendo Switch está em fase final de testes de conformidade.

O console híbrido da **Nintendo** promete sanar os maiores gargalos de desempenho da geração anterior sem abrir mão da portabilidade e da eficiência energética.

### Especificações Vazadas e Destaques

- **Tela OLED 120Hz com VRR**: Experiência ultra-fluida em jogos de corrida e plataformas.
- **Nvidia Tegra Personalizado (T239)**: Litografia moderna com Tensor Cores dedicados para **DLSS (Deep Learning Super Sampling)**.
- **Slot Híbrido**: Compatível com cartuchos atuais do Switch e novos cartuchos de alta velocidade para jogos exclusivos da nova geração.
- **Joy-Cons Magnéticos**: Novo sistema de trilho com travas magnéticas indutivas que eliminam folgas mecânicas.
    `.trim(),
    excerpt: "Sucessor do Switch deve vir equipado com painel OLED de 120Hz, dock com refrigeração e retrocompatibilidade total com seus jogos atuais.",
    cover_image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1600&auto=format&fit=crop",
    cover_image_alt: "Console portátil estilizado em ambiente minimalista gamer",
    category_id: "cat-3",
    source_id: "src-3",
    source_original_url: "https://www.nintendolife.com/news/2026/switch-2-hardware-leak-oled-120hz",
    source_original_title: "Nintendo Switch Successor Rumored to Feature 120Hz Custom OLED Display",
    game_metadata: {
      game_name: "Nintendo Switch 2 (Hardware)",
      platforms: ["Nintendo Switch 2"],
      metacritic_score: null,
      release_date: "2025-06-01",
      developer: "Nintendo EPD / Hardware Division",
      publisher: "Nintendo",
      genre: "Console Híbrido / Hardware",
    },
    community_sentiment: "Reação muito positiva dos fãs nintendistas, aliviados com a confirmação da retrocompatibilidade da biblioteca e a adoção de DLSS para manter 60 FPS em modo portátil.",
    is_rumor: true,
    reliability_score: 2,
    rumor_warning: "Informações obtidas por meio de vazamentos da cadeia de suprimentos asiática. A Nintendo ainda não confirmou publicamente as especificações finais ou o modelo de display do console.",
    status: "published",
    views_count: 19450,
    published_at: "2026-09-12T08:00:00Z",
    created_at: "2026-09-12T08:00:00Z",
    updated_at: "2026-09-12T08:00:00Z",
    categories: MOCK_CATEGORIES[2],
    sources: MOCK_SOURCES["nintendo-life"],
  },
  {
    id: "post-4",
    title: "Nvidia GeForce RTX 5090 atinge marca histórica em benchmarks de Ray Tracing com arquitetura Blackwell",
    slug: "rtx-5090-benchmarks-ray-tracing-arquitetura-blackwell",
    tldr: [
      "A GPU topo de linha da Nvidia registra salto de até 70% de desempenho bruto em relação à RTX 4090 em 4K nativo.",
      "Memórias GDDR7 de 32 GB entregam largura de banda massiva de 1.8 TB/s para carregamento instantâneo de texturas.",
      "Nova geração do DLSS Neural Reconstruction reduz artefatos de ghosting em cenas de movimento rápido.",
      "Preço sugerido e disponibilidade devem ser oficializados na feira de tecnologia.",
    ],
    content: `
Vazamentos de benchmarks sintéticos no 3DMark TimeSpy Extreme e Cyberpunk 2077 com Path Tracing colocam a **GeForce RTX 5090** em um patamar isolado de poder gráfico.

Projetada com base na arquitetura **Blackwell**, a nova placa flagship da Nvidia foca em aceleração por IA generativa e computação paralela de iluminação.
    `.trim(),
    excerpt: "RTX 5090 impressiona em testes vazados com largura de banda de 1.8 TB/s e 32 GB de memória GDDR7. Confira os números.",
    cover_image_url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1600&auto=format&fit=crop",
    cover_image_alt: "Placa gráfica de alta performance com iluminação neon interna",
    category_id: "cat-5",
    source_id: "src-4",
    source_original_url: "https://www.pcgamer.com/hardware/rtx-5090-blackwell-benchmarks-analysis",
    source_original_title: "GeForce RTX 5090 Leaked Benchmarks Show Huge Ray Tracing Uplift",
    game_metadata: {
      game_name: "Nvidia GeForce RTX 5090",
      platforms: ["PC"],
      metacritic_score: null,
      release_date: "2025-01-28",
      developer: "Nvidia Corporation",
      publisher: "Nvidia",
      genre: "Hardware / Placa de Vídeo",
    },
    community_sentiment: "Entusiasmo com o poder absoluto entre entusiastas do PC Gaming, acompanhado por piadas sobre consumo elétrico de 600W e preocupações com o preço final no Brasil.",
    is_rumor: true,
    reliability_score: 3,
    rumor_warning: "Benchmarks sintéticos e especificações técnicas vazadas antes do anúncio oficial da fabricante. Os valores finais podem sofrer alterações no lançamento comercial.",
    status: "published",
    views_count: 11200,
    published_at: "2026-09-11T19:40:00Z",
    created_at: "2026-09-11T19:40:00Z",
    updated_at: "2026-09-11T19:40:00Z",
    categories: MOCK_CATEGORIES[4],
    sources: MOCK_SOURCES["pc-gamer"],
  },
  {
    id: "post-5",
    title: "Monster Hunter Wilds: Capcom detalha o ecossistema das Terras Proibidas e crossplay total entre plataformas",
    slug: "monster-hunter-wilds-ecossistema-terras-proibidas-crossplay",
    tldr: [
      "Monstros interagem de forma independente com a cadeia alimentar, formando manadas e disputando território dinamicamente.",
      "A montaria Seikret permite disparar projéteis de funda e trocar entre duas armas durante a perseguição.",
      "Cross-play completo confirmado entre PC (Steam), PS5 e Xbox Series X|S desde o primeiro dia.",
      "Beta aberto para testes de estresse de servidor anunciado para o próximo mês.",
    ],
    content: `
A **Capcom** liberou novas impressões técnicas do aguardado **Monster Hunter Wilds**, prometendo levar a caça cooperativa ao ápice visual e de simulação orgânica.

O diretor Yuya Tokuda ressaltou que as transições entre o acampamento base e os biomas abertos são completamente sem telas de carregamento, permitindo que caçadores saiam em expedição a qualquer momento.
    `.trim(),
    excerpt: "Capcom demonstra o comportamento vivo de manadas e caçadas em Monster Hunter Wilds. Saiba como funcionará o crossplay total.",
    cover_image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1600&auto=format&fit=crop",
    cover_image_alt: "Guerreiro de armadura em ambiente selvagem de fantasia",
    category_id: "cat-4",
    source_id: "src-4",
    source_original_url: "https://www.pcgamer.com/monster-hunter-wilds-hands-on-crossplay",
    source_original_title: "Monster Hunter Wilds hands-on: The living ecosystem changes everything",
    game_metadata: {
      game_name: "Monster Hunter Wilds",
      platforms: ["PC (Steam)", "PlayStation 5", "Xbox Series X|S"],
      metacritic_score: 91,
      release_date: "2025-02-28",
      developer: "Capcom",
      publisher: "Capcom",
      genre: "RPG de Ação / Co-op",
    },
    community_sentiment: "Aclamação quase unânime da comunidade global de caçadores. O suporte ao crossplay era a funcionalidade mais pedida há anos.",
    is_rumor: false,
    reliability_score: 5,
    rumor_warning: null,
    status: "published",
    views_count: 16840,
    published_at: "2026-09-11T16:20:00Z",
    created_at: "2026-09-11T16:20:00Z",
    updated_at: "2026-09-11T16:20:00Z",
    categories: MOCK_CATEGORIES[3],
    sources: MOCK_SOURCES["pc-gamer"],
  },
  {
    id: "post-6",
    title: "Xbox anuncia expansão do Game Pass Cloud com suporte nativo a monitores Ultrawide e baixa latência",
    slug: "xbox-cloud-gaming-ultrawide-baixa-latencia-game-pass",
    tldr: [
      "O Xbox Cloud Gaming passa a transmitir em resolução 1440p com proporção 21:9 em dispositivos compatíveis.",
      "Novo codec de decodificação direta de frames reduz o atraso de comando para patamares imperceptíveis em conexões de fibra.",
      "Mais de 50 títulos do catálogo receberam suporte a mouse e teclado em nuvem a partir de hoje.",
      "Atualização já está disponível no aplicativo oficial para Windows e navegadores modernos.",
    ],
    content: `
A divisão de jogos da **Microsoft** anunciou uma das maiores atualizações de infraestrutura para o **Xbox Cloud Gaming** desde seu lançamento.

Com a migração para blades baseadas no hardware customizado do Xbox Series X com processamento de rede acelerado, a experiência de jogar na nuvem atinge um novo padrão competitivo.
    `.trim(),
    excerpt: "Microsoft implementa transmissão em 1440p ultrawide e redução drástica de input lag no Xbox Cloud Gaming. Confira a lista de jogos suportados.",
    cover_image_url: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=1600&auto=format&fit=crop",
    cover_image_alt: "Controle Xbox sobre mesa gamer com iluminação neon verde",
    category_id: "cat-2",
    source_id: "src-2",
    source_original_url: "https://news.xbox.com/en-us/2026/xbox-cloud-gaming-ultrawide-update",
    source_original_title: "Xbox Cloud Gaming: Delivering Higher Fidelity and Ultrawide Support",
    game_metadata: {
      game_name: "Xbox Game Pass Cloud",
      platforms: ["Xbox Series X|S", "PC", "Mobile", "Smart TVs"],
      metacritic_score: null,
      release_date: "2026-09-10",
      developer: "Microsoft Gaming",
      publisher: "Microsoft",
      genre: "Serviço por Assinatura / Cloud",
    },
    community_sentiment: "Jogadores de PC elogiam bastante a adição de proporções 21:9 e suporte a mouse e teclado, tornando o serviço muito mais atraente fora dos consoles.",
    is_rumor: false,
    reliability_score: 5,
    rumor_warning: null,
    status: "published",
    views_count: 8930,
    published_at: "2026-09-10T14:00:00Z",
    created_at: "2026-09-10T14:00:00Z",
    updated_at: "2026-09-10T14:00:00Z",
    categories: MOCK_CATEGORIES[1],
    sources: MOCK_SOURCES["xbox-wire"],
  },
  {
    id: "post-7",
    title: "Mercado Global de Games projeta receita de US$ 213,9 bilhões em 2026 impulsionado por grandes franquias",
    slug: "mercado-global-games-receita-213-bilhoes-2026-newzoo",
    tldr: [
      "Relatório anual da Newzoo projeta avanço de 6,1% no faturamento da indústria global de games em 2026.",
      "Estados Unidos e China continuam concentrando mais de 50% de todos os gastos de consumidores com jogos eletrônicos.",
      "O segmento de consoles lidera o crescimento no ano, beneficiado pelo ciclo maduro da geração atual e antecipação de novos hardwares.",
      "Investimentos em estúdios de médio porte voltam a acelerar após sucessivas rodadas de reestruturação do setor.",
    ],
    content: `
O mercado global de videogames está a caminho de movimentar **US$ 213,9 bilhões** ao longo de 2026, representando um crescimento sólido de **6,1% ano a ano**, de acordo com o mais recente relatório analítico divulgado pela **Newzoo**.

O levantamento aponta uma recuperação sustentável após períodos de desaceleração e reestruturações corporativas que marcaram os anos anteriores, impulsionada principalmente por um calendário repleto de lançamentos de grande escala e a consolidação de ecossistemas multiplataforma.

### Concentração de Receita e Dinâmica de Plataformas

Mais da metade de toda a receita global (52%) continua concentrada em dois polos econômicos determinantes: **China** e **Estados Unidos**.

- **Consoles Domésticos**: Apresentam o maior ritmo de aceleração, com avanço de 7,4% na receita, alavancados pela base instalada de mais de 85 milhões de unidades somadas entre PS5 e Xbox Series, além da expectativa pelo novo hardware da Nintendo.
- **PC Gaming**: Mantém trajetória contínua de expansão (+4,8%), impulsionada pela explosão de jogos independentes de sucesso viral no Steam e pelo modelo de publicação simultânea adotado por grandes publicadoras japonesas e ocidentais.
- **Mobile**: Embora permaneça o maior segmento em volume financeiro absoluto (49% do total), registra crescimento mais moderado de 3,2%, devido a pressões regulatórias globais sobre lojas de aplicativos e taxas de comissão.

### Ficha Técnica da Análise de Mercado

| Métrica | Dados Projetados (2026) | Variação Anual |
| :--- | :--- | :--- |
| Receita Global Estimada | US$ 213,9 Bilhões | +6,1% YoY |
| Jogadores Ativos no Mundo | 3,42 Bilhões de usuários | +4,2% YoY |
| Maior Segmento por Faturamento | Mobile (US$ 104,8 Bilhões) | +3,2% YoY |
| Segmento com Maior Crescimento | Consoles (US$ 54,2 Bilhões) | +7,4% YoY |
| Principais Mercados Consumidores | China e EUA (52% do total) | Estável |

### Oportunidades em Estúdios Menores e Eficiência

O estudo também destaca uma mudança estratégica nas rodadas de investimento de risco (Venture Capital) e fusões. Após a era dos megaconglomerados, publicadoras e investidores estão direcionando aportes para desenvolvedoras independentes e de médio porte (AA), reconhecendo nelas uma relação risco-retorno muito mais eficiente e ágil em comparação com produções de orçamentos inflacionados acima de US$ 200 milhões.

*Fonte de dados e apuração: GamesIndustry.biz via Newzoo Global Games Market Report.*
    `.trim(),
    excerpt: "Newzoo projeta faturamento de US$ 213,9 bilhões para a indústria de games em 2026, com consoles liderando o avanço anual de 6,1%. Confira a análise completa.",
    cover_image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop",
    cover_image_alt: "Gráfico de mercado e tecnologia simbolizando o crescimento financeiro da indústria de games",
    category_id: "cat-6",
    source_id: "src-6",
    source_original_url: "https://www.gamesindustry.biz/newzoo-global-games-market-to-generate-2139bn-in-2026-up-61-yoy",
    source_original_title: "Newzoo: Global games market to generate $213.9bn in 2026, up 6.1% YoY",
    game_metadata: {
      game_name: "Mercado Global de Games (Indústria)",
      platforms: ["Multiplataforma", "Consoles", "PC", "Mobile"],
      metacritic_score: null,
      release_date: "2026-09-14",
      developer: "Newzoo Market Research",
      publisher: "GamesIndustry.biz",
      genre: "Relatório de Mercado / Negócios",
    },
    community_sentiment: "Analistas e desenvolvedores celebram a estabilização do ecossistema e o retorno de investimentos a estúdios de médio porte após dois anos de volatilidade e demissões no setor.",
    is_rumor: false,
    reliability_score: 5,
    rumor_warning: null,
    status: "published",
    views_count: 7340,
    published_at: "2026-09-13T18:00:00Z",
    created_at: "2026-09-13T18:00:00Z",
    updated_at: "2026-09-13T18:00:00Z",
    categories: MOCK_CATEGORIES[5],
    sources: MOCK_SOURCES["gamesindustry-biz"],
  },
];
