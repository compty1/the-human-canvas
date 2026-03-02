import { useState, useMemo } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

export type SortOption = {
  label: string;
  key: string;
  direction: "asc" | "desc";
};

interface AdminListControlsProps<T> {
  items: T[];
  sortOptions: SortOption[];
  pageSize?: number;
  children: (paginatedItems: T[]) => React.ReactNode;
}

export function useAdminListControls<T>(
  items: T[],
  sortOptions: SortOption[],
  pageSize = 20
) {
  const [sortIndex, setSortIndex] = useState(0);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const opt = sortOptions[sortIndex];
    if (!opt) return items;
    return [...items].sort((a, b) => {
      const aVal = (a as any)[opt.key];
      const bVal = (b as any)[opt.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string"
        ? aVal.localeCompare(bVal)
        : aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return opt.direction === "asc" ? cmp : -cmp;
    });
  }, [items, sortOptions, sortIndex]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    sortIndex,
    setSortIndex,
    page: safePage,
    setPage,
    totalPages,
    sorted,
    paginated,
    sortOptions,
  };
}

interface SortPaginationBarProps {
  sortOptions: SortOption[];
  sortIndex: number;
  onSortChange: (index: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

export const SortPaginationBar = ({
  sortOptions,
  sortIndex,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  totalItems,
}: SortPaginationBarProps) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Sort */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <select
          value={sortIndex}
          onChange={(e) => {
            onSortChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="text-sm border-2 border-foreground bg-background px-2 py-1 font-bold"
        >
          {sortOptions.map((opt, i) => (
            <option key={i} value={i}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 border-2 border-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-sm font-bold">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 border-2 border-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
