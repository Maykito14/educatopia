"use client";

import { useState } from "react";
import Field, { inputClass, inputErrorClass } from "../components/Field";
import { OptionCard } from "../components/Chip";
import { useTurnosData } from "../data-context";
import { buscarAlumnoPorDNI } from "../actions";
import { getEspecialidades } from "@/lib/colegio-especialidades";
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

// Solo letras, espacios y caracteres con tilde
const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

export default function PasoAlumno({ data, onChange, errors }: Props) {
  const { colegios } = useTurnosData();
  const [buscandoDNI, setBuscandoDNI] = useState(false);

  function handleNivel(nivel: NivelEducativo) {
    onChange({ nivelEducativo: nivel, especialidad: "", materia: "", profesorId: "", slotId: "" });
  }

  // Filtra input para que solo acepte letras
  function onlyLetters(val: string, field: keyof FormData) {
    if (val === "" || SOLO_LETRAS.test(val)) onChange({ [field]: val });
  }

  // Filtra input para que solo acepte dígitos
  function onlyDigits(val: string, field: keyof FormData) {
    if (val === "" || /^\d+$/.test(val)) onChange({ [field]: val });
  }

  // Buscar alumno por DNI al salir del campo
  async function handleDNIBlur() {
    const dni = data.dni.trim();
    if (!dni || dni.length < 6) return;
    setBuscandoDNI(true);
    try {
      const encontrado = await buscarAlumnoPorDNI(dni);
      if (encontrado) {
        onChange({
          nombre:            encontrado.nombre,
          apellido:          encontrado.apellido,
          alumnoExistenteId: encontrado.id,
        });
      } else {
        // DNI no encontrado — limpiar lock si había uno previo
        onChange({ alumnoExistenteId: "" });
      }
    } finally {
      setBuscandoDNI(false);
    }
  }

  // Al cambiar el DNI manualmente, limpiar el alumno encontrado
  function handleDNIChange(val: string) {
    if (val === "" || /^\d+$/.test(val)) {
      onChange({ dni: val, alumnoExistenteId: "", nombre: data.alumnoExistenteId ? "" : data.nombre, apellido: data.alumnoExistenteId ? "" : data.apellido });
    }
  }

  const bloqueado = !!data.alumnoExistenteId;

  return (
    <div>
      <div className="flex items-center gap-2.5 text-lg font-black text-[#1e1b4b] mb-5">
        <div className="w-10 h-10 rounded-[10px] bg-[#ede9fe] flex items-center justify-center text-xl shrink-0">
          👤
        </div>
        Datos del alumno
      </div>

      {/* DNI — va primero para poder detectar alumno existente */}
      <Field label="DNI del alumno" required error={errors.dni}>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ej: 45123456"
            value={data.dni}
            onChange={(e) => handleDNIChange(e.target.value)}
            onBlur={handleDNIBlur}
            maxLength={10}
            className={errors.dni ? inputErrorClass : inputClass}
          />
          {buscandoDNI && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9ca3af] font-semibold">
              Buscando…
            </span>
          )}
        </div>
      </Field>

      {/* Banner alumno encontrado */}
      {bloqueado && (
        <div className="flex items-center gap-2 bg-[#d1fae5] border border-[#a7f3d0] rounded-xl px-4 py-2.5 mb-1 -mt-2">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-xs font-extrabold text-[#059669]">Alumno ya registrado</p>
            <p className="text-xs text-[#065f46] font-semibold">Nombre y apellido cargados automáticamente</p>
          </div>
        </div>
      )}

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Nombre" required error={errors.nombre}>
          <input
            type="text"
            placeholder="Ej: Valentina"
            value={data.nombre}
            onChange={(e) => !bloqueado && onlyLetters(e.target.value, "nombre")}
            readOnly={bloqueado}
            className={`${errors.nombre ? inputErrorClass : inputClass} ${bloqueado ? "bg-[#f9fafb] text-[#6b7280] cursor-not-allowed" : ""}`}
          />
        </Field>
        <Field label="Apellido" required error={errors.apellido}>
          <input
            type="text"
            placeholder="Ej: García"
            value={data.apellido}
            onChange={(e) => !bloqueado && onlyLetters(e.target.value, "apellido")}
            readOnly={bloqueado}
            className={`${errors.apellido ? inputErrorClass : inputClass} ${bloqueado ? "bg-[#f9fafb] text-[#6b7280] cursor-not-allowed" : ""}`}
          />
        </Field>
      </div>

      {/* Edad y Año/Grado */}
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Edad" required error={errors.edad}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ej: 14"
            value={data.edad}
            onChange={(e) => onlyDigits(e.target.value, "edad")}
            maxLength={2}
            className={errors.edad ? inputErrorClass : inputClass}
          />
        </Field>
        <Field label="Año / Grado" required error={errors.anioGrado}>
          <input
            type="text"
            placeholder="Ej: 3° año"
            value={data.anioGrado}
            onChange={(e) => onChange({ anioGrado: e.target.value })}
            className={errors.anioGrado ? inputErrorClass : inputClass}
          />
        </Field>
      </div>

      {/* Colegio */}
      <Field label="Colegio / Institución" required error={errors.colegio}>
        <select
          value={data.colegio}
          onChange={(e) => onChange({ colegio: e.target.value, especialidad: "" })}
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

      {/* Especialidad — solo para secundario con colegios que tienen especialidades */}
      {data.nivelEducativo === "secundario" && data.colegio && getEspecialidades(data.colegio).length > 0 && (
        <Field label="Especialidad" required error={errors.especialidad}>
          <select
            value={data.especialidad}
            onChange={(e) => onChange({ especialidad: e.target.value })}
            className={`${errors.especialidad ? inputErrorClass : inputClass} cursor-pointer`}
          >
            <option value="">Seleccioná la especialidad...</option>
            {getEspecialidades(data.colegio).map((esp) => (
              <option key={esp} value={esp}>{esp}</option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}
