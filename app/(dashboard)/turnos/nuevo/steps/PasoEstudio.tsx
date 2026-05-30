"use client";

import Field from "../components/Field";
import Chip, { OptionCard } from "../components/Chip";
import { MATERIA_ICONS } from "../mock-data";
import { useTurnosData } from "../data-context";
import type { FormData, NivelEducativo, Objetivo } from "../types";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const OBJETIVOS: { value: Objetivo; icon: string; label: string }[] = [
  { value: "Rendir examen",         icon: "📝", label: "Rendir examen" },
  { value: "Mejorar notas",         icon: "📈", label: "Mejorar notas" },
  { value: "Apoyo continuo",        icon: "🤝", label: "Apoyo continuo" },
  { value: "Ingreso universitario", icon: "🎓", label: "Ingreso univ." },
];

export default function PasoEstudio({ data, onChange, errors }: Props) {
  const { getMateriasPorNivel } = useTurnosData();
  const nivel = data.nivelEducativo as NivelEducativo;
  const materias = nivel ? getMateriasPorNivel(nivel) : [];

  function selectMateria(mat: string) {
    // Al cambiar materia, resetear profesor y slot
    onChange({
      materia: data.materia === mat ? "" : mat,
      profesorId: "",
      slotId: "",
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 text-lg font-black text-[#1e1b4b] mb-5">
        <div className="w-10 h-10 rounded-[10px] bg-[#d1fae5] flex items-center justify-center text-xl flex-shrink-0">
          📖
        </div>
        ¿Qué necesita estudiar?
      </div>

      {/* Materia */}
      <Field label="Materia" required error={errors.materia}>
        {materias.length === 0 ? (
          <div className="bg-[#fef3c7] rounded-xl px-4 py-3 text-sm font-bold text-[#d97706]">
            ⚠️ Volvé al paso anterior y seleccioná el nivel educativo para ver las materias disponibles.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {materias.map((m) => (
                <Chip
                  key={m}
                  label={`${MATERIA_ICONS[m] ?? "📘"} ${m}`}
                  selected={data.materia === m}
                  onClick={() => selectMateria(m)}
                  variant="purple"
                />
              ))}
            </div>
            {data.materia && (
              <p className="text-sm font-bold text-[#10b981] mt-2">
                ✓ <strong>{data.materia}</strong> seleccionada
              </p>
            )}
          </>
        )}
      </Field>

      {/* Objetivo */}
      <Field label="Objetivo principal" required error={errors.objetivo}>
        <div className="grid grid-cols-2 gap-2.5">
          {OBJETIVOS.map((o) => (
            <OptionCard
              key={o.value}
              icon={o.icon}
              label={o.label}
              selected={data.objetivo === o.value}
              onClick={() => onChange({ objetivo: o.value })}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
