"use client";

import { useState, useTransition } from "react";
import { confirmarTurno, marcarAsistencia, actualizarCobro } from "./actions";

type TurnoRow = {
  id: string;
  materia: string;
  anio: string;
  colegio: string;
  objetivo: string | null;
  notas: string | null;
  confirmado_por_profesor: boolean;
  asistio: boolean | null;
  pagado: boolean;
  cobrado: boolean;
  medio_cobro: "efectivo" | "transferencia" | null;
  estado: string;
  slot: { fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number } | null;
  alumno: {
    nombre: string; apellido: string; nivel_educativo: string | null;
    anio_grado: string | null; nombre_contacto: string | null; telefono_contacto: string | null;
  } | null;
};

type Filtro = "todos" | "pendientes" | "confirmados" | "asistidos";

function Badge({ ok, labelOk, labelNo }: { ok: boolean | null; labelOk: string; labelNo: string }) {
  if (ok === null) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f3f4f6] text-[#9ca3af]">Sin info</span>;
  return ok
    ? <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#d1fae5] text-[#059669]">{labelOk}</span>
    : <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fee2e2] text-[#ef4444]">{labelNo}</span>;
}

function TurnoCard({ turno }: { turno: TurnoRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const slot = turno.slot;
  const alumno = turno.alumno;

  const fechaLabel = slot
    ? new Date(slot.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    : "—";

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#e5e7eb]">
      {/* Row principal */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#faf5ff] transition-colors"
      >
        {/* Fecha */}
        <div className="flex-shrink-0 w-14 text-center">
          <p className="text-xs font-black text-[#7c3aed] capitalize">
            {slot ? new Date(slot.fecha+"T00:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"}) : "—"}
          </p>
          <p className="text-[10px] text-[#9ca3af] font-semibold">{slot?.hora_inicio?.slice(0,5)}</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-[#1e1b4b] truncate">
            {alumno?.nombre} {alumno?.apellido}
          </p>
          <p className="text-xs text-[#6b7280] font-semibold truncate">
            {turno.materia} · {turno.anio} · {turno.colegio}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge ok={turno.confirmado_por_profesor} labelOk="Confirmado" labelNo="Sin confirmar" />
            <Badge ok={turno.asistio} labelOk="Asistió" labelNo="No asistió" />
            {turno.pagado && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#e0f2fe] text-[#0284c7]">Pagado</span>}
            {turno.cobrado && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f0fdf4] text-[#15803d]">Cobrado</span>}
          </div>
        </div>

        <span className="text-[#9ca3af] text-xs mt-1 flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {/* Panel expandible */}
      {open && (
        <div className="px-4 pb-4 bg-[#faf5ff] border-t border-[#e5e7eb] space-y-3">
          <div className="text-xs text-[#6b7280] font-semibold pt-3 space-y-1">
            <p><span className="font-black text-[#374151]">Fecha:</span> {fechaLabel} · {slot?.hora_inicio?.slice(0,5)} — {slot?.hora_fin?.slice(0,5)} ({slot?.duracion_minutos} min)</p>
            {alumno?.nombre_contacto && <p><span className="font-black text-[#374151]">Contacto:</span> {alumno.nombre_contacto}</p>}
            {alumno?.telefono_contacto && <p><span className="font-black text-[#374151]">WhatsApp:</span> {alumno.telefono_contacto}</p>}
            {turno.objetivo && <p><span className="font-black text-[#374151]">Objetivo:</span> {turno.objetivo}</p>}
            {turno.notas && <p><span className="font-black text-[#374151]">Notas:</span> {turno.notas}</p>}
          </div>

          {/* Acciones — asistencia y confirmación */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!turno.confirmado_por_profesor && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => confirmarTurno(turno.id))}
                className="px-3 py-1.5 rounded-xl bg-[#7c3aed] text-white text-xs font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
              >
                ✓ Confirmar turno
              </button>
            )}

            {turno.asistio !== true && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => marcarAsistencia(turno.id, true))}
                className="px-3 py-1.5 rounded-xl bg-[#10b981] text-white text-xs font-black hover:bg-[#059669] transition-colors disabled:opacity-50"
              >
                ✅ Asistió
              </button>
            )}

            {turno.asistio !== false && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => marcarAsistencia(turno.id, false))}
                className="px-3 py-1.5 rounded-xl bg-[#ef4444] text-white text-xs font-black hover:bg-[#dc2626] transition-colors disabled:opacity-50"
              >
                ✗ No asistió
              </button>
            )}
          </div>

          {/* Cobro del alumno/padre */}
          <div className="pt-2 border-t border-[#e5e7eb]">
            <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-2">Cobro al alumno</p>
            <div className="flex flex-wrap items-center gap-2">
              {/* Medio de cobro */}
              <select
                value={turno.medio_cobro ?? ""}
                disabled={pending}
                onChange={e =>
                  startTransition(() =>
                    actualizarCobro(turno.id, {
                      medio_cobro: (e.target.value as "efectivo" | "transferencia") || null,
                    })
                  )
                }
                className={`text-xs font-extrabold rounded-lg border px-2 py-1.5 outline-none bg-white transition-colors ${
                  turno.medio_cobro === "efectivo"
                    ? "border-[#f59e0b] text-[#92400e]"
                    : turno.medio_cobro === "transferencia"
                    ? "border-[#6366f1] text-[#4338ca]"
                    : "border-[#e5e7eb] text-[#9ca3af]"
                }`}
              >
                <option value="">— medio de cobro</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="efectivo">💵 Efectivo</option>
              </select>

              {/* Estado cobrado */}
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() =>
                    actualizarCobro(turno.id, { cobrado: !turno.cobrado })
                  )
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors disabled:opacity-50 ${
                  turno.cobrado
                    ? "bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]"
                    : "bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]"
                }`}
              >
                {turno.cobrado ? "✓ Cobrado" : "⏳ Sin cobrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TurnosClient({ turnos }: { turnos: TurnoRow[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtrados = turnos.filter(t => {
    if (filtro === "pendientes")  return !t.confirmado_por_profesor;
    if (filtro === "confirmados") return t.confirmado_por_profesor && t.asistio === null;
    if (filtro === "asistidos")   return t.asistio !== null;
    return true;
  });

  const FILTROS: { key: Filtro; label: string; count: number }[] = [
    { key: "todos",       label: "Todos",            count: turnos.length },
    { key: "pendientes",  label: "Sin confirmar",    count: turnos.filter(t => !t.confirmado_por_profesor).length },
    { key: "confirmados", label: "Confirmados",      count: turnos.filter(t => t.confirmado_por_profesor && t.asistio === null).length },
    { key: "asistidos",   label: "Con asistencia",   count: turnos.filter(t => t.asistio !== null).length },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
              filtro === f.key
                ? "bg-[#7c3aed] text-white"
                : "bg-white text-[#6b7280] hover:bg-[#f3f4f6] border border-[#e5e7eb]"
            }`}
          >
            {f.label} <span className="opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-[#9ca3af] font-bold bg-white rounded-2xl">
          No hay turnos en esta categoría.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(t => <TurnoCard key={t.id} turno={t} />)}
        </div>
      )}
    </div>
  );
}
