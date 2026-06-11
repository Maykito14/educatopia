"use client";

import { useState, useTransition } from "react";
import { marcarCobrados } from "./actions";

type Precio = {
  nivel: string; valor_hora: number;
  pack_semanal_precio: number | null; pack_semanal_horas: number | null;
  pack_mensual_precio: number | null; pack_mensual_horas: number | null;
};
type TurnoCob = {
  id: string; materia: string; anio: string; cobrado: boolean;
  tipo_pedido: "suelto" | "pack_semanal" | "pack_mensual" | null;
  slot: { fecha: string; duracion_minutos: number } | null;
  alumno: { id: string; nombre: string; apellido: string; nivel_educativo: string | null; telefono_contacto: string | null } | null;
};

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n);
}

export default function CobranzasClient({
  turnos, precios,
}: { turnos: TurnoCob[]; precios: Precio[] }) {
  const [pending, startTrans] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const precioMap: Record<string, Precio> = {};
  precios.forEach(p => { precioMap[p.nivel] = p; });

  function valorHoraTurno(t: TurnoCob): number {
    const p = precioMap[t.alumno?.nivel_educativo ?? "secundario"];
    if (!p) return 0;
    if (t.tipo_pedido === "pack_semanal" && p.pack_semanal_precio && p.pack_semanal_horas) {
      return p.pack_semanal_precio / p.pack_semanal_horas;
    }
    if (t.tipo_pedido === "pack_mensual" && p.pack_mensual_precio && p.pack_mensual_horas) {
      return p.pack_mensual_precio / p.pack_mensual_horas;
    }
    return p.valor_hora;
  }

  // Agrupar por alumno
  const grupos: Record<string, { alumno: TurnoCob["alumno"]; turnos: TurnoCob[] }> = {};
  for (const t of turnos) {
    const key = t.alumno?.id ?? "unknown";
    if (!grupos[key]) grupos[key] = { alumno: t.alumno, turnos: [] };
    grupos[key].turnos.push(t);
  }

  function calcGrupo(ts: TurnoCob[]) {
    let horas = 0; let monto = 0;
    for (const t of ts) {
      const vh = valorHoraTurno(t);
      const h = (t.slot?.duracion_minutos ?? 60) / 60;
      horas += h; monto += h * vh;
    }
    return { horas, monto };
  }

  const totalMonto = Object.values(grupos).reduce((acc, g) => {
    const ids = g.turnos.map(t=>t.id).filter(id=>selected.has(id));
    if (ids.length === 0) return acc;
    return acc + calcGrupo(g.turnos.filter(t=>selected.has(t.id))).monto;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Resumen global */}
      <div className="bg-[#f5f3ff] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold text-[#9ca3af]">Total pendiente de cobrar</p>
          <p className="text-2xl font-black text-[#7c3aed]">{fmtMoney(totalMonto)}</p>
        </div>
        <button
          type="button"
          disabled={selected.size===0||pending}
          onClick={()=>startTrans(async()=>{ await marcarCobrados([...selected]); })}
          className="px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white text-sm font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
        >
          {pending ? "Guardando…" : `✓ Marcar ${selected.size} como cobrado`}
        </button>
      </div>

      {turnos.length === 0 ? (
        <div className="text-center py-12 text-[#9ca3af] font-bold bg-white rounded-2xl">
          Sin cobros pendientes. ¡Todo al día! 🎉
        </div>
      ) : (
        Object.entries(grupos).map(([key, { alumno, turnos: gTurnos }]) => {
          const { horas, monto } = calcGrupo(gTurnos);
          const selCount = gTurnos.filter(t=>selected.has(t.id)).length;
          return (
            <div key={key} className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
              {/* Header alumno */}
              <div className="px-5 py-3 bg-[#faf5ff] flex items-center justify-between border-b border-[#e5e7eb]">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selCount===gTurnos.length}
                    onChange={e=>{ const s=new Set(selected); gTurnos.forEach(t=>e.target.checked?s.add(t.id):s.delete(t.id)); setSelected(s); }}
                    className="rounded"
                  />
                  <div>
                    <p className="font-extrabold text-[#1e1b4b]">{alumno?.nombre} {alumno?.apellido}</p>
                    {alumno?.telefono_contacto && <p className="text-xs text-[#9ca3af] font-semibold">💬 {alumno.telefono_contacto}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9ca3af] font-semibold">{horas.toFixed(1)} hs · {gTurnos.length} turno{gTurnos.length!==1?"s":""}</p>
                  <p className="text-base font-black text-[#7c3aed]">{fmtMoney(monto)}</p>
                </div>
              </div>

              {/* Turnos del alumno */}
              <table className="w-full text-xs">
                <tbody>
                  {gTurnos.map(t => (
                    <tr key={t.id} className="border-b border-[#f9fafb] last:border-0">
                      <td className="px-5 py-2 w-8">
                        <input type="checkbox" checked={selected.has(t.id)} onChange={e=>{ const s=new Set(selected); e.target.checked?s.add(t.id):s.delete(t.id); setSelected(s); }} className="rounded"/>
                      </td>
                      <td className="px-3 py-2 text-[#9ca3af] font-semibold whitespace-nowrap">
                        {t.slot ? new Date(t.slot.fecha+"T00:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"}) : "—"}
                      </td>
                      <td className="px-3 py-2 font-bold text-[#374151]">{t.materia}</td>
                      <td className="px-3 py-2 text-[#9ca3af]">{t.anio}</td>
                      <td className="px-3 py-2 font-bold text-[#374151]">{((t.slot?.duracion_minutos??60)/60).toFixed(1)} hs</td>
                      <td className="px-3 py-2 font-extrabold text-[#059669]">
                        {fmtMoney(((t.slot?.duracion_minutos??60)/60) * valorHoraTurno(t))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
