"use client";

import { useState, useTransition } from "react";
import { marcarPagados } from "./actions";

type Precio = {
  nivel: string; valor_hora: number; porcentaje_profesor: number;
  pack_semanal_precio: number | null; pack_semanal_horas: number | null;
  pack_mensual_precio: number | null; pack_mensual_horas: number | null;
};
type TurnoLiq = {
  id: string; materia: string; anio: string; colegio: string; pagado: boolean;
  tipo_pedido: "suelto" | "pack_semanal" | "pack_mensual" | null;
  slot: { fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number } | null;
  alumno: { nombre: string; apellido: string; nivel_educativo: string | null } | null;
};

function pad(n: number) { return String(n).padStart(2,"0"); }
function getMon(d: Date) {
  const m = new Date(d); m.setHours(0,0,0,0);
  m.setDate(m.getDate()-((m.getDay()+6)%7)); return m;
}
function fmtDate(iso: string) {
  return new Date(iso+"T00:00:00").toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"2-digit"});
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n);
}

export default function LiquidacionClient({
  profesores, precios,
}: {
  profesores: { id: string; nombre: string }[];
  precios: Precio[];
}) {
  const [profId, setProfId]     = useState(profesores[0]?.id ?? "");
  const [semana, setSemana]     = useState(() => getMon(new Date()).toISOString().slice(0,10));
  const [turnos, setTurnos]     = useState<TurnoLiq[]>([]);
  const [loaded, setLoaded]     = useState(false);
  const [pending, startTrans]   = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const precioMap: Record<string, Precio> = {};
  precios.forEach(p => { precioMap[p.nivel] = p; });

  async function buscar() {
    setLoaded(false);
    const desde = semana;
    const hastaD = new Date(semana+"T00:00:00"); hastaD.setDate(hastaD.getDate()+6);
    const hasta = hastaD.toISOString().slice(0,10);
    const res = await fetch(`/api/admin/liquidacion?profesor=${profId}&desde=${desde}&hasta=${hasta}`);
    const data = await res.json();
    setTurnos(data);
    setSelected(new Set(data.filter((t:TurnoLiq)=>!t.pagado).map((t:TurnoLiq)=>t.id)));
    setLoaded(true);
  }

  function valorHoraTurno(t: TurnoLiq): number {
    const nivel  = t.alumno?.nivel_educativo ?? "secundario";
    const p = precioMap[nivel] ?? precioMap["secundario"];
    if (!p) return 0;
    if (t.tipo_pedido === "pack_semanal" && p.pack_semanal_precio && p.pack_semanal_horas) {
      return p.pack_semanal_precio / p.pack_semanal_horas;
    }
    if (t.tipo_pedido === "pack_mensual" && p.pack_mensual_precio && p.pack_mensual_horas) {
      return p.pack_mensual_precio / p.pack_mensual_horas;
    }
    return p.valor_hora;
  }

  function calcTurno(t: TurnoLiq) {
    const nivel   = t.alumno?.nivel_educativo ?? "secundario";
    const precio  = precioMap[nivel] ?? precioMap["secundario"];
    const horas   = (t.slot?.duracion_minutos ?? 60) / 60;
    const vh      = valorHoraTurno(t);
    const monto   = horas * vh * (precio?.porcentaje_profesor ?? 100) / 100;
    return { horas, monto, vh };
  }

  const selectedList = turnos.filter(t => selected.has(t.id));
  const totalHoras   = selectedList.reduce((acc,t)=>acc+calcTurno(t).horas, 0);
  const totalMonto   = selectedList.reduce((acc,t)=>acc+calcTurno(t).monto, 0);

  const inputCls = "px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold text-[#374151] focus:border-[#7c3aed] outline-none bg-white";

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="bg-white rounded-2xl p-5 flex flex-wrap gap-4 items-end" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
        <div>
          <label className="block text-xs font-extrabold text-[#374151] mb-1">Profesor</label>
          <select value={profId} onChange={e=>{setProfId(e.target.value);setLoaded(false);}} className={inputCls}>
            {profesores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-extrabold text-[#374151] mb-1">Semana (lunes)</label>
          <input type="date" value={semana} onChange={e=>{ setSemana(e.target.value); setLoaded(false); }} className={inputCls}/>
        </div>
        <button type="button" onClick={buscar} disabled={!profId} className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white text-sm font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50">
          Buscar
        </button>
      </div>

      {loaded && (
        <>
          {turnos.length === 0 ? (
            <div className="text-center py-10 text-[#9ca3af] font-bold bg-white rounded-2xl">Sin turnos asistidos en ese período.</div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
              {/* Resumen */}
              <div className="px-5 py-4 bg-[#f5f3ff] flex flex-wrap gap-6 border-b border-[#e5e7eb]">
                <div>
                  <p className="text-xs font-extrabold text-[#9ca3af]">Turnos seleccionados</p>
                  <p className="text-xl font-black text-[#7c3aed]">{selectedList.length}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#9ca3af]">Horas trabajadas</p>
                  <p className="text-xl font-black text-[#1e1b4b]">{totalHoras.toFixed(1)} hs</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#9ca3af]">Total a pagar</p>
                  <p className="text-xl font-black text-[#059669]">{fmtMoney(totalMonto)}</p>
                </div>
                <div className="ml-auto self-center">
                  <button
                    type="button"
                    disabled={selectedList.length===0||pending}
                    onClick={()=>startTrans(async()=>{ await marcarPagados([...selected]); setLoaded(false); })}
                    className="px-5 py-2.5 rounded-xl bg-[#059669] text-white text-sm font-black hover:bg-[#047857] transition-colors disabled:opacity-50"
                  >
                    {pending ? "Guardando…" : `💰 Marcar ${selectedList.length} como pagado`}
                  </button>
                </div>
              </div>

              {/* Tabla */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="px-4 py-2 w-8"><input type="checkbox" checked={selected.size===turnos.filter(t=>!t.pagado).length} onChange={e=>setSelected(e.target.checked?new Set(turnos.filter(t=>!t.pagado).map(t=>t.id)):new Set())} className="rounded"/></th>
                    {["Fecha","Alumno","Materia","Nivel","Duración","Valor hora","% Prof.","Monto","Estado"].map(h=>(
                      <th key={h} className="px-3 py-2 text-left text-xs font-extrabold text-[#9ca3af] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {turnos.map(t=>{
                    const nivel  = t.alumno?.nivel_educativo ?? "secundario";
                    const precio = precioMap[nivel] ?? precioMap["secundario"];
                    const {horas, monto, vh} = calcTurno(t);
                    const tipLabel: Record<string,string> = { suelto: "", pack_semanal: " (sem.)", pack_mensual: " (mens.)" };
                    const packTag = t.tipo_pedido && t.tipo_pedido !== "suelto"
                      ? <span className="ml-1 text-[9px] font-black px-1 py-0.5 bg-[#ede9fe] text-[#7c3aed] rounded">{tipLabel[t.tipo_pedido]?.trim()}</span>
                      : null;
                    return (
                      <tr key={t.id} className={`border-b border-[#f9fafb] ${t.pagado?"opacity-50":""}`}>
                        <td className="px-4 py-2.5">
                          {!t.pagado && (
                            <input type="checkbox" checked={selected.has(t.id)} onChange={e=>{ const s=new Set(selected); e.target.checked?s.add(t.id):s.delete(t.id); setSelected(s); }} className="rounded"/>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#6b7280] whitespace-nowrap">{t.slot?fmtDate(t.slot.fecha):"—"}</td>
                        <td className="px-3 py-2.5 font-extrabold text-[#1e1b4b] whitespace-nowrap">{t.alumno?.nombre} {t.alumno?.apellido}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#6b7280]">{t.materia}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#6b7280] capitalize">{nivel}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#374151]">{horas.toFixed(1)} hs</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#374151] whitespace-nowrap">
                          {fmtMoney(vh)}{packTag}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#374151]">{precio?.porcentaje_profesor ?? "—"}%</td>
                        <td className="px-3 py-2.5 font-extrabold text-[#059669]">{fmtMoney(monto)}</td>
                        <td className="px-3 py-2.5">
                          {t.pagado
                            ? <span className="text-[10px] font-black px-1.5 py-0.5 bg-[#d1fae5] text-[#059669] rounded-full">Pagado</span>
                            : <span className="text-[10px] font-black px-1.5 py-0.5 bg-[#fef3c7] text-[#d97706] rounded-full">Pendiente</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
