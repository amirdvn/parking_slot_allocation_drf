// src/components/ui/Pagination.tsx
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

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) { start = 2; end = 4; }
      if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-3 border-t border-gray-100 p-4 dark:border-[#38383a] sm:flex-row sm:justify-between">
      {totalItems !== undefined && (
        <p className="text-[12px] text-gray-500 dark:text-gray-400">
          نمایش {Math.min((currentPage - 1) * pageSize + 1, totalItems)} تا{" "}
          {Math.min(currentPage * pageSize, totalItems)} از {totalItems}
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-[#2c2c2e]"
          aria-label="قبل"
        >
          <ChevronRight size={16} />
        </button>

        {getPageNumbers().map((page, idx) =>
          typeof page === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] rounded-lg px-2 py-1 text-[13px] font-medium transition-colors ${
                page === currentPage
                  ? "bg-[#007aff] text-white dark:bg-[#0a84ff]"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-1 text-gray-400">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-[#2c2c2e]"
          aria-label="بعد"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;