// src/components/ui/TableToolbar.tsx
import { Search, X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  resultCount?: number;
  totalCount?: number;
}

function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "جستجو...",
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel,
  resultCount,
  totalCount,
}: TableToolbarProps) {
  const hasFilter = filterOptions && filterOptions.length > 0 && onFilterChange;
  const isFiltered = !!searchValue || (!!filterValue && filterValue !== "");

  const clearAll = () => {
    onSearchChange("");
    if (onFilterChange) onFilterChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-9 text-[14px] text-gray-900 outline-none shadow-sm transition-all placeholder:text-gray-400 focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20 dark:border-[#38383a] dark:bg-[#1c1c1e] dark:text-white dark:placeholder:text-gray-500 dark:shadow-none dark:focus:border-[#0a84ff] dark:focus:ring-[#0a84ff]/20"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#3a3a3c] dark:hover:text-gray-300"
              aria-label="پاک کردن"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {hasFilter && (
          <select
            value={filterValue}
            onChange={(e) => onFilterChange!(e.target.value)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-900 outline-none shadow-sm focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20 dark:border-[#38383a] dark:bg-[#1c1c1e] dark:text-white dark:shadow-none dark:focus:border-[#0a84ff] dark:focus:ring-[#0a84ff]/20 sm:w-44"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {isFiltered && totalCount !== undefined && resultCount !== undefined && (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-gray-500 dark:text-gray-400">
            نمایش <span className="font-medium text-gray-900 dark:text-white">{resultCount}</span> از{" "}
            <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span>
          </span>
          <button
            onClick={clearAll}
            className="text-[#007aff] hover:underline dark:text-[#0a84ff]"
          >
            پاک کردن فیلترها
          </button>
        </div>
      )}
    </div>
  );
}

export default TableToolbar;