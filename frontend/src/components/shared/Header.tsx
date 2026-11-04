
import { Bell, Menu, Search, UserCircle } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

function Header({ onMenuClick, title }: HeaderProps) {
  return (
    <header
      dir="rtl"
      className="flex h-20 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-text-secondary hover:bg-background lg:hidden"
          aria-label="باز کردن منو"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-secondary-900">
            {title}
          </h1>
          <p className="hidden text-xs text-text-secondary sm:block">
            به پنل مدیریت پارکینگ خوش آمدید
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label="جستجو"
        >
          <Search size={20} />
        </button>

        <button
          type="button"
          className="relative rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label="اعلان‌ها"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
        </button>

        <div className="mx-1 h-8 w-px bg-border" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-background"
        >
          <UserCircle size={28} className="text-primary-600" />

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-secondary-900">
              مدیر سیستم
            </p>
            <p className="text-xs text-text-secondary">
              مدیر کل
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
