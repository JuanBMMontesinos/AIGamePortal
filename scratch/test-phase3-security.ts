import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { isAllowedImageHost, isValidImageUrl, ALLOWED_IMAGE_HOST_PATTERNS } from "../lib/utils";

async function runPhase3Tests() {
  console.log("====================================================================");
  console.log("🛡️  TESTES DE SEGURANÇA E VALIDAÇÃO DA FASE 3 (SSRF & CI/CD HARDENING)");
  console.log("====================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------------------
  // 1. TESTES UNITÁRIOS: isAllowedImageHost (Domínios Autorizados)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [1/5] Testando Aceitação de Domínios e CDNs Oficiais Autorizadas...");

  const validUrls = [
    "https://blog.playstation.com/tachyon/2026/01/ps5-pro.jpg",
    "https://news.xbox.com/wp-content/uploads/hero.png",
    "https://xboxwire.thesourcemediaassets.com/assets/game-pass-banner.jpg",
    "https://store-images.s-microsoft.com/image/apps.12345.jpg",
    "https://nintendoeverything.com/wp-content/uploads/switch2.jpg",
    "https://cdn.mos.cms.futurecdn.net/pcgamer-review.jpg",
    "https://assetsio.gnwcdn.com/eurogamer-guide.jpg",
    "https://assets.reedpopservices.com/reedpop-logo.png",
    "https://assets-prd.ignimgs.com/ign-special.jpg",
    "https://www.videogameschronicle.com/vgc-news.jpg",
    "https://gematsu.com/wp-content/uploads/gematsu-art.jpg",
    "https://www.destructoid.com/destructoid-preview.jpg",
    "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/header.jpg",
    "https://store.fastly.steamstatic.com/apps/capsule.jpg",
    "https://media.rawg.io/media/games/cover.jpg",
    "https://images.igdb.com/igdb/image/upload/t_cover_big/co123.jpg",
    "https://m.media-amazon.com/images/I/71xyz.jpg",
    "https://images.kabum.com.br/produtos/fotos/placa.jpg",
    "https://assets.nuuvem.com/assets/game.jpg",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200",
    "https://preview.redd.it/leak-screenshot.jpg",
    "https://i.redd.it/rumor-doc.png",
  ];

  for (const url of validUrls) {
    const host = new URL(url).hostname;
    assert(isAllowedImageHost(url), `Permite host oficial autorizado: ${host}`);
  }

  // ----------------------------------------------------------------------------
  // 2. TESTES UNITÁRIOS: isAllowedImageHost (Mitigação de SSRF e Redes Internas)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [2/5] Testando Bloqueio de Alvos SSRF, Redes Privadas e Bypass Attempts...");

  const ssrfPayloads = [
    { url: "http://169.254.169.254/latest/meta-data/", desc: "AWS/GCP Instance Metadata Service (IMDS)" },
    { url: "http://169.254.1.1/secret", desc: "Link-Local RFC 3927 subnet" },
    { url: "http://localhost:3000/api/admin", desc: "Localhost HTTP" },
    { url: "https://localhost/metrics", desc: "Localhost HTTPS" },
    { url: "http://127.0.0.1:8080/internal", desc: "IPv4 Loopback standard" },
    { url: "http://127.0.0.2/admin", desc: "IPv4 Loopback extended range" },
    { url: "http://[::1]/flag", desc: "IPv6 Loopback" },
    { url: "http://10.0.0.1/admin-panel", desc: "RFC 1918 Class A (10.0.0.0/8)" },
    { url: "http://192.168.1.1/router", desc: "RFC 1918 Class C (192.168.0.0/16)" },
    { url: "http://172.16.0.5/cluster", desc: "RFC 1918 Class B (172.16.0.0/12)" },
    { url: "http://172.31.255.254/service", desc: "RFC 1918 Class B upper boundary" },
    { url: "http://100.64.0.1/internal", desc: "Carrier-Grade NAT RFC 6598" },
    { url: "http://metadata.google.internal/computeMetadata/v1/", desc: "Google Cloud Metadata DNS" },
    { url: "https://evil-attacker.com/malicious.jpg", desc: "Domínio não autorizado de atacante" },
    { url: "https://steamstatic.com.evil.com/fake.png", desc: "Tentativa de bypass por sufixo em subdomínio" },
    { url: "https://fake-steamstatic.com/image.jpg", desc: "Tentativa de bypass por prefixo similar" },
    { url: "https://media-amazon.com.attacker.com/phishing.jpg", desc: "Tentativa de bypass de e-commerce parceiro" },
    { url: "file:///etc/passwd", desc: "Esquema file:// proibido" },
    { url: "javascript:alert(1)", desc: "Esquema javascript: proibido" },
    { url: "", desc: "URL vazia" },
  ];

  for (const item of ssrfPayloads) {
    const isAllowed = isAllowedImageHost(item.url);
    assert(!isAllowed, `Bloqueia vetor SSRF: ${item.desc}`);
  }

  // ----------------------------------------------------------------------------
  // 3. TESTE DE INTEGRAÇÃO: isValidImageUrl
  // ----------------------------------------------------------------------------
  console.log("\n📌 [3/5] Testando Defesa em Profundidade em isValidImageUrl()...");

  assert(
    isValidImageUrl("https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200"),
    "isValidImageUrl aceita imagem válida de host autorizado"
  );
  assert(
    !isValidImageUrl("https://evil.com/pic.jpg"),
    "isValidImageUrl rejeita imagem válida em formato mas com host não autorizado"
  );
  assert(
    !isValidImageUrl("http://169.254.169.254/latest/meta-data/image.png"),
    "isValidImageUrl bloqueia tentativa de SSRF"
  );
  assert(
    !isValidImageUrl("https://blog.playstation.com/podcast.mp3"),
    "isValidImageUrl rejeita arquivos de áudio .mp3"
  );
  assert(
    !isValidImageUrl("https://blog.playstation.com/placeholder.svg"),
    "isValidImageUrl rejeita SVGs de placeholder"
  );
  assert(
    !isValidImageUrl("https://images.nintendolife.com/cover.jpg"),
    "isValidImageUrl rejeita CDN com Cloudflare Bot Challenge"
  );

  // ----------------------------------------------------------------------------
  // 4. AUDITORIA ESTÁTICA: next.config.ts & Workflows do GitHub Actions
  // ----------------------------------------------------------------------------
  console.log("\n📌 [4/5] Auditando next.config.ts e Workflows de CI/CD...");

  // Auditoria do next.config.ts
  const nextConfigContent = fs.readFileSync(path.resolve("next.config.ts"), "utf8");
  const hasGlobalWildcard =
    nextConfigContent.includes('hostname: "**"') ||
    nextConfigContent.includes("hostname: '**'") ||
    nextConfigContent.includes('hostname: "*"');
  assert(!hasGlobalWildcard, "next.config.ts NÃO contém wildcards globais '**' ou '*'");

  const requiredHostsInConfig = [
    "*.playstation.com",
    "*.xbox.com",
    "*.s-microsoft.com",
    "*.thesourcemediaassets.com",
    "*.nintendolife.com",
    "*.nintendo.com",
    "nintendoeverything.com",
    "cdn.mos.cms.futurecdn.net",
    "*.futurecdn.net",
    "*.pcgamer.com",
    "assets.reedpopservices.com",
    "*.reedpopservices.com",
    "*.gnwcdn.com",
    "*.eurogamer.net",
    "*.gamesindustry.biz",
    "*.steamstatic.com",
    "*.steampowered.com",
    "*.epicgames.com",
    "media.rawg.io",
    "images.igdb.com",
    "*.media-amazon.com",
    "*.kabum.com.br",
    "*.nuuvem.com",
    "images.unsplash.com",
    "*.ign.com",
    "*.ignimgs.com",
    "*.gamespot.com",
    "*.polygon.com",
    "*.videogameschronicle.com",
    "*.gematsu.com",
    "*.rockpapershotgun.com",
    "*.destructoid.com",
    "*.redd.it",
    "*.gamespress.com",
  ];

  for (const host of requiredHostsInConfig) {
    assert(
      nextConfigContent.includes(host),
      `next.config.ts remotePatterns contém host obrigatório: ${host}`
    );
  }

  // Validação do limite de 50 elementos do Next.js 15
  const remotePatternsCount = (nextConfigContent.match(/protocol:\s*["']https["']/g) || []).length;
  assert(
    remotePatternsCount > 0 && remotePatternsCount <= 50,
    `next.config.ts contém ${remotePatternsCount} entradas em remotePatterns (conforme com limite de 50 do Next.js 15)`
  );

  // Auditoria do Workflow de Newsletter (Expression Injection)
  const newsletterWorkflowPath = path.resolve(".github/workflows/cron-weekly-newsletter.yml");
  const newsletterWorkflowContent = fs.readFileSync(newsletterWorkflowPath, "utf8");

  // Regex para detectar interpolação direta ${{ github.event.inputs... }} dentro de blocos de execução
  const runBlocks = newsletterWorkflowContent.match(/run:\s*\|([\s\S]*?)(?=\n\s*[a-zA-Z0-9_-]+:|$)/g) || [];
  let foundDirectInterpolation = false;
  for (const runBlock of runBlocks) {
    if (/\$\{\{\s*github\.event\.inputs/i.test(runBlock)) {
      foundDirectInterpolation = true;
    }
  }
  assert(
    !foundDirectInterpolation,
    "cron-weekly-newsletter.yml NÃO possui interpolação direta ${{ github.event.inputs }} dentro de run: |"
  );
  assert(
    newsletterWorkflowContent.includes("INPUT_TEST_EMAIL: ${{ github.event.inputs.test_email }}"),
    "cron-weekly-newsletter.yml mapeia test_email para variável de ambiente INPUT_TEST_EMAIL"
  );
  assert(
    newsletterWorkflowContent.includes("INPUT_DRY_RUN: ${{ github.event.inputs.dry_run }}"),
    "cron-weekly-newsletter.yml mapeia dry_run para variável de ambiente INPUT_DRY_RUN"
  );
  assert(
    newsletterWorkflowContent.includes("grep -Eq"),
    "cron-weekly-newsletter.yml contém validação estrita de formato de e-mail"
  );

  // Auditoria dos outros workflows
  const syncNewsWorkflow = fs.readFileSync(path.resolve(".github/workflows/cron-sync-news.yml"), "utf8");
  assert(
    !syncNewsWorkflow.includes("${{ github.event.inputs"),
    "cron-sync-news.yml não contém interpolação direta de inputs"
  );

  const discordDealsWorkflow = fs.readFileSync(path.resolve(".github/workflows/cron-discord-deals.yml"), "utf8");
  assert(
    !discordDealsWorkflow.includes("${{ github.event.inputs"),
    "cron-discord-deals.yml não contém interpolação direta de inputs"
  );

  // ----------------------------------------------------------------------------
  // 5. VALIDAÇÃO DE COMPATIBILIDADE: Imagens Reais no Banco de Dados (Supabase)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [5/5] Validando Compatibilidade com Imagens Existentes no Banco...");

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes("your-project")) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const { data: posts, error } = await supabase.from("posts").select("id, title, cover_image_url");

    if (error) {
      console.warn("  ⚠️ Não foi possível consultar o Supabase:", error.message);
    } else if (posts && posts.length > 0) {
      let compatibleCount = 0;
      let incompatibleUrls: string[] = [];

      for (const p of posts) {
        if (!p.cover_image_url) continue;
        if (isAllowedImageHost(p.cover_image_url)) {
          compatibleCount++;
        } else {
          incompatibleUrls.push(p.cover_image_url);
        }
      }

      assert(
        incompatibleUrls.length === 0,
        `Todas as imagens de matérias ativas (${compatibleCount} itens) são 100% compatíveis com a nova política restritiva`,
        incompatibleUrls.length > 0 ? `Incompatíveis: ${incompatibleUrls.join(", ")}` : undefined
      );
    }
  } else {
    console.log("  ℹ️ Supabase não configurado no ambiente local; ignorando checagem remota.");
  }

  // ----------------------------------------------------------------------------
  // RESUMO
  // ----------------------------------------------------------------------------
  console.log("\n====================================================================");
  console.log(`📊 RESULTADO FINAL DA FASE 3: ${passed} Passaram, ${failed} Falharam`);
  console.log("====================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests();

