import * as React from "react";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  // Split into blocks by double newlines
  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <div className="article-content space-y-6">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // H2
        if (trimmed.startsWith("## ")) {
          const text = trimmed.replace(/^##\s+/, "");
          return (
            <h2 key={idx} className="text-2xl sm:text-3xl font-extrabold tracking-tight pt-4">
              {renderInline(text)}
            </h2>
          );
        }

        // H3
        if (trimmed.startsWith("### ")) {
          const text = trimmed.replace(/^###\s+/, "");
          return (
            <h3 key={idx} className="text-xl sm:text-2xl font-bold tracking-tight pt-2">
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

        // Regular paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Regex to split by bold **text** or *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-zinc-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
