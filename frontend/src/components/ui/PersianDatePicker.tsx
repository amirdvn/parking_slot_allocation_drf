// src/components/ui/PersianDatePicker.tsx
import DatePickerModule from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Calendar, Clock } from "lucide-react";

const DatePicker: any = (DatePickerModule as any).default || DatePickerModule;

interface PersianDatePickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function PersianDatePicker({
  label,
  value,
  onChange,
  error,
}: PersianDatePickerProps) {
  const currentDate = value ? new Date(value) : null;
  const hasDate = !!currentDate;

  const handleDateChange = (dateObj: any) => {
    if (!dateObj) {
      onChange("");
      return;
    }
    const newDate = dateObj.toDate();
    if (currentDate) {
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);
    } else {
      newDate.setHours(12, 0, 0, 0);
    }
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value;
    if (!timeStr || !currentDate) return;

    const [hours, minutes] = timeStr.split(":").map(Number);
    const newDate = new Date(currentDate);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate.toISOString());
  };

  const timeValue = currentDate
    ? `${currentDate.getHours().toString().padStart(2, "0")}:${currentDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    : "";

  const baseInputClass = `w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-gray-900 outline-none shadow-sm transition-all placeholder:text-gray-400 focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20 dark:bg-[#1c1c1e] dark:text-white dark:shadow-none ${
    error
      ? "border-[#ff3b30] focus:border-[#ff3b30] focus:ring-[#ff3b30]/20 dark:border-[#ff453a]"
      : "border-gray-200 dark:border-[#38383a]"
  }`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* ۱. انتخاب تاریخ */}
        <div className="relative flex-[1.5]">
          <DatePicker
            value={currentDate || ""}
            onChange={handleDateChange}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            format="YYYY/MM/DD"
            placeholder="انتخاب تاریخ"
            inputClass={`${baseInputClass} pl-10`}
            containerClassName="w-full"
            style={{ width: "100%" }}
          />
          <Calendar
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
        </div>

        {/* ۲. انتخاب ساعت */}
        <div className="relative flex-1">
          <input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={!hasDate}
            dir="ltr"
            className={`${baseInputClass} pl-10 text-center ${
              !hasDate ? "cursor-not-allowed opacity-50" : ""
            }`}
            placeholder="ساعت"
          />
          <Clock
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
        </div>
      </div>

      {error && (
        <span className="text-xs text-[#ff3b30] dark:text-[#ff453a]">{error}</span>
      )}
    </div>
  );
}