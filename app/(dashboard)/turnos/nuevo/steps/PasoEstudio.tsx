"use client";

import Field from "../components/Field";
import Chip, { OptionCard } from "../components/Chip";
import { MATERIA_ICONS } from "../mock-data";
import { useTurnosData } from "../data-context";
import type { FormData, NivelEducativo, Objetivo, TipoPedido } from "../types";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const OBJETIVOS_ESTANDAR: { value: Objetivo; icon: string; label: string }[] = [
  { value: "Rendir examen",   icon: "📝", label: "Rendir examen" },
  { value: "Mejorar notas",   icon: "📈", label: "Mejorar notas" },
  { value: "Apoyo continuo",  icon: "🤝", label: "Apoyo continuo" },
  // "Ingreso universitario" solo para secundario/terciario — se agrega abajo condicionalmente
];

const OBJETIVO_INGRESO: { value: Objetivo; icon: string; label: string } =
  { value: "Ingreso universitario", icon: "🎓", label: "Ingreso univ." };

const OBJETIVOS_TALLER: { value: Objetivo; icon: string; label: string }[] = [
  { value: "Aprender algo nuevo",              icon: "🌱", label: "Aprender algo nuevo" },
  { value: "Interiorizarme sobre este tema",   icon: "🔍", label: "Interiorizarme sobre el tema" },
  { value: "Realizar un taller por gusto/ocio", icon: "🎨", label: "Por gusto / ocio" },
];

export default function PasoEstudio({ data, onChange, errors }: Props) {
  const { getMateriasPorNivel } = useTurnosData();
  const nivel    = data.nivelEducativo as NivelEducativo;
  const esTaller = nivel === "taller";
  const materias = nivel && !esTaller ? getMateriasPorNivel(nivel) : [];

  // Objetivos según nivel
  const objetivos = esTaller
    ? OBJETIVOS_TALLER
    : nivel === "primario"
      ? OBJETIVOS_ESTANDAR                          // sin "Ingreso universitario"
      : [...OBJETIVOS_ESTANDAR, OBJETIVO_INGRESO];  // secundario/terciario: todos

  function selectMateria(mat: string) {
    onChange({ materia: data.materia === mat ? "" : mat, profesorId: "", slotId: "" });
  }

  // Si cambia el objetivo, limpiar si no está en la lista del nivel actual
  function selectObjetivo(obj: Objetivo) {
    onChange({ objetivo: obj });
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 text-lg font-black text-[#1e1b4b] mb-5">
        <div className="w-10 h-10 rounded-[10px] bg-[#d1fae5] flex items-center justify-center text-xl flex-shrink-0">
          📖
        </div>
        {esTaller ? "¿Qué taller te interesa?" : "¿Qué necesita estudiar?"}
      </div>

      {/* Materia — solo para niveles que no son taller */}
      {!esTaller && (
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
      )}

      {/* Para talleres: aviso que no hace falta materia */}
      {esTaller && (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3 mb-4 text-sm font-semibold text-[#15803d]">
          🎨 Los talleres no requieren elegir una materia. Simplemente contanos cuál es tu objetivo.
        </div>
      )}

      {/* Objetivo */}
      <Field label="Objetivo principal" required error={errors.objetivo}>
        <div className="grid grid-cols-2 gap-2.5">
          {objetivos.map((o) => (
            <OptionCard
              key={o.value}
              icon={o.icon}
              label={o.label}
              selected={data.objetivo === o.value}
              onClick={() => selectObjetivo(o.value)}
            />
          ))}
        </div>
      </Field>

      {/* Tipo de pedido — solo para primario y secundario */}
      {(nivel === "primario" || nivel === "secundario") && (
        <Field label="Tipo de turno">
          <div className="flex flex-col gap-2">
            {(
              [
                { value: "suelto"       as TipoPedido, icon: "1️⃣", label: "Turno suelto" },
                ...(nivel === "primario"
                  ? [{ value: "pack_semanal" as TipoPedido, icon: "📅", label: "Pack semanal — 1 semana (mín. 6 hs)" }]
                  : []),
                { value: "pack_mensual" as TipoPedido, icon: "📆", label: "Pack mensual — 2 semanas (mín. 6 hs)" },
              ]
            ).map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.tipoPedido === opt.value}
                onClick={() =>
                  onChange({ tipoPedido: opt.value, slotId: "", slotIds: [], profesorId: "" })
                }
              />
            ))}
          </div>
          {data.tipoPedido !== "suelto" && (
            <p className="text-xs font-semibold text-[#7c3aed] mt-2">
              📌 En el siguiente paso podrás elegir múltiples turnos. Mínimo 6 horas en total.
            </p>
          )}
        </Field>
      )}
    </div>
  );
}
