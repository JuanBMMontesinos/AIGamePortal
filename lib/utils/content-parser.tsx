import * as React from "react";
import { MarkdownContent } from "@/components/markdown-content";

export interface SplitContentResult {
  beforeContent: string;
  afterContent: string;
  paragraphCount: number;
  hasInserted: boolean;
}

/**
 * Verifica se um bloco Markdown é um parágrafo de texto comum
 * (ignorando cabeçalhos, listas, citações, divisores e código)
 */
function isStandardParagraph(block: string): boolean {
  const trimmed = block.trim();
  if (!trimmed) return false;

  // Ignora cabeçalhos Markdown (#, ##, ###, etc.)
  if (/^#{1,6}\s/.test(trimmed)) return false;

  // Ignora blockquotes (> citação)
  if (trimmed.startsWith(">")) return false;

  // Ignora listas não-ordenadas ou ordenadas (- item, * item, 1. item)
  if (/^([-*]|\d+\.)\s/.test(trimmed)) return false;

  // Ignora blocos de código fenced (```)
  if (trimmed.startsWith("```")) return false;

  // Ignora divisores horizontais (--- ou ***)
  if (/^([-*_]){3,}$/.test(trimmed)) return false;

  // É um parágrafo de texto
  return true;
}

/**
 * Divide o conteúdo Markdown/HTML da matéria para inserção dinâmica de anúncio.
 *
 * @param content Conteúdo completo da matéria (Markdown ou HTML)
 * @param paragraphThreshold Número do parágrafo após o qual o anúncio deve ser inserido (padrão: 3)
 * @returns Objeto contendo o conteúdo antes e depois do ponto de inserção
 */
export function splitContentForMidArticleAd(
  content: string,
  paragraphThreshold: number = 3
): SplitContentResult {
  if (!content || !content.trim()) {
    return {
      beforeContent: "",
      afterContent: "",
      paragraphCount: 0,
      hasInserted: false,
    };
  }

  // Divide o texto em blocos por quebras de linha duplas
  const blocks = content.trim().split(/\n\s*\n/);

  let currentParagraphCount = 0;
  let splitBlockIndex = -1;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (isStandardParagraph(block)) {
      currentParagraphCount++;

      if (currentParagraphCount === paragraphThreshold) {
        splitBlockIndex = i;
        break;
      }
    }
  }

  // Se o artigo tiver menos parágrafos que o threshold (ex: matérias curtas ou comunicados rápidos),
  // insere após o último parágrafo encontrado ou na metade dos blocos
  if (splitBlockIndex === -1 && currentParagraphCount > 0) {
    // Localiza o último parágrafo disponível
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (isStandardParagraph(blocks[i])) {
        splitBlockIndex = i;
        break;
      }
    }
  }

  // Se não foi possível identificar nenhum parágrafo de texto, divide no meio dos blocos
  if (splitBlockIndex === -1) {
    splitBlockIndex = Math.max(0, Math.floor(blocks.length / 2) - 1);
  }

  const beforeBlocks = blocks.slice(0, splitBlockIndex + 1);
  const afterBlocks = blocks.slice(splitBlockIndex + 1);

  return {
    beforeContent: beforeBlocks.join("\n\n"),
    afterContent: afterBlocks.join("\n\n"),
    paragraphCount: currentParagraphCount,
    hasInserted: true,
  };
}

export interface ParsedArticleContentProps {
  content: string;
  adSlot?: React.ReactNode;
  paragraphThreshold?: number;
  className?: string;
}

/**
 * Componente que renderiza o conteúdo do artigo com o slot de anúncio
 * in-article-mid inserido de forma não-destrutiva após o 3º parágrafo.
 */
export function ParsedArticleContent({
  content,
  adSlot,
  paragraphThreshold = 3,
  className = "",
}: ParsedArticleContentProps) {
  if (!content) return null;

  // Se nenhum slot de anúncio for provido, renderiza o Markdown normal
  if (!adSlot) {
    return (
      <div className={className}>
        <MarkdownContent content={content} />
      </div>
    );
  }

  const { beforeContent, afterContent } = splitContentForMidArticleAd(
    content,
    paragraphThreshold
  );

  return (
    <div className={`article-body-parsed space-y-6 ${className}`}>
      {/* 1. Primeira metade do artigo (até o 3º parágrafo) */}
      {beforeContent && <MarkdownContent content={beforeContent} />}

      {/* 2. Slot de Anúncio Central Injetado Dinamicamente (in-article-mid) */}
      <div className="my-8 py-2 border-y border-zinc-200/50 dark:border-gamer-800/50">
        {adSlot}
      </div>

      {/* 3. Segunda metade do artigo (parágrafos restantes e conclusões) */}
      {afterContent && <MarkdownContent content={afterContent} />}
    </div>
  );
}
