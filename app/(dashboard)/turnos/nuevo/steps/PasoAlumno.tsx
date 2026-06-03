"use client";

import Field, { inputClass, inputErrorClass } from "../components/Field";
import { OptionCard } from "../components/Chip";
import { useTurnosData } from "../data-context";
import type { FormData, NivelEducativo } from "../types";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const NIVELES: { value: NivelEducativo; icon: string; label: string }[] = [
  { value: "primario",   icon: "🎒", label: "Primario" },
  { value: "secundario", icon: "📚", label: "Secundario" },
  { value: "terciario",  icon: "🎓", label: "Terciario" },
  { value: "taller",     icon: "🛠️", label: "Taller" },
];

export default function PasoAlumno({ data, onChange, errors }: Props) {
  const { colegios } = useTurnosData();

  function handleNivel(nivel: NivelEducativo) {
    // Al cambiar nivel, resetear materia (puede no existir en el nuevo nivel)
    onChange({ nivelEducativo: nivel, materia: "", profesorId: "", slotId: "" });
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 text-lg font-black text-[#1e1b4b] mb-5">
        <div className="w-10 h-10 rounded-[10px] bg-[#ede9fe] flex items-center justify-center text-xl flex-shrink-0">
          👤
        </div>
        Datos del alumno
      </div>

      {/* Nombre y Apellido en fila */}
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Nombre" required error={errors.nombre}>
          <input
            type="text"
            placeholder="Ej: Valentina"
            value={data.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            className={errors.nombre ? inputErrorClass : inputClass}
          />
        </Field>
        <Field label="Apellido" required error={errors.apellido}>
          <input
            type="text"
            placeholder="Ej: García"
            value={data.apellido}
            onChange={(e) => onChange({ apellido: e.target.value })}
            className={errors.apellido ? inputErrorClass : inputClass}
          />
        </Field>
      </div>

      {/* DNI */}
      <Field label="DNI del alumno" error={errors.dni}>
        <input
          type="text"
          placeholder="Ej: 45123456"
          value={data.dni}
          onChange={(e) => onChange({ dni: e.target.value })}
          className={errors.dni ? inputErrorClass : inputClass}
        />
      </Field>

      {/* Edad y Año/Grado en fila */}
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Edad" required error={errors.edad}>
          <input
            type="number"
            placeholder="Ej: 14"
            min={4}
            max={80}
            value={data.edad}
            onChange={(e) => onChange({ edad: e.target.value })}
            className={errors.edad ? inputErrorClass : inputClass}
          />
        </Field>
        <Field label="Año / Grado">
          <input
            type="text"
            placeholder="Ej: 3° año"
            value={data.anioGrado}
            onChange={(e) => onChange({ anioGrado: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Colegio — dropdown */}
      <Field label="Colegio / Institución" required error={errors.colegio}>
        <select
          value={data.colegio}
          onChange={(e) => onChange({ colegio: e.target.value })}
          className={`${errors.colegio ? inputErrorClass : inputClass} cursor-pointer`}
        >
          <option value="">Seleccioná el colegio...</option>
          {colegios.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      {/* Nivel educativo */}
      <Field label="Nivel educativo" required error={errors.nivelEducativo}>
        <div className="grid grid-cols-2 gap-2.5">
          {NIVELES.map((n) => (
            <OptionCard
              key={n.value}
              icon={n.icon}
              label={n.label}
              selected={data.nivelEducativo === n.value}
              onClick={() => handleNivel(n.value)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
