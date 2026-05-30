"use client";

type ChipVariant = "purple" | "green" | "amber";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: ChipVariant;
}

const variants: Record<ChipVariant, { base: string; active: string }> = {
  purple: {
    base: "border-[#e5e7eb] text-[#6b7280] hover:border-[#7c3aed]",
    active: "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]",
  },
  green: {
    base: "border-[#e5e7eb] text-[#6b7280] hover:border-[#10b981]",
    active: "border-[#10b981] bg-[#d1fae5] text-[#059669]",
  },
  amber: {
    base: "border-[#e5e7eb] text-[#6b7280] hover:border-[#f59e0b]",
    active: "border-[#f59e0b] bg-[#fef3c7] text-[#d97706]",
  },
};

export default function Chip({ label, selected, onClick, variant = "purple" }: ChipProps) {
  const v = variants[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border-2 text-[13px] font-extrabold cursor-pointer transition-all ${
        selected ? v.active : v.base
      }`}
    >
      {label}
    </button>
  );
}

interface OptionCardProps {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function OptionCard({ icon, label, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all text-sm font-extrabold ${
        selected
          ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]"
          : "border-[#e5e7eb] text-[#6b7280] hover:border-[#7c3aed] hover:bg-[#faf5ff]"
      }`}
    >
      <span className="text-2xl block mb-1">{icon}</span>
      {label}
    </button>
  );
}
