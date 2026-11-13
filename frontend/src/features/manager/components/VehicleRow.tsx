// src/features/manager/components/VehicleRow.tsx
import { memo } from "react";
import type { ManagerVehicle } from "../../../types/manager";
import { formatPlate } from "../../../lib/parking-format";

const typeLabels: Record<string, string> = {
  CAR: "ماشین",
  MOTORCYCLE: "موتور",
  BICYCLE: "دوچرخه",
};

interface VehicleRowProps {
  vehicle: ManagerVehicle;
  owner?: {
    full_name: string;
    phone_number: string;
  };
  onToggleClick: (vehicle: ManagerVehicle) => void;
}

function VehicleRowComponent({ vehicle, owner, onToggleClick }: VehicleRowProps) {
  return (
    <tr className="hover:bg-background/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff] text-[12px] font-semibold text-white dark:bg-[#0a84ff]">
            {owner?.full_name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {owner?.full_name || `کاربر #${vehicle.user}`}
            </p>
            {owner?.phone_number && (
              <p className="truncate text-[11px] text-gray-500" dir="ltr">
                {owner.phone_number}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono font-medium text-gray-900 dark:text-white">
          {formatPlate(vehicle.plate_number)}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
        {typeLabels[vehicle.vehicle_type]}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            vehicle.is_active
              ? "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]"
              : "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500"
          }`}
        >
          {vehicle.is_active ? "فعال" : "غیرفعال"}
        </span>
      </td>
      <td className="px-4 py-3 text-left">
        <button
          onClick={() => onToggleClick(vehicle)}
          className="text-[12px] font-medium text-[#007aff] hover:underline dark:text-[#0a84ff]"
        >
          {vehicle.is_active ? "غیرفعال" : "فعال"}
        </button>
      </td>
    </tr>
  );
}

export const VehicleRow = memo(VehicleRowComponent);