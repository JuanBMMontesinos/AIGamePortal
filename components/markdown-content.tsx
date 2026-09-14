import * as React from "react";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  // Divide o conteúdo em blocos por linhas em branco
  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <div className="article-content space-y-6 text-zinc-700 dark:text-zinc-300 leading-relaxed text-base sm:text-lg">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // H2
        if (trimmed.startsWith("## ")) {
          const text = trimmed.replace(/^##\s+/, "");
          return (
            <h2 key={idx} className="text-2xl sm:text-3xl font-extrabold tracking-tight pt-4 text-zinc-900 dark:text-white">
              {renderInline(text)}
            </h2>
          );
        }

        // H3
        if (trimmed.startsWith("### ")) {
          const text = trimmed.replace(/^###\s+/, "");
          return (
            <h3 key={idx} className="text-xl sm:text-2xl font-bold tracking-tight pt-2 text-zinc-900 dark:text-white">
              {renderInline(text)}
            </h3>
          );
        }

        // Blockquote
        if (trimmed.startsWith("> ")) {
          const text = trimmed.replace(/^>\s+/, "");
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-brand-purple pl-4 py-2 my-4 italic text-zinc-600 dark:text-zinc-300 bg-brand-purple/5 rounded-r-xl"
            >
              {renderInline(text)}
            </blockquote>
          );
        }

        // Unordered List
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n/).filter((line) => line.trim().length > 0);
          return (
            <ul key={idx} className="list-disc pl-6 space-y-2 my-4">
              {items.map((item, itemIdx) => {
                const itemText = item.replace(/^[-*]\s+/, "");
                return <li key={itemIdx}>{renderInline(itemText)}</li>;
              })}
            </ul>
          );
        }

        // Parágrafo padrão
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Processador inline com suporte a:
 * 1. Tags HTML <a> (como as geradas pelo injetor de afiliados com rel="sponsored nofollow")
 * 2. Links Markdown [texto](url)
 * 3. Negrito **texto**
 * 4. Itálico *texto*
 */
function renderInline(text: string): React.ReactNode {
  // Regex para capturar tags <a>, links markdown, bold e italic
  const tokenRegex = /(<a\s+[^>]*>.*?<\/a>|\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*)/gs;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // 1. Tag HTML <a> (Injeção de Afiliado ou Link Rico)
    if (part.startsWith("<a ") && part.endsWith("</a>")) {
      const anchorMatch = part.match(/^<a\s+([^>]*)>(.*?)<\/a>$/s);
      if (anchorMatch) {
        const attrsString = anchorMatch[1];
        const innerText = anchorMatch[2];

        const hrefMatch = attrsString.match(/href="([^"]+)"/i);
        const relMatch = attrsString.match(/rel="([^"]+)"/i);
        const targetMatch = attrsString.match(/target="([^"]+)"/i);
        const titleMatch = attrsString.match(/title="([^"]+)"/i);
        const classMatch = attrsString.match(/class="([^"]+)"/i);

        const href = hrefMatch ? hrefMatch[1] : "#";
        const isAffiliate = href.startsWith("/api/out/");
        const rel = relMatch ? relMatch[1] : (isAffiliate ? "sponsored nofollow" : undefined);
        const target = targetMatch ? targetMatch[1] : (isAffiliate ? "_blank" : undefined);
        const title = titleMatch ? titleMatch[1] : undefined;
        const className = classMatch
          ? classMatch[1]
          : isAffiliate
          ? "affiliate-link font-semibold text-brand-purple hover:text-brand-cyan underline decoration-brand-purple/40 hover:decoration-brand-cyan transition-colors"
          : "text-brand-purple hover:underline";

        return (
          <a
            key={i}
            href={href}
            rel={rel}
            target={target}
            title={title}
            className={className}
          >
            {renderInline(innerText)}
          </a>
        );
      }
    }

    // 2. Link Markdown padrão [texto](url)
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const mdLinkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/s);
      if (mdLinkMatch) {
        const innerText = mdLinkMatch[1];
        const href = mdLinkMatch[2];
        const isAffiliate = href.startsWith("/api/out/");
        const isExternal = href.startsWith("http://") || href.startsWith("https://");

        return (
          <a
            key={i}
            href={href}
            rel={
              isAffiliate
                ? "sponsored nofollow"
                : isExternal
                ? "noopener noreferrer"
                : undefined
            }
            target={isAffiliate || isExternal ? "_blank" : undefined}
            className={
              isAffiliate
                ? "affiliate-link font-semibold text-brand-purple hover:text-brand-cyan underline decoration-brand-purple/40 hover:decoration-brand-cyan transition-colors"
                : "text-brand-purple hover:underline"
            }
          >
            {renderInline(innerText)}
          </a>
        );
      }
    }

    // 3. Negrito **texto**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-zinc-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 4. Itálico *texto*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }

    // Texto puro
    return part;
  });
}
