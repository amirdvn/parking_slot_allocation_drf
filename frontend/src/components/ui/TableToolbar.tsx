// src/components/ui/TableToolbar.tsx
import { Search, X, SlidersHorizontal } from "lucide-react";

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

  const activeFilterCount =
    (searchValue ? 1 : 0) + (filterValue && filterValue !== "" ? 1 : 0);

  const clearAll = () => {
    onSearchChange("");
    if (onFilterChange) onFilterChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-border bg-surface py-3 pr-10 pl-10 text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/60 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-secondary transition-colors hover:bg-background hover:text-danger"
              aria-label="پاک کردن جستجو"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter */}
        {hasFilter && (
          <div className="relative sm:w-56">
            <SlidersHorizontal
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-text-secondary"
            />
            <select
              value={filterValue}
              onChange={(e) => onFilterChange!(e.target.value)}
              aria-label={filterLabel || "فیلتر"}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface py-3 pr-9 pl-3 text-sm text-text-primary outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* نتایج */}
      {isFiltered && totalCount !== undefined && resultCount !== undefined && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
            فیلتر فعال
          </div>
          <span className="text-text-secondary">
            نمایش{" "}
            <span className="font-bold text-secondary-900">{resultCount}</span> از{" "}
            <span className="font-bold text-secondary-900">{totalCount}</span> رکورد
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="mr-auto flex items-center gap-1 rounded-full px-2 py-1 text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
          >
            <X size={12} />
            پاک کردن فیلترها
          </button>
        </div>
      )}
    </div>
  );
}

export default TableToolbar;