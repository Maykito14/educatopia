"use client";

import { formatFecha } from "../mock-data";
import { useTurnosData, fmtPesos, getAlias } from "../data-context";
import type { FormData } from "../types";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f3f4f6] last:border-0">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-extrabold text-[#9ca3af] uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-base font-bold text-[#1e1b4b]">{value}</p>
      </div>
    </div>
  );
}

const NIVEL_LABEL: Record<string, string> = {
  primario: "Primario", secundario: "Secundario", terciario: "Terciario", taller: "Taller",
};

export default function PasoConfirmar({ data, onChange }: Props) {
  const { getSlot, getProfesor, getValorHora } = useTurnosData();
  const esPack   = data.tipoPedido !== "suelto";
  const slot     = esPack ? null : getSlot(data.slotId);
  const packSlots = esPack ? data.slotIds.map(id => getSlot(id)).filter(Boolean) : [];
  const profesor = getProfesor(data.profesorId);

  const valorHora = getValorHora(data.nivelEducativo);
  const monto     = esPack
    ? packSlots.reduce((acc, s) => acc + (s!.duracion_minutos / 60) * valorHora, 0)
    : slot ? (slot.duracion_minutos / 60) * valorHora : 0;
  const alias     = getAlias(data.nivelEducativo, profesor?.nombre ?? "");
  const tieneSlot = esPack ? packSlots.length > 0 : !!slot;

  return (
    <div>
      <div className="flex items-center gap-2.5 text-lg font-black text-[#1e1b4b] mb-5">
        <div className="w-10 h-10 rounded-[10px] bg-[#ede9fe] flex items-center justify-center text-xl flex-shrink-0">✅</div>
        Revisá tus datos
      </div>

      {/* Alumno */}
      <div className="bg-[#f5f3ff] rounded-2xl p-5 mb-4">
        <p className="text-xs font-extrabold text-[#7c3aed] uppercase tracking-wide mb-3">Datos del alumno</p>
        <Row icon="👤" label="Nombre y apellido" value={`${data.nombre} ${data.apellido}`} />
        <Row icon="🎂" label="Edad"              value={data.edad ? `${data.edad} años` : ""} />
        <Row icon="📚" label="Nivel"             value={NIVEL_LABEL[data.nivelEducativo] ?? ""} />
        <Row icon="🗓️" label="Año / Grado"       value={data.anioGrado} />
        <Row icon="🏫" label="Colegio"           value={data.colegio} />
      </div>

      {/* Estudio */}
      <div className="bg-[#f0fdf4] rounded-2xl p-5 mb-4">
        <p className="text-xs font-extrabold text-[#10b981] uppercase tracking-wide mb-3">Estudio</p>
        <Row icon="📐" label="Materia"  value={data.materia} />
        <Row icon="🎯" label="Objetivo" value={data.objetivo} />
      </div>

      {/* Turno suelto */}
      {!esPack && slot && profesor && (
        <div className="bg-[#fef3c7] rounded-2xl p-5 mb-4">
          <p className="text-xs font-extrabold text-[#d97706] uppercase tracking-wide mb-3">Turno seleccionado</p>
          <Row icon="👨‍🏫" label="Profesor" value={profesor.nombre} />
          <Row icon="📅"  label="Fecha"    value={formatFecha(slot.fecha)} />
          <Row icon="🕐"  label="Horario"  value={`${slot.hora_inicio} — ${slot.hora_fin} (${slot.duracion_minutos} min)`} />
        </div>
      )}

      {/* Pack — lista de turnos */}
      {esPack && packSlots.length > 0 && profesor && (
        <div className="bg-[#fef3c7] rounded-2xl p-5 mb-4">
          <p className="text-xs font-extrabold text-[#d97706] uppercase tracking-wide mb-1">
            {data.tipoPedido === "pack_semanal" ? "📅 Pack semanal" : "📆 Pack mensual"}
          </p>
          <p className="text-xs font-bold text-[#6b7280] mb-3">
            Profesor: <strong className="text-[#374151]">{profesor.nombre}</strong> · {packSlots.length} turno{packSlots.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-col gap-1.5">
            {packSlots.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white rounded-xl px-3 py-2">
                <span className="font-bold text-[#374151]">{formatFecha(s!.fecha)}</span>
                <span className="font-extrabold text-[#7c3aed]">{s!.hora_inicio} — {s!.hora_fin}</span>
                <span className="text-xs font-semibold text-[#9ca3af]">{s!.duracion_minutos} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pago — siempre visible si hay precio */}
      {valorHora > 0 && tieneSlot && (
        <div className="bg-[#d1fae5] rounded-2xl p-5 mb-4 border border-[#a7f3d0]">
          <p className="text-xs font-extrabold text-[#059669] uppercase tracking-wide mb-3">💳 Información de pago</p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[#374151]">Total a abonar</span>
            <span className="text-2xl font-black text-[#047857]">{fmtPesos(monto)}</span>
          </div>

          {/* Selector método de pago */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => onChange({ metodoPago: "transferencia" })}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-extrabold transition-all ${
                data.metodoPago === "transferencia"
                  ? "border-[#059669] bg-[#059669] text-white"
                  : "border-[#a7f3d0] bg-white text-[#374151] hover:border-[#059669]"
              }`}
            >
              🏦 Transferencia
            </button>
            <button
              type="button"
              onClick={() => onChange({ metodoPago: "efectivo" })}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-extrabold transition-all ${
                data.metodoPago === "efectivo"
                  ? "border-[#059669] bg-[#059669] text-white"
                  : "border-[#a7f3d0] bg-white text-[#374151] hover:border-[#059669]"
              }`}
            >
              💵 Efectivo
            </button>
          </div>

          {data.metodoPago === "transferencia" ? (
            <>
              <div className="bg-white rounded-xl px-4 py-3 text-center">
                <p className="text-xs font-extrabold text-[#9ca3af] uppercase mb-0.5">Alias para transferencia</p>
                <p className="text-xl font-black text-[#059669] tracking-wide">{alias}</p>
              </div>
              <p className="text-xs text-[#6b7280] font-semibold mt-3 text-center">
                Una vez confirmado el turno, compartí el comprobante al WhatsApp <strong>3576481630</strong>
              </p>
            </>
          ) : (
            <div className="bg-white rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-[#374151]">Abonás en efectivo al inicio del turno 💵</p>
              <p className="text-xs text-[#6b7280] font-semibold mt-1">
                Podés avisarnos por WhatsApp <strong>3576481630</strong> ante cualquier consulta
              </p>
            </div>
          )}
        </div>
      )}

      {/* Contacto */}
      <div className="bg-[#fee2e2] rounded-2xl p-5">
        <p className="text-xs font-extrabold text-[#ef4444] uppercase tracking-wide mb-3">Contacto</p>
        <Row icon="👤" label="Responsable"        value={data.nombreContacto} />
        <Row icon="💬" label="WhatsApp"           value={data.whatsapp} />
        <Row icon="📍" label="¿Cómo nos conociste?" value={data.origen} />
        {data.comentarios && <Row icon="💬" label="Comentarios" value={data.comentarios} />}
      </div>
    </div>
  );
}
