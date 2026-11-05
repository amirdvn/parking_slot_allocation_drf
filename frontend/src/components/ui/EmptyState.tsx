import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="rounded-full bg-background p-6 text-text-secondary">
        {icon || <Inbox size={48} />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-secondary-900">{title}</h3>
        {description && (
          <p className="max-w-md text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;