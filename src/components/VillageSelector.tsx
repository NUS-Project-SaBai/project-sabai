import { useState } from "react";
import { useVillageCode } from "@/lib/context/VillageCodeContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { HiChevronDown } from "react-icons/hi2";
import { clsx } from "clsx";
import LoadingSpinner from "./LoadingSpinner";

export default function VillageSelector() {
  const {
    selectedVillageCodeId,
    setSelectedVillageCodeId,
    villageCodes,
    isLoading,
  } = useVillageCode();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const selectedVillage = villageCodes?.find(
    (v) => v.id === selectedVillageCodeId,
  );

  if (isLoading) {
    return (
      <div className="w-52 flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
        <LoadingSpinner message="" />
        <span className="text-sm text-slate-600">Loading villages...</span>
      </div>
    );
  }

  if (!villageCodes || villageCodes.length === 0) {
    return (
      <div className="w-52 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm">
        No villages available
      </div>
    );
  }

  const handleVillageSelect = (villageId: number) => {
    setSelectedVillageCodeId(villageId);
    setIsOpen(false);
  };

  return (
    <div className="relative w-52" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
      >
        {selectedVillage ? (
          <>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedVillage.colorHex }}
            />
            <span className="text-sm font-medium text-slate-700">
              {selectedVillage.name}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-500">Select Village</span>
        )}
        <HiChevronDown
          className={clsx(
            "w-4 h-4 text-slate-500 transition-transform ml-auto",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white rounded-lg border shadow-lg z-50 p-1">
          {villageCodes.map((village) => (
            <button
              key={village.id}
              onClick={() => handleVillageSelect(village.id)}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50",
                selectedVillageCodeId === village.id && "bg-slate-50"
              )}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: village.colorHex }}
              />
              <span className="text-sm font-medium">{village.name}</span>
              <span className="text-xs text-slate-500 ml-auto">
                {village.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
