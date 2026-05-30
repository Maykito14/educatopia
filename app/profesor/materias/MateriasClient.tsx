"use client";

import { useState, useTransition } from "react";
import { guardarMaterias } from "./actions";

type Materia = { id: string; nombre: string; nivel: string };

const NIVEL_LABEL: Record<string, string> = {
  primario:   "Primario",
  secundario: "Secundario",
  terciario:  "Terciario",
  taller:     "Taller",
  todos:      "Todos los niveles",
};

const MATERIA_ICONS: Record<string, string> = {
  "Matemática":"📐","Lengua":"📖","Inglés":"🌍","Física":"⚡","Química":"🧪",
  "Historia":"🏛️","Geografía":"🗺️","Biología":"🌿","Contabilidad":"💼",
  "Computación":"💻","Portugués":"🇧🇷","Ciencias Naturales":"🔬","Ciencias Sociales":"🌎",
};

export default function MateriasClient({
  allMaterias,
  selectedIds: initialIds,
}: {
  allMaterias: Materia[];
  selectedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await guardarMaterias([...selected]);
      setSaved(true);
    });
  }

  // Agrupar por nivel
  const niveles = [...new Set(allMaterias.map(m => m.nivel))].sort();
  const porNivel: Record<string, Materia[]> = {};
  for (const m of allMaterias) {
    if (!porNivel[m.nivel]) porNivel[m.nivel] = [];
    porNivel[m.nivel].push(m);
  }

  return (
    <div className="space-y-5">
      {niveles.map(nivel => (
        <div key={nivel} className="bg-white rounded-2xl p-5" style={{ boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
          <h2 className="text-sm font-black text-[#374151] mb-3">{NIVEL_LABEL[nivel] ?? nivel}</h2>
          <div className="flex flex-wrap gap-2">
            {porNivel[nivel].map(m => {
              const sel = selected.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-extrabold border-2 transition-all ${
                    sel
                      ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]"
                      : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#c4b5fd]"
                  }`}
                >
                  <span>{MATERIA_ICONS[m.nombre] ?? "📘"}</span>
                  {m.nombre}
                  {sel && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="px-6 py-3 rounded-xl bg-[#7c3aed] text-white font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved && !pending && (
          <span className="text-sm font-bold text-[#10b981]">✓ Guardado correctamente</span>
        )}
        <span className="text-xs text-[#9ca3af] font-semibold">
          {selected.size} materia{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
