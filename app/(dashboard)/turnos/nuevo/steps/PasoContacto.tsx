"use client";

import Field, { inputClass, inputErrorClass } from "../components/Field";
import Chip from "../components/Chip";
import type { FormData, Origen } from "../types";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const ORIGENES: { value: Origen; label: string }[] = [
  { value: "Instagram",      label: "📱 Instagram" },
  { value: "Facebook",       label: "👥 Facebook" },
  { value: "Recomendación",  label: "🗣️ Recomendación" },
  { value: "Pasé por ahí",   label: "📍 Pasé por ahí" },
  { value: "WhatsApp",       label: "💬 WhatsApp" },
  { value: "Otro",           label: "➕ Otro" },
];

export default function PasoContacto({ data, onChange, errors }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2.5 text-lg font-black text-[#1e1b4b] mb-5">
        <div className="w-10 h-10 rounded-[10px] bg-[#fee2e2] flex items-center justify-center text-xl flex-shrink-0">
          📲
        </div>
        Datos de contacto
      </div>

      <Field label="Nombre del padre/madre o tutor" required error={errors.nombreContacto}>
        <input
          type="text"
          placeholder="Ej: María González"
          value={data.nombreContacto}
          onChange={(e) => onChange({ nombreContacto: e.target.value })}
          className={errors.nombreContacto ? inputErrorClass : inputClass}
        />
      </Field>

      <Field label="Número de WhatsApp" required error={errors.whatsapp}>
        <input
          type="tel"
          placeholder="Ej: 3576123456"
          value={data.whatsapp}
          onChange={(e) => onChange({ whatsapp: e.target.value })}
          className={errors.whatsapp ? inputErrorClass : inputClass}
        />
      </Field>

      <Field label="¿Cómo nos conociste?" required error={errors.origen}>
        <div className="flex flex-wrap gap-2">
          {ORIGENES.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={data.origen === o.value}
              onClick={() => onChange({ origen: o.value })}
              variant="amber"
            />
          ))}
        </div>
      </Field>

      <Field label="Comentarios adicionales">
        <textarea
          placeholder="Ej: Mi hijo tiene dificultades en álgebra..."
          value={data.comentarios}
          onChange={(e) => onChange({ comentarios: e.target.value })}
          className={`${inputClass} resize-y min-h-[90px]`}
        />
      </Field>

      <div className="bg-[#f0fdf4] rounded-xl px-4 py-3 text-sm font-semibold text-[#15803d] flex items-start gap-2">
        <span>✅</span>
        <span>Tus datos son confidenciales y solo se usan para coordinar las clases.</span>
      </div>
    </div>
  );
}
