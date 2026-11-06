// src/components/ui/LicensePlateInput.tsx
import { useEffect, useRef, useState } from "react";
import { PERSIAN_PLATE_LETTERS, toLatinDigits } from "../../lib/parking-format";

interface PlateParts {
  province: string;
  letter: string;
  serial: string;
  city: string;
}

interface LicensePlateInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

function parseValue(value: string): PlateParts {
  if (!value) return { province: "", letter: "", serial: "", city: "" };
  const latin = toLatinDigits(value).replace(/[^0-9a-zA-Zآ-ی]/g, "");
  if (latin.length !== 8) return { province: "", letter: "", serial: "", city: "" };
  return {
    province: latin.slice(0, 2),
    letter: value.replace(/[^آ-یa-zA-Z]/g, "").charAt(0) || latin.charAt(2),
    serial: latin.slice(3, 6),
    city: latin.slice(6, 8),
  };
}

function LicensePlateInput({ value = "", onChange, error, label }: LicensePlateInputProps) {
  const [parts, setParts] = useState<PlateParts>(() => parseValue(value));

  const letterRef = useRef<HTMLSelectElement>(null);
  const serialRef = useRef<HTMLInputElement>(null);
  const provinceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const current = `${parts.province}${parts.letter}${parts.serial}${parts.city}`;
    if (value !== current) {
      setParts(parseValue(value));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: PlateParts) => {
    setParts(next);
    onChange(`${next.province}${next.letter}${next.serial}${next.city}`);
  };

  const handleCityChange = (raw: string) => {
    const cleaned = toLatinDigits(raw).replace(/[^0-9]/g, "").slice(0, 2);
    commit({ ...parts, city: cleaned });
    if (cleaned.length === 2) letterRef.current?.focus();
  };

  const handleLetterChange = (raw: string) => {
    const cleaned = raw.replace(/[^آ-یa-zA-Z]/g, "").slice(0, 1);
    commit({ ...parts, letter: cleaned });
    if (cleaned.length === 1) serialRef.current?.focus();
  };

  const handleSerialChange = (raw: string) => {
    const cleaned = toLatinDigits(raw).replace(/[^0-9]/g, "").slice(0, 3);
    commit({ ...parts, serial: cleaned });
    if (cleaned.length === 3) provinceRef.current?.focus();
  };

  const handleProvinceChange = (raw: string) => {
    const cleaned = toLatinDigits(raw).replace(/[^0-9]/g, "").slice(0, 2);
    commit({ ...parts, province: cleaned });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const parsed = parseValue(pasted);
    if (parsed.province && parsed.letter && parsed.serial && parsed.city) {
      commit(parsed);
    }
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* کانتینر اصلی پلاک */}
      <div
        dir="ltr"
        onPaste={handlePaste}
        className={`flex h-[60px] w-full max-w-[340px] overflow-hidden rounded-md border-[3px] border-[#333] bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#007aff]/50 dark:border-gray-600 ${
          error ? "border-[#ff3b30] dark:border-[#ff453a]" : ""
        }`}
      >
        {/* نوار آبی ایران (سمت چپ) */}
        <div className="flex w-[36px] shrink-0 flex-col items-center justify-center border-r-[3px] border-[#333] bg-[#003399] dark:border-gray-600">
          <span className="text-[8px] font-bold leading-none text-white">I.R.</span>
          <span className="text-[9px] font-bold leading-none text-white">IRAN</span>
          <div className="mt-1 h-2.5 w-4 overflow-hidden rounded-[1px] border border-white/30">
            <div className="h-1/3 w-full bg-green-500"></div>
            <div className="h-1/3 w-full bg-white"></div>
            <div className="h-1/3 w-full bg-red-500"></div>
          </div>
        </div>

        {/* ۱. عدد دوتایی (کد شهر) */}
        <div className="flex flex-1 flex-col items-center justify-center border-r border-gray-300">
          <span className="mt-0.5 text-[9px] font-medium text-gray-500">شماره</span>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={parts.city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="--"
            maxLength={2}
            className="w-full bg-transparent text-center font-mono text-[20px] font-bold text-black outline-none placeholder:text-gray-200"
          />
        </div>

        {/* ۲. حروف */}
        <div className="flex w-[44px] flex-col items-center justify-center border-r border-gray-300">
          <span className="mt-0.5 text-[9px] font-medium text-gray-500">حرف</span>
          <select
            ref={letterRef}
            value={parts.letter}
            onChange={(e) => handleLetterChange(e.target.value)}
            className="w-full cursor-pointer appearance-none bg-transparent text-center text-[20px] font-bold text-black outline-none"
            style={{ textAlignLast: "center" }}
          >
            <option value="" disabled hidden></option>
            {PERSIAN_PLATE_LETTERS.map((l) => (
              <option key={l} value={l} className="text-black">
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* ۳. عدد سه تایی (سریال) */}
        <div className="flex flex-[1.5] flex-col items-center justify-center border-r-[3px] border-[#333] dark:border-gray-600">
          <span className="mt-0.5 text-[9px] font-medium text-gray-500">سریال</span>
          <input
            ref={serialRef}
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={parts.serial}
            onChange={(e) => handleSerialChange(e.target.value)}
            placeholder="---"
            maxLength={3}
            className="w-full bg-transparent text-center font-mono text-[20px] font-bold text-black outline-none placeholder:text-gray-200"
          />
        </div>

        {/* ۴. استان (سمت راست) */}
        <div className="flex w-[56px] flex-col items-center justify-center">
          <span className="mt-0.5 text-[9px] font-medium text-gray-500">استان</span>
          <input
            ref={provinceRef}
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={parts.province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            placeholder="--"
            maxLength={2}
            className="w-full bg-transparent text-center font-mono text-[20px] font-bold text-black outline-none placeholder:text-gray-200"
          />
        </div>
      </div>

      {error && (
        <span className="text-xs text-[#ff3b30] dark:text-[#ff453a]">{error}</span>
      )}
    </div>
  );
}

export default LicensePlateInput;