import { AffiliateProduct } from "@/types/database";

export interface AffiliateMatchResult {
  processedContent: string;
  matchedProducts: AffiliateProduct[];
  linksCount: number;
}

export interface AffiliateMatchOptions {
  maxLinks?: number;
  postId?: string | null;
}

interface FlattenedKeyword {
  keyword: string;
  product: AffiliateProduct;
}

/**
 * Escapa caracteres especiais para uso seguro em Expressões Regulares
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Injeta links contextuais de afiliados no conteúdo Markdown de uma notícia.
 *
 * Diretrizes E-E-A-T e Google Search:
 * - Adiciona estritamente `rel="sponsored nofollow"` e `target="_blank"`.
 * - Limita a densidade para 2 a 3 links contextuais por artigo.
 * - Evita substituições dentro de cabeçalhos (#, ##, ###), blocos de código ou links pré-existentes.
 */
export function injectAffiliateLinks(
  content: string,
  products: AffiliateProduct[],
  options: AffiliateMatchOptions = {}
): AffiliateMatchResult {
  const { maxLinks = 3, postId = null } = options;

  if (!content || !products || products.length === 0 || maxLinks <= 0) {
    return {
      processedContent: content,
      matchedProducts: [],
      linksCount: 0,
    };
  }

  // Filtrar apenas produtos ativos com affiliate_url válida
  const activeProducts = products.filter(
    (p) => p.is_active && p.affiliate_url && p.keywords && p.keywords.length > 0
  );

  if (activeProducts.length === 0) {
    return {
      processedContent: content,
      matchedProducts: [],
      linksCount: 0,
    };
  }

  // Aplainar lista de keywords associadas a cada produto
  const keywordMap: FlattenedKeyword[] = [];
  for (const product of activeProducts) {
    for (const kw of product.keywords) {
      const cleanKw = kw.trim();
      if (cleanKw.length >= 3) {
        keywordMap.push({ keyword: cleanKw, product });
      }
    }
  }

  // Ordenar palavras-chave por tamanho decrescente para priorizar termos mais específicos
  // (ex: "PlayStation 5 Pro" antes de "PS5", "GeForce RTX 4070" antes de "RTX")
  keywordMap.sort((a, b) => b.keyword.length - a.keyword.length);

  const matchedProducts: AffiliateProduct[] = [];
  const usedProductIds = new Set<string>();
  let currentLinksCount = 0;

  // Processar parágrafo a parágrafo para proteger títulos Markdown e tabelas/código
  const lines = content.split("\n");
  const processedLines: string[] = [];
  let inCodeBlock = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    // Toggle de bloco de código fenced (```)
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(line);
      continue;
    }

    // Se estiver em bloco de código ou for cabeçalho (# ...), não injeta links
    if (inCodeBlock || trimmed.startsWith("#")) {
      processedLines.push(line);
      continue;
    }

    // Se a cota limite de links já foi atingida, preserva o restante do texto inalterado
    if (currentLinksCount >= maxLinks) {
      processedLines.push(line);
      continue;
    }

    let modifiedLine = line;

    // Tentar casar palavras-chave na linha atual
    for (const { keyword, product } of keywordMap) {
      if (currentLinksCount >= maxLinks) break;
      if (usedProductIds.has(product.id)) continue;

      // Regex para match com limites de palavra ou pontuação
      // Protege contra correspondência dentro de tags HTML ou links markdown existentes
      const escaped = escapeRegExp(keyword);
      const regex = new RegExp(`(?<!\\[)(?<!<[^>]*)\\b(${escaped})\\b(?![^\\[]*\\])(?![^<]*>)`, "i");

      const match = regex.exec(modifiedLine);
      if (match) {
        const matchedText = match[0];
        const matchIndex = match.index;

        // Verificar se a ocorrência não está dentro de um link markdown [texto](url) ou tag <a>
        const textBefore = modifiedLine.substring(0, matchIndex);
        const textAfter = modifiedLine.substring(matchIndex + matchedText.length);

        const openMarkdownLinks = (textBefore.match(/\[/g) || []).length;
        const closeMarkdownLinks = (textBefore.match(/\]/g) || []).length;
        const insideMarkdownBracket = openMarkdownLinks > closeMarkdownLinks;

        const openAnchorTags = (textBefore.match(/<a\b/gi) || []).length;
        const closeAnchorTags = (textBefore.match(/<\/a>/gi) || []).length;
        const insideAnchorTag = openAnchorTags > closeAnchorTags;

        if (!insideMarkdownBracket && !insideAnchorTag) {
          // Montar URL de saída protegida via redirect e tracking
          const outUrl = `/api/out/${encodeURIComponent(product.id)}${
            postId ? `?postId=${encodeURIComponent(postId)}` : ""
          }`;

          // Formatar tag HTML com rel="sponsored nofollow" e target="_blank" (Obrigatório Google E-E-A-T)
          const affiliateAnchor = `<a href="${outUrl}" rel="sponsored nofollow" target="_blank" class="affiliate-link font-semibold text-brand-purple hover:text-brand-cyan underline decoration-brand-purple/40 hover:decoration-brand-cyan transition-colors" title="Ver ${product.title} na ${product.store_name}">${matchedText}</a>`;

          modifiedLine =
            textBefore +
            affiliateAnchor +
            textAfter;

          usedProductIds.add(product.id);
          matchedProducts.push(product);
          currentLinksCount++;
        }
      }
    }

    processedLines.push(modifiedLine);
  }

  return {
    processedContent: processedLines.join("\n"),
    matchedProducts,
    linksCount: currentLinksCount,
  };
}
