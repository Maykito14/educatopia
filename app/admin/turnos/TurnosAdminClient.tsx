"use client";

import { useState, useEffect, useTransition } from "react";
import { actualizarTurno, obtenerSlotsDisponiblesAdmin, reprogramarTurnoAdmin } from "./actions";
import type { SlotDisponible } from "./actions";

type TurnoEdit = {
  id: string; materia: string; anio: string; colegio: string; estado: string;
  confirmado_por_profesor: boolean; asistio: boolean | null;
  pagado: boolean; cobrado: boolean;
  medio_cobro: "efectivo" | "transferencia" | null;
  slot: { id: string; fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number; profesor_id: string } | null;
  alumno: { nombre: string; apellido: string; nivel_educativo: string | null } | null;
};

const ESTADOS = ["pendiente","confirmado","cancelado","completado"];

function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean | null; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled}
      onClick={() => onChange(!value)}
      className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
        value === true  ? "bg-[#d1fae5] text-[#059669]" :
        value === false ? "bg-[#fee2e2] text-[#ef4444]" :
                          "bg-[#f3f4f6] text-[#9ca3af]"
      }`}
    >
      {value === true ? "✓ " : value === false ? "✗ " : "? "}{label}
    </button>
  );
}

function formatFechaSlot(fecha: string, hora: string) {
  const [y, m, d] = fecha.split("-");
  const diasSemana = ["dom","lun","mar","mié","jue","vie","sáb"];
  const dia = diasSemana[new Date(`${fecha}T00:00:00`).getDay()];
  return `${dia} ${d}/${m}/${y} · ${hora.slice(0, 5)}`;
}

function agruparPorFecha(slots: SlotDisponible[]) {
  const grupos = new Map<string, SlotDisponible[]>();
  for (const s of slots) {
    const list = grupos.get(s.fecha) ?? [];
    list.push(s);
    grupos.set(s.fecha, list);
  }
  return grupos;
}

function ReprogramarPanel({
  turnoId,
  profesorId,
  slotActualId,
  onCerrar,
}: {
  turnoId: string;
  profesorId: string;
  slotActualId: string;
  onCerrar: () => void;
}) {
  const [fase, setFase] = useState<"cargando" | "seleccion" | "confirmando" | "exito" | "error">("cargando");
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [seleccionado, setSeleccionado] = useState<SlotDisponible | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    obtenerSlotsDisponiblesAdmin(profesorId, slotActualId).then(data => {
      setSlots(data);
      setFase("seleccion");
    });
  }, [profesorId, slotActualId]);

  function confirmar() {
    if (!seleccionado) return;
    startTransition(async () => {
      const result = await reprogramarTurnoAdmin(turnoId, seleccionado.id);
      if (result.ok) {
        setFase("exito");
      } else {
        setErrorMsg(result.error ?? "Error al reprogramar");
        setFase("error");
      }
    });
  }

  if (fase === "cargando") {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-[#9ca3af] font-semibold">
        <span className="inline-block w-3 h-3 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        Cargando slots disponibles…
      </div>
    );
  }

  if (fase === "exito") {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-[#059669]">✓ Turno reprogramado. Se notificó al responsable.</span>
        <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline ml-4">Cerrar</button>
      </div>
    );
  }

  if (fase === "error") {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-[#ef4444]">✗ {errorMsg}</span>
        <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline ml-4">Cerrar</button>
      </div>
    );
  }

  const grupos = agruparPorFecha(slots);

  if (fase === "seleccion") {
    if (slots.length === 0) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#9ca3af] font-semibold">No hay slots disponibles para este profesor.</span>
          <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline ml-4">Cerrar</button>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <p className="text-xs font-extrabold text-[#374151]">Seleccioná el nuevo horario (mismo profesor):</p>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {Array.from(grupos.entries()).map(([fecha, slotsDelDia]) => (
            <div key={fecha} className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-extrabold text-[#9ca3af] uppercase">
                {new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
              </span>
              {slotsDelDia.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSeleccionado(s); setFase("confirmando"); }}
                  className="px-2 py-1 rounded-lg text-xs font-black border-2 border-[#e5e7eb] bg-white hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
                >
                  {s.hora_inicio.slice(0, 5)} ({s.duracion_minutos}')
                  {s.capacidad_max - s.ocupados < 3 && (
                    <span className="ml-1 text-[#f59e0b]">·{s.capacidad_max - s.ocupados}c</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline">Cancelar</button>
      </div>
    );
  }

  // fase === "confirmando"
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-[#374151]">
        Nuevo slot: <span className="font-black text-[#7c3aed]">
          {seleccionado && formatFechaSlot(seleccionado.fecha, seleccionado.hora_inicio)} ({seleccionado?.duracion_minutos} min)
        </span>
        <span className="text-[#9ca3af] ml-1">· volverá a pendiente</span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={confirmar}
        className="px-3 py-1 rounded-xl bg-[#7c3aed] text-white text-xs font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
      >
        {pending ? "Reprogramando…" : "Confirmar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => { setSeleccionado(null); setFase("seleccion"); }}
        className="px-3 py-1 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] transition-colors disabled:opacity-50"
      >
        Cambiar
      </button>
      <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline">Cancelar</button>
    </div>
  );
}

function TurnoRow({ t, profesores }: { t: TurnoEdit; profesores: {id:string;nombre:string}[] }) {
  const [pending, startTrans] = useTransition();
  const [showReprogramar, setShowReprogramar] = useState(false);
  const profNombre = profesores.find(p=>p.id===t.slot?.profesor_id)?.nombre ?? "—";

  function update(patch: Parameters<typeof actualizarTurno>[1]) {
    startTrans(() => actualizarTurno(t.id, patch));
  }

  return (
    <>
      <tr className={`border-b border-[#f9fafb] hover:bg-[#faf5ff] transition-colors ${pending?"opacity-50":""}`}>
        <td className="px-3 py-2.5 text-xs text-[#9ca3af] font-semibold whitespace-nowrap">
          {t.slot ? new Date(t.slot.fecha+"T00:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"}) : "—"}
          <br/>{t.slot?.hora_inicio?.slice(0,5)}
        </td>
        <td className="px-3 py-2.5">
          <p className="font-extrabold text-[#1e1b4b] text-sm">{t.alumno?.nombre} {t.alumno?.apellido}</p>
          <p className="text-xs text-[#9ca3af] font-semibold">{t.alumno?.nivel_educativo}</p>
        </td>
        <td className="px-3 py-2.5 text-xs font-semibold text-[#374151]">{profNombre}</td>
        <td className="px-3 py-2.5 text-xs font-semibold text-[#374151]">{t.materia}<br/><span className="text-[#9ca3af]">{t.anio}</span></td>
        {/* Estado */}
        <td className="px-3 py-2.5">
          <select value={t.estado} disabled={pending}
            onChange={e=>update({estado:e.target.value})}
            className="text-xs font-extrabold rounded-lg border border-[#e5e7eb] px-2 py-1 focus:border-[#7c3aed] outline-none bg-white">
            {ESTADOS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        {/* Duración */}
        <td className="px-3 py-2.5">
          <select value={t.slot?.duracion_minutos??60} disabled={pending}
            onChange={e=>update({duracion_minutos:Number(e.target.value)})}
            className="text-xs font-extrabold rounded-lg border border-[#e5e7eb] px-2 py-1 focus:border-[#7c3aed] outline-none bg-white">
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
            <option value={120}>120 min</option>
          </select>
        </td>
        {/* Flags */}
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1">
            <Toggle label="Confirmado" value={t.confirmado_por_profesor} onChange={v=>update({confirmado_por_profesor:v})} disabled={pending}/>
            <Toggle label="Asistió"    value={t.asistio}                 onChange={v=>update({asistio:v})}                 disabled={pending}/>
            <Toggle label="Pagado"     value={t.pagado}                  onChange={v=>update({pagado:v})}                  disabled={pending}/>
            <Toggle label="Cobrado"    value={t.cobrado}                 onChange={v=>update({cobrado:v})}                 disabled={pending}/>
          </div>
        </td>
        {/* Medio de cobro */}
        <td className="px-3 py-2.5">
          <select value={t.medio_cobro ?? ""} disabled={pending}
            onChange={e=>update({medio_cobro: (e.target.value as "efectivo"|"transferencia") || null})}
            className={`text-xs font-extrabold rounded-lg border px-2 py-1 outline-none bg-white transition-colors ${
              t.medio_cobro === "efectivo"      ? "border-[#f59e0b] text-[#92400e]" :
              t.medio_cobro === "transferencia" ? "border-[#6366f1] text-[#4338ca]" :
                                                  "border-[#e5e7eb] text-[#9ca3af]"
            }`}>
            <option value="">— sin definir</option>
            <option value="transferencia">🏦 Transferencia</option>
            <option value="efectivo">💵 Efectivo</option>
          </select>
        </td>
        {/* Reprogramar */}
        <td className="px-3 py-2.5">
          {t.slot && (
            <button
              type="button"
              onClick={() => setShowReprogramar(v => !v)}
              className={`px-2 py-1 rounded-xl text-xs font-black transition-colors ${
                showReprogramar
                  ? "bg-[#ede9fe] text-[#7c3aed]"
                  : "bg-[#f3f4f6] text-[#374151] hover:bg-[#ede9fe] hover:text-[#7c3aed]"
              }`}
            >
              📅 Reprogramar
            </button>
          )}
        </td>
      </tr>
      {showReprogramar && t.slot && (
        <tr className="bg-[#faf5ff] border-b border-[#e5e7eb]">
          <td colSpan={9} className="px-4 py-3">
            <ReprogramarPanel
              turnoId={t.id}
              profesorId={t.slot.profesor_id}
              slotActualId={t.slot.id}
              onCerrar={() => setShowReprogramar(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export default function TurnosAdminClient({
  turnos, profesores,
}: { turnos: TurnoEdit[]; profesores: {id:string;nombre:string}[] }) {
  const [filtroProf, setFiltroProf] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [search, setSearch] = useState("");

  const filtrados = turnos.filter(t => {
    if (filtroProf !== "todos" && t.slot?.profesor_id !== filtroProf) return false;
    if (filtroEstado !== "todos" && t.estado !== filtroEstado) return false;
    if (search) {
      const q = search.toLowerCase();
      return (t.alumno?.nombre+" "+t.alumno?.apellido).toLowerCase().includes(q) || t.materia.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
        <input type="text" placeholder="Buscar alumno o materia…" value={search} onChange={e=>setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold focus:border-[#7c3aed] outline-none"/>
        <select value={filtroProf} onChange={e=>setFiltroProf(e.target.value)}
          className="px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold focus:border-[#7c3aed] outline-none bg-white">
          <option value="todos">Todos los profesores</option>
          {profesores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}
          className="px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold focus:border-[#7c3aed] outline-none bg-white">
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-[#9ca3af] font-semibold self-center">{filtrados.length} turno{filtrados.length!==1?"s":""}</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
        {filtrados.length === 0 ? (
          <div className="py-12 text-center text-[#9ca3af] font-bold">Sin turnos que coincidan con los filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#f3f4f6]">
                  {["Fecha","Alumno","Profesor","Materia","Estado","Duración","Controles","Cobro",""].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-extrabold text-[#9ca3af] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(t=><TurnoRow key={t.id} t={t} profesores={profesores}/>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
