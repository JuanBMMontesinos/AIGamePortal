import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParamKey?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParamKey = "page",
  className = "",
}: PaginationProps) {
  // Se houver apenas 1 página (ou nenhuma), não renderiza nada para máxima discrição
  if (totalPages <= 1) {
    return null;
  }

  const buildUrl = (page: number) => {
    const [path, queryString] = baseUrl.split("?");
    const params = new URLSearchParams(queryString || "");

    if (page <= 1) {
      params.delete(searchParamKey);
    } else {
      params.set(searchParamKey, page.toString());
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  // Algoritmo de janela discreta de páginas (1 ... 4 5 6 ... 12)
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];

    // Sempre inclui a primeira página
    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("ellipsis");
    }

    // Sempre inclui a última página
    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Navegação entre páginas de matérias"
      className={`flex items-center justify-center gap-1.5 pt-6 pb-2 text-xs font-medium select-none ${className}`}
    >
      {/* Botão Anterior */}
      {hasPrev ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-gamer-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-gamer-800/70 transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-zinc-200/50 dark:border-gamer-800/40 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
          aria-disabled="true"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </span>
      )}

      {/* Números das Páginas */}
      <div className="flex items-center gap-1">
        {pages.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-7 h-8 inline-flex items-center justify-center text-zinc-400 dark:text-zinc-600"
              >
                …
              </span>
            );
          }

          const isCurrent = item === currentPage;

          return isCurrent ? (
            <span
              key={item}
              aria-current="page"
              className="min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-lg bg-brand-purple/15 text-brand-purple dark:text-purple-300 border border-brand-purple/35 font-semibold"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={buildUrl(item)}
              className="min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-gamer-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-gamer-800/70 transition-colors"
            >
              {item}
            </Link>
          );
        })}
      </div>

      {/* Botão Próxima */}
      {hasNext ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-gamer-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-gamer-800/70 transition-colors"
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-zinc-200/50 dark:border-gamer-800/40 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      )}
    </nav>
  );
}
