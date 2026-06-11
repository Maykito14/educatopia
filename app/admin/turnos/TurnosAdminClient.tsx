"use client";

import { useState, useEffect, useTransition } from "react";
import { actualizarTurno, obtenerSlotsDisponiblesAdmin, reprogramarTurnoAdmin, eliminarTurnoAdmin } from "./actions";
import type { SlotDisponible } from "./actions";

type PrecioRow = {
  nivel: string;
  valor_hora: number;
  pack_semanal_precio: number | null;
  pack_semanal_horas: number | null;
  pack_mensual_precio: number | null;
  pack_mensual_horas: number | null;
};

type TurnoEdit = {
  id: string; created_at: string | null; materia: string; anio: string; colegio: string; estado: string;
  tipo_pedido: "suelto" | "pack_semanal" | "pack_mensual" | null;
  confirmado_por_profesor: boolean; asistio: boolean | null;
  pagado: boolean; cobrado: boolean;
  medio_cobro: "efectivo" | "transferencia" | null;
  creador: { nombre: string; rol: string } | null;
  slot: { id: string; fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number; profesor_id: string } | null;
  alumno: { nombre: string; apellido: string; nivel_educativo: string | null } | null;
};

function calcularPrecioHora(
  tipo: "suelto" | "pack_semanal" | "pack_mensual",
  nivel: string | null,
  precios: PrecioRow[]
): number | null {
  if (!nivel) return null;
  const p = precios.find(pr => pr.nivel === nivel);
  if (!p) return null;
  if (tipo === "pack_semanal" && p.pack_semanal_precio && p.pack_semanal_horas) {
    return p.pack_semanal_precio / p.pack_semanal_horas;
  }
  if (tipo === "pack_mensual" && p.pack_mensual_precio && p.pack_mensual_horas) {
    return p.pack_mensual_precio / p.pack_mensual_horas;
  }
  return p.valor_hora;
}

function fmtPesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const ESTADOS = ["pendiente","confirmado","cancelado","completado"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function getMon(d: Date) {
  const m = new Date(d); m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

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

function formatCreatedAt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function labelCreador(creador: { nombre: string; rol: string } | null) {
  if (!creador) return "Turno Web";
  if (creador.rol === "profesor") return creador.nombre;
  if (creador.rol === "admin")    return `${creador.nombre} (admin)`;
  return "Turno Web";
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

function tieneGrupo(slot: SlotDisponible, materia: string, anio: string, colegio: string) {
  return slot.turnosEnSlot.some(t => t.materia === materia && t.anio === anio && t.colegio === colegio);
}

function ReprogramarPanel({
  turnoId, slotActualId, materia, anio, colegio, onCerrar,
}: {
  turnoId: string; slotActualId: string;
  materia: string; anio: string; colegio: string;
  onCerrar: () => void;
}) {
  const [fase, setFase] = useState<"cargando" | "seleccion" | "confirmando" | "exito" | "error">("cargando");
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [seleccionado, setSeleccionado] = useState<SlotDisponible | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    obtenerSlotsDisponiblesAdmin(slotActualId).then(data => { setSlots(data); setFase("seleccion"); });
  }, [slotActualId]);

  function confirmar() {
    if (!seleccionado) return;
    startTransition(async () => {
      const result = await reprogramarTurnoAdmin(turnoId, seleccionado.id);
      result.ok ? setFase("exito") : (setErrorMsg(result.error ?? "Error al reprogramar"), setFase("error"));
    });
  }

  if (fase === "cargando") return (
    <div className="flex items-center gap-2 py-1 text-xs text-[#9ca3af] font-semibold">
      <span className="inline-block w-3 h-3 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      Cargando turnos disponibles…
    </div>
  );

  if (fase === "exito") return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-black text-[#059669]">✓ Turno reprogramado. Se notificó al responsable.</span>
      <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline ml-4">Cerrar</button>
    </div>
  );

  if (fase === "error") return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-black text-[#ef4444]">✗ {errorMsg}</span>
      <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline ml-4">Cerrar</button>
    </div>
  );

  if (fase === "seleccion") {
    if (slots.length === 0) return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#9ca3af] font-semibold">No hay turnos disponibles para reprogramar.</span>
        <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline ml-4">Cerrar</button>
      </div>
    );

    const conGrupo = slots.filter(s => tieneGrupo(s, materia, anio, colegio));
    const sinGrupo = slots.filter(s => !tieneGrupo(s, materia, anio, colegio));
    const gruposPorFecha = agruparPorFecha(sinGrupo);

    return (
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-[#374151]">Elegí el nuevo turno:</p>
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">

          {conGrupo.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#059669] inline-block"/>
                Con grupo ({conGrupo.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {conGrupo.map(s => (
                  <button key={s.id} type="button"
                    onClick={() => { setSeleccionado(s); setFase("confirmando"); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black border-2 border-[#bbf7d0] bg-[#f0fdf4] text-[#059669] hover:border-[#059669] transition-colors">
                    <span className="text-[#6b7280] font-semibold">{s.profesorNombre}</span>
                    <span>·</span>
                    {new Date(s.fecha+"T00:00:00").toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short"})}
                    <span>·</span>
                    {s.hora_inicio.slice(0,5)}
                    <span className="text-[#9ca3af] font-semibold">({s.duracion_minutos}')</span>
                    {s.capacidad_max - s.ocupados <= 2 && (
                      <span className="text-[#f59e0b] font-black">·{s.capacidad_max - s.ocupados}c</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sinGrupo.length > 0 && (
            <div>
              {conGrupo.length > 0 && (
                <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-1.5">Otros turnos disponibles</p>
              )}
              {Array.from(gruposPorFecha.entries()).map(([fecha, slotsDelDia]) => (
                <div key={fecha} className="mb-2">
                  <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-1">
                    {new Date(fecha+"T00:00:00").toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {slotsDelDia.map(s => (
                      <button key={s.id} type="button"
                        onClick={() => { setSeleccionado(s); setFase("confirmando"); }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border-2 border-[#e5e7eb] bg-white hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors">
                        <span className="text-[#9ca3af] font-semibold">{s.profesorNombre}</span>
                        <span>·</span>
                        {s.hora_inicio.slice(0,5)}
                        <span className="text-[#9ca3af] font-semibold">({s.duracion_minutos}')</span>
                        {s.capacidad_max - s.ocupados <= 2 && (
                          <span className="text-[#f59e0b] font-black">·{s.capacidad_max - s.ocupados}c</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline">Cancelar</button>
      </div>
    );
  }

  // fase === "confirmando"
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-[#374151]">
        Nuevo turno:{" "}
        <span className="font-black text-[#7c3aed]">
          {seleccionado && `${seleccionado.profesorNombre} · ${formatFechaSlot(seleccionado.fecha, seleccionado.hora_inicio)} (${seleccionado.duracion_minutos} min)`}
        </span>
        {seleccionado && tieneGrupo(seleccionado, materia, anio, colegio) && (
          <span className="ml-2 text-[10px] font-black text-[#059669] bg-[#d1fae5] px-1.5 py-0.5 rounded-full">Con grupo</span>
        )}
        <span className="text-[#9ca3af] ml-1">· volverá a pendiente</span>
      </span>
      <button type="button" disabled={pending} onClick={confirmar}
        className="px-3 py-1 rounded-xl bg-[#7c3aed] text-white text-xs font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50">
        {pending ? "Reprogramando…" : "Confirmar"}
      </button>
      <button type="button" disabled={pending} onClick={() => { setSeleccionado(null); setFase("seleccion"); }}
        className="px-3 py-1 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] transition-colors disabled:opacity-50">
        Cambiar
      </button>
      <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline">Cancelar</button>
    </div>
  );
}

function TurnoRow({ t, profesores, precios }: { t: TurnoEdit; profesores: {id:string;nombre:string}[]; precios: PrecioRow[] }) {
  const [pending, startTrans] = useTransition();
  const [showReprogramar, setShowReprogramar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [tipoPedido, setTipoPedido] = useState<"suelto"|"pack_semanal"|"pack_mensual">(
    t.tipo_pedido ?? "suelto"
  );
  const profNombre = profesores.find(p=>p.id===t.slot?.profesor_id)?.nombre ?? "—";

  function update(patch: Parameters<typeof actualizarTurno>[1]) {
    startTrans(() => actualizarTurno(t.id, patch));
  }

  function handleEliminar() {
    startTrans(async () => {
      const r = await eliminarTurnoAdmin(t.id);
      if (!r.ok) setErrorEliminar(r.error ?? "Error al eliminar");
    });
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
        {/* Duración + Pack */}
        <td className="px-3 py-2.5">
          <div className="flex flex-col gap-1">
            <select value={t.slot?.duracion_minutos??60} disabled={pending}
              onChange={e=>update({duracion_minutos:Number(e.target.value)})}
              className="text-xs font-extrabold rounded-lg border border-[#e5e7eb] px-2 py-1 focus:border-[#7c3aed] outline-none bg-white">
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
            <select
              value={tipoPedido}
              disabled={pending}
              onChange={e => {
                const v = e.target.value as "suelto"|"pack_semanal"|"pack_mensual";
                setTipoPedido(v);
                update({ tipo_pedido: v });
              }}
              className="text-xs font-extrabold rounded-lg border border-[#e5e7eb] px-2 py-1 focus:border-[#7c3aed] outline-none bg-white">
              <option value="suelto">Suelto</option>
              <option value="pack_semanal">Pack semanal</option>
              <option value="pack_mensual">Pack mensual</option>
            </select>
            {(() => {
              const ph = calcularPrecioHora(tipoPedido, t.alumno?.nivel_educativo ?? null, precios);
              if (ph == null) return null;
              const dur = t.slot?.duracion_minutos ?? 60;
              return (
                <span className="text-[10px] font-semibold text-[#7c3aed]">{fmtPesos((dur / 60) * ph)}/turno</span>
              );
            })()}
          </div>
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
        {/* Registrado */}
        <td className="px-3 py-2.5 text-[11px] text-[#9ca3af] font-semibold whitespace-nowrap">
          <span className="block">{formatCreatedAt(t.created_at)}</span>
          <span className={`block font-extrabold mt-0.5 ${t.creador ? "text-[#7c3aed]" : "text-[#9ca3af]"}`}>
            {labelCreador(t.creador)}
          </span>
        </td>
        {/* Acciones */}
        <td className="px-3 py-2.5">
          <div className="flex flex-col gap-1">
            {t.slot && (
              <button
                type="button"
                onClick={() => { setShowReprogramar(v => !v); setShowEliminar(false); }}
                className={`px-2 py-1 rounded-xl text-xs font-black transition-colors ${
                  showReprogramar
                    ? "bg-[#ede9fe] text-[#7c3aed]"
                    : "bg-[#f3f4f6] text-[#374151] hover:bg-[#ede9fe] hover:text-[#7c3aed]"
                }`}
              >
                📅 Reprogramar
              </button>
            )}
            <button
              type="button"
              onClick={() => { setShowEliminar(v => !v); setShowReprogramar(false); setErrorEliminar(""); }}
              className={`px-2 py-1 rounded-xl text-xs font-black transition-colors ${
                showEliminar
                  ? "bg-[#fee2e2] text-[#ef4444]"
                  : "bg-[#f3f4f6] text-[#374151] hover:bg-[#fee2e2] hover:text-[#ef4444]"
              }`}
            >
              🗑️ Eliminar
            </button>
          </div>
        </td>
      </tr>
      {showReprogramar && t.slot && (
        <tr className="bg-[#faf5ff] border-b border-[#e5e7eb]">
          <td colSpan={10} className="px-4 py-3">
            <ReprogramarPanel
              turnoId={t.id}
              slotActualId={t.slot.id}
              materia={t.materia} anio={t.anio} colegio={t.colegio}
              onCerrar={() => setShowReprogramar(false)}
            />
          </td>
        </tr>
      )}
      {showEliminar && (
        <tr className="bg-[#fff5f5] border-b border-[#fecaca]">
          <td colSpan={10} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-[#374151]">
                ¿Eliminás el turno de <span className="font-black text-[#1e1b4b]">{t.alumno?.nombre} {t.alumno?.apellido}</span>?{" "}
                <span className="text-[#ef4444] font-black">Esta acción no se puede deshacer.</span>
              </span>
              {errorEliminar && <span className="text-xs font-black text-[#ef4444]">✗ {errorEliminar}</span>}
              <button type="button" disabled={pending} onClick={handleEliminar}
                className="px-3 py-1 rounded-xl bg-[#ef4444] text-white text-xs font-black hover:bg-[#dc2626] disabled:opacity-50 transition-colors">
                {pending ? "Eliminando…" : "Sí, eliminar"}
              </button>
              <button type="button" disabled={pending} onClick={() => setShowEliminar(false)}
                className="px-3 py-1 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] disabled:opacity-50 transition-colors">
                Cancelar
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function TurnosAdminClient({
  turnos, profesores, precios,
}: { turnos: TurnoEdit[]; profesores: {id:string;nombre:string}[]; precios: PrecioRow[] }) {
  const [filtroProf, setFiltroProf] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [search, setSearch] = useState("");
  const [weekStart, setWeekStart] = useState(() => getMon(new Date()));

  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

  // Ordenar por fecha de slot DESC
  const ordenados = [...turnos].sort((a, b) => {
    const fa = a.slot?.fecha ?? ""; const fb = b.slot?.fecha ?? "";
    if (fa !== fb) return fb.localeCompare(fa);
    const ha = a.slot?.hora_inicio ?? ""; const hb = b.slot?.hora_inicio ?? "";
    return hb.localeCompare(ha);
  });

  const filtrados = ordenados.filter(t => {
    if (filtroProf !== "todos" && t.slot?.profesor_id !== filtroProf) return false;
    if (filtroEstado !== "todos" && t.estado !== filtroEstado) return false;
    // Filtro de semana
    if (t.slot) {
      const f = new Date(t.slot.fecha + "T00:00:00");
      if (f < weekStart || f > weekEnd) return false;
    } else {
      return false;
    }
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

      {/* Segmentador de semana */}
      <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
        <button
          type="button"
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); }}
          className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] font-black text-lg leading-none"
        >‹</button>
        <button
          type="button"
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); }}
          className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] font-black text-lg leading-none"
        >›</button>
        <span className="text-sm font-extrabold text-[#1e1b4b]">
          {weekStart.toLocaleDateString("es-AR",{day:"numeric",month:"long"})} – {weekEnd.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}
        </span>
        <button
          type="button"
          onClick={() => setWeekStart(getMon(new Date()))}
          className="ml-auto px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-extrabold text-[#6b7280] hover:bg-[#f3f4f6]"
        >Hoy</button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
        {filtrados.length === 0 ? (
          <div className="py-12 text-center text-[#9ca3af] font-bold">Sin turnos que coincidan con los filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b border-[#f3f4f6]">
                  {["Fecha","Alumno","Profesor","Materia","Estado","Dur. / Pack","Controles","Cobro","Registrado","Acciones"].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-extrabold text-[#9ca3af] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(t=><TurnoRow key={t.id} t={t} profesores={profesores} precios={precios}/>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
