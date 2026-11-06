// src/lib/parking-format.ts

export const zoneLabels: Record<string, string> = {
  NORTH: "بخش شمالی",
  SOUTH: "بخش جنوبی",
  WEST: "بخش غربی",
  EAST: "بخش شرقی",
};

export const floorLabels: Record<string, string> = {
  GROUND: "همکف",
  FLOOR_1: "طبقه ۱",
  FLOOR_2: "طبقه ۲",
  BASEMENT_1: "منفی ۱",
  BASEMENT_2: "منفی ۲",
};

export const spaceTypeLabels: Record<string, string> = {
  NORMAL: "عادی",
  GUEST: "مهمان",
  MANAGERS: "مدیران",
  DISABLED: "معلولین",
  MOTORCYCLE: "موتور",
  ELECTRIC: "برقی",
  LOADING: "بارگیری",
  EMERGENCY: "اضطراری",
};

/* =========================================
   Parking Space Helpers
========================================= */

function parseCode(code: string) {
  const parts = code.split("-");
  if (parts.length < 2) return null;

  const [zone, floor, ...rest] = parts;
  if (!zoneLabels[zone] || !floorLabels[floor]) return null;

  return { zone, floor, id: rest.join("-") };
}

export function formatSpaceCode(code?: string | null): string {
  if (!code) return "—";
  const parsed = parseCode(code);
  if (!parsed) return code;
  const { zone, floor, id } = parsed;
  return id
    ? `${zoneLabels[zone]} · ${floorLabels[floor]} · ${id}`
    : `${zoneLabels[zone]} · ${floorLabels[floor]}`;
}

export function formatSpacePlace(code?: string | null): string {
  if (!code) return "—";
  const parsed = parseCode(code);
  if (!parsed) return code;
  return `${zoneLabels[parsed.zone]} · ${floorLabels[parsed.floor]}`;
}

export function formatSpaceId(code?: string | null): string {
  if (!code) return "—";
  const parsed = parseCode(code);
  return parsed?.id || code;
}

export function spaceLabel(space: {
  code?: string | null;
  space_type?: string | null;
}): string {
  const base = formatSpaceCode(space.code);
  const type = space.space_type ? spaceTypeLabels[space.space_type] : undefined;
  return type ? `${base} — ${type}` : base;
}

/* =========================================
   License Plate Helpers
========================================= */

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const PERSIAN_PLATE_LETTERS = [
  "ب", "ج", "د", "س", "ص", "ط", "ق", "ل", "م", "ن", "و", "ه", "ی",
] as const;

export function toPersianDigits(str: string): string {
  return str.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[parseInt(d)]);
}

export function toLatinDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export interface PlateParts {
  province: string;
  letter: string;
  serial: string;
  city: string;
}

export function parsePlate(plate?: string | null): PlateParts | null {
  if (!plate) return null;
  const latin = toLatinDigits(plate).replace(/[^0-9a-zA-Zآ-ی]/g, "");
  if (latin.length !== 8) return null;

  const letter = plate.replace(/[^آ-یa-zA-Z]/g, "").charAt(0) || latin.charAt(2);

  return {
    province: latin.slice(0, 2),
    letter,
    serial: latin.slice(3, 6),
    city: latin.slice(6, 8),
  };
}

/**
 * فرمت‌بندی پلاک بر اساس نوع وسیله نقلیه
 * ماشین: «۶۷ ب ۳۴۵ ۱۲» (۴ بخشی)
 * موتور/دوچرخه: «۱۲۳ ۴۵۶۷۸» (۲ ردیفه)
 */
export function formatPlate(plate?: string | null, vehicleType?: string | null): string {
  if (!plate) return "—";
  const latin = toLatinDigits(plate).replace(/[^0-9a-zA-Zآ-ی]/g, "");

  // اگر موتور/دوچرخه بود، یا اصلا حرف نداشت و ۸ رقم بود
  if (vehicleType === "MOTORCYCLE" || vehicleType === "BICYCLE" || (!/[آ-یa-zA-Z]/.test(plate) && latin.length === 8)) {
    if (latin.length === 8) {
      return toPersianDigits(`${latin.slice(0, 3)} ${latin.slice(3, 8)}`);
    }
    return plate;
  }

  // فرمت ماشین
  const parts = parsePlate(plate);
  if (!parts) return plate;
  return toPersianDigits(`${parts.city} ${parts.letter} ${parts.serial} ${parts.province}`);
}

export function isCompletePlate(plate?: string | null): boolean {
  const parts = parsePlate(plate);
  return (
    !!parts &&
    parts.province.length === 2 &&
    parts.letter.length === 1 &&
    parts.serial.length === 3 &&
    parts.city.length === 2
  );
}