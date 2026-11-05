import { Search, X } from "lucide-react";
import Input from "./Input";
import Select from "./Select";

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
  const isFiltered = searchValue || (filterValue && filterValue !== "");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-border bg-surface py-3 pr-10 pl-10 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-danger"
                aria-label="پاک کردن جستجو"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter */}
        {hasFilter && (
          <div className="sm:w-56">
            <Select
              label={filterLabel}
              options={filterOptions}
              value={filterValue}
              onChange={(e) => onFilterChange!(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* نتایج */}
      {isFiltered && totalCount !== undefined && resultCount !== undefined && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>
            نمایش <span className="font-bold text-secondary-900">{resultCount}</span> از{" "}
            <span className="font-bold text-secondary-900">{totalCount}</span> رکورد
          </span>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              if (onFilterChange) onFilterChange("");
            }}
            className="text-primary-600 hover:underline"
          >
            پاک کردن فیلترها
          </button>
        </div>
      )}
    </div>
  );
}

export default TableToolbar;