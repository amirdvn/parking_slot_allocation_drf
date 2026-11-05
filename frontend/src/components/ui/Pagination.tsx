import { ChevronRight, ChevronLeft } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      }

      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4 sm:flex-row sm:justify-between">
      {totalItems !== undefined && (
        <p className="text-xs text-text-secondary">
          نمایش {Math.min((currentPage - 1) * pageSize + 1, totalItems)} تا{" "}
          {Math.min(currentPage * pageSize, totalItems)} از {totalItems} رکورد
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-border bg-surface p-2 text-text-secondary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="صفحه قبل"
        >
          <ChevronRight size={18} />
        </button>

        {getPageNumbers().map((page, idx) =>
          typeof page === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                page === currentPage
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-border bg-surface text-text-primary hover:bg-background"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-2 text-text-secondary">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-border bg-surface p-2 text-text-secondary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="صفحه بعد"
        >
          <ChevronLeft size={18} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;