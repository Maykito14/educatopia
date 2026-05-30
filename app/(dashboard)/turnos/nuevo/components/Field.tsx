"use client";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export default function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="mb-[18px]">
      <label className="block text-[13px] font-extrabold text-[#374151] mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-[#ef4444]">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs font-bold text-[#ef4444] mt-1">{error}</p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full px-4 py-[13px] border-2 border-[#e5e7eb] rounded-xl font-[inherit] text-base text-[#1e1b4b] outline-none transition-all focus:border-[#7c3aed] focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)] bg-white";

export const inputErrorClass =
  "w-full px-4 py-[13px] border-2 border-[#ef4444] rounded-xl font-[inherit] text-base text-[#1e1b4b] outline-none transition-all bg-white shadow-[0_0_0_4px_rgba(239,68,68,0.08)]";
