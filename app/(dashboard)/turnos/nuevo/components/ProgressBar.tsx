const STEPS = ["Alumno", "Estudio", "Turno", "Contacto", "Confirmar"];

export default function ProgressBar({ current }: { current: number }) {
  const pct = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="bg-white rounded-2xl px-6 py-4 mb-5" style={{ boxShadow: "0 2px 10px rgba(124,58,237,0.07)" }}>
      <div className="relative flex justify-between items-center mb-2">
        {/* línea base */}
        <div className="absolute top-[18px] left-0 right-0 h-[3px] bg-[#e5e7eb] z-0" />
        {/* línea de progreso */}
        <div
          className="absolute top-[18px] left-0 h-[3px] z-[1] transition-all duration-400"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#7c3aed,#10b981)",
          }}
        />
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className="flex flex-col items-center gap-1.5 relative z-[2]">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base font-black border-[3px] transition-all duration-300"
                style={{
                  background: done ? "#10b981" : active ? "#7c3aed" : "#e5e7eb",
                  borderColor: done ? "#10b981" : active ? "#7c3aed" : "#e5e7eb",
                  color: done || active ? "#fff" : "#9ca3af",
                }}
              >
                {done ? "✓" : step}
              </div>
              <span
                className="text-[11px] font-bold text-center"
                style={{ color: done ? "#10b981" : active ? "#7c3aed" : "#9ca3af" }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
