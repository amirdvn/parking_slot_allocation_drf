// src/components/shared/PageHeader.tsx
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  toolbar?: ReactNode;
}

function PageHeader({ title, subtitle, action, toolbar }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Title + Action - ارتفاع ثابت */}
      <div className="flex h-[64px] items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[22px] font-semibold leading-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 truncate text-[13px] text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Toolbar - ارتفاع ثابت 44px همیشه */}
      <div className="h-[44px]">{toolbar}</div>
    </div>
  );
}

export default PageHeader;