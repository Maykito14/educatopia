"use client";

import { useState, useTransition } from "react";
import { toggleDisponibilidad, agregarBloqueo, quitarBloqueo } from "./actions";

const DIAS_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

type Disponibilidad = {
  id: string; dia_semana: number; hora_inicio: string; hora_fin: string;
  duracion_minutos: number; activo: boolean;
};

type Bloqueo = {
  id: string; fecha: string; motivo: string | null;
  hora_inicio: string | null; hora_fin: string | null;
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function getProximasFechas(diasConDisp: number[]): string[] {
  const fechas: string[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 28; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (diasConDisp.includes(d.getDay())) fechas.push(key);
  }
  return fechas;
}

export default function DisponibilidadClient({
  disponibilidad,
  bloqueos: bloqueosProp,
}: {
  disponibilidad: Disponibilidad[];
  bloqueos: Bloqueo[];
}) {
  const [pending, startTransition] = useTransition();

  // Form state para nuevo bloqueo
  const [fecha, setFecha]         = useState("");
  const [motivo, setMotivo]       = useState("");
  const [esParcial, setEsParcial] = useState(false);
  const [horaIni, setHoraIni]     = useState("");
  const [horaFin, setHoraFin]     = useState("");

  const bloqueoSet = new Set(bloqueosProp.map(b => b.fecha));
  const diasConDisp = [...new Set(disponibilidad.map(d => d.dia_semana))];
  const proximasFechas = getProximasFechas(diasConDisp);

  // Agrupar disponibilidad por día
  const porDia: Record<number, Disponibilidad[]> = {};
  for (const d of disponibilidad) {
    if (!porDia[d.dia_semana]) porDia[d.dia_semana] = [];
    porDia[d.dia_semana].push(d);
  }

  function resetForm() {
    setFecha(""); setMotivo(""); setEsParcial(false); setHoraIni(""); setHoraFin("");
  }

  function handleAgregar() {
    if (!fecha) return;
    if (esParcial && (!horaIni || !horaFin)) return;
    startTransition(async () => {
      await agregarBloqueo(fecha, motivo, esParcial ? horaIni : "", esParcial ? horaFin : "");
      resetForm();
    });
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold text-[#374151] focus:border-[#7c3aed] outline-none";

  return (
    <div className="space-y-6">

      {/* ── Horario semanal ── */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
        <h2 className="text-sm font-black text-[#1e1b4b] mb-4">Horario semanal recurrente</h2>
        {disponibilidad.length === 0 ? (
          <p className="text-sm text-[#9ca3af] font-semibold">No tenés horarios configurados. Pedile al administrador que los configure.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(porDia)
              .sort(([a],[b]) => Number(a)-Number(b))
              .map(([dia, slots]) => (
                <div key={dia}>
                  <p className="text-xs font-extrabold text-[#374151] mb-2">{DIAS_FULL[Number(dia)]}</p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={pending}
                        onClick={() => startTransition(() => toggleDisponibilidad(s.id, !s.activo))}
                        title={s.activo ? "Clic para desactivar este horario" : "Clic para activar este horario"}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                          s.activo
                            ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]"
                            : "border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af] line-through"
                        }`}
                      >
                        {s.hora_inicio.slice(0,5)} – {s.hora_fin.slice(0,5)}
                        <span>{s.activo ? "✓" : "✗"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
        <p className="text-[11px] text-[#9ca3af] font-semibold mt-3">
          Hacé clic en un bloque para activarlo o desactivarlo permanentemente.
        </p>
      </div>

      {/* ── Agregar bloqueo ── */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
        <h2 className="text-sm font-black text-[#1e1b4b] mb-1">Bloquear fecha o franja horaria</h2>
        <p className="text-xs text-[#9ca3af] font-semibold mb-4">
          Bloqueá un día completo o solo un horario específico para que no aparezcan turnos.
        </p>

        <div className="space-y-3">
          {/* Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#374151] mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                min={new Date().toISOString().slice(0,10)}
                onChange={e => setFecha(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#374151] mb-1">Motivo (opcional)</label>
              <input
                type="text"
                placeholder="Ej: feriado, viaje..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Toggle día completo / franja */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEsParcial(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-colors ${
                !esParcial ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]" : "border-[#e5e7eb] text-[#9ca3af]"
              }`}
            >
              🚫 Día completo
            </button>
            <button
              type="button"
              onClick={() => setEsParcial(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-colors ${
                esParcial ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]" : "border-[#e5e7eb] text-[#9ca3af]"
              }`}
            >
              🕐 Solo un horario
            </button>
          </div>

          {/* Horas (solo si franja parcial) */}
          {esParcial && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#374151] mb-1">Desde *</label>
                <input
                  type="time"
                  value={horaIni}
                  onChange={e => setHoraIni(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#374151] mb-1">Hasta *</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={e => setHoraFin(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!fecha || (esParcial && (!horaIni || !horaFin)) || pending}
            onClick={handleAgregar}
            className="w-full py-2.5 rounded-xl bg-[#7c3aed] text-white text-sm font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Agregar bloqueo"}
          </button>
        </div>
      </div>

      {/* ── Lista de bloqueos activos ── */}
      {bloqueosProp.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
          <h2 className="text-sm font-black text-[#1e1b4b] mb-3">Bloqueos vigentes</h2>
          <div className="space-y-2">
            {bloqueosProp.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-[#fef2f2] rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-[#ef4444]">
                    {new Date(b.fecha+"T00:00:00").toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}
                  </span>
                  {b.hora_inicio && b.hora_fin
                    ? <span className="text-xs font-bold text-[#6b7280] ml-2">
                        {b.hora_inicio.slice(0,5)} – {b.hora_fin.slice(0,5)}
                      </span>
                    : <span className="text-xs font-bold text-[#9ca3af] ml-2">Día completo</span>
                  }
                  {b.motivo && <span className="text-xs text-[#9ca3af] ml-2">— {b.motivo}</span>}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => quitarBloqueo(b.id))}
                  className="text-xs font-bold text-[#9ca3af] hover:text-[#ef4444] transition-colors ml-3 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vista próximas fechas ── */}
      {proximasFechas.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
          <h2 className="text-sm font-black text-[#1e1b4b] mb-4">Próximas 28 días con disponibilidad</h2>
          <div className="flex flex-wrap gap-2">
            {proximasFechas.map(f => {
              const bloqueado = bloqueoSet.has(f);
              return (
                <div key={f} className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold ${
                  bloqueado ? "bg-[#fee2e2] text-[#ef4444] line-through" : "bg-[#d1fae5] text-[#059669]"
                }`}>
                  {new Date(f+"T00:00:00").toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short"})}
                  {bloqueado && " 🚫"}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
