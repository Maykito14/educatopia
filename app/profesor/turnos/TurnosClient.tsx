"use client";

import { useState, useEffect, useTransition } from "react";
import {
  confirmarTurno, marcarAsistencia, actualizarCobro,
  obtenerSlotsDisponibles, reprogramarTurno,
  actualizarDatosTurno, actualizarDatosAlumno, eliminarTurno,
} from "./actions";
import type { SlotDisponible } from "./actions";

type TurnoRow = {
  id: string;
  alumno_id: string;
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
  slot: { id: string; fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number; profesor_id: string } | null;
  alumno: {
    nombre: string; apellido: string; edad: number | null;
    nivel_educativo: string | null; anio_grado: string | null;
    colegio: string | null;
    nombre_contacto: string | null; telefono_contacto: string | null;
  } | null;
};

type Filtro = "todos" | "pendientes" | "confirmados" | "asistidos";

const NIVELES = ["primario", "secundario", "terciario", "taller"];

const inputCls = "w-full px-2.5 py-1.5 rounded-lg border-2 border-[#e5e7eb] text-xs font-semibold focus:border-[#7c3aed] outline-none bg-white transition-colors";
const labelCls = "block text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-1";

function Badge({ ok, labelOk, labelNo }: { ok: boolean | null; labelOk: string; labelNo: string }) {
  if (ok === null) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f3f4f6] text-[#9ca3af]">Sin info</span>;
  return ok
    ? <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#d1fae5] text-[#059669]">{labelOk}</span>
    : <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fee2e2] text-[#ef4444]">{labelNo}</span>;
}

function formatFechaSlot(fecha: string, hora: string) {
  const diasSemana = ["dom","lun","mar","mié","jue","vie","sáb"];
  const dia = diasSemana[new Date(`${fecha}T00:00:00`).getDay()];
  const [y, m, d] = fecha.split("-");
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

/* ── Reprogramar ─────────────────────────────────────────────────────────── */

function ReprogramarPanel({
  turnoId, profesorId, slotActualId, onCerrar,
}: { turnoId: string; profesorId: string; slotActualId: string; onCerrar: () => void }) {
  const [fase, setFase] = useState<"cargando"|"seleccion"|"confirmando"|"exito"|"error">("cargando");
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [seleccionado, setSeleccionado] = useState<SlotDisponible | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    obtenerSlotsDisponibles(profesorId, slotActualId).then(data => { setSlots(data); setFase("seleccion"); });
  }, [profesorId, slotActualId]);

  function confirmar() {
    if (!seleccionado) return;
    startTransition(async () => {
      const result = await reprogramarTurno(turnoId, seleccionado.id);
      result.ok ? setFase("exito") : (setErrorMsg(result.error ?? "Error"), setFase("error"));
    });
  }

  if (fase === "cargando") return (
    <div className="text-xs text-[#9ca3af] font-semibold py-2 flex items-center gap-2">
      <span className="inline-block w-3 h-3 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"/>
      Cargando slots disponibles…
    </div>
  );

  if (fase === "exito") return (
    <p className="text-xs font-black text-[#059669] py-2">✓ Turno reprogramado. Se notificó al responsable.</p>
  );

  if (fase === "error") return (
    <div className="space-y-1">
      <p className="text-xs font-black text-[#ef4444]">✗ {errorMsg}</p>
      <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline">Cerrar</button>
    </div>
  );

  const grupos = agruparPorFecha(slots);

  if (fase === "seleccion") {
    if (slots.length === 0) return (
      <div className="space-y-1">
        <p className="text-xs text-[#9ca3af] font-semibold">No hay slots disponibles.</p>
        <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline">Cerrar</button>
      </div>
    );
    return (
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-[#374151]">Seleccioná el nuevo horario:</p>
        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
          {Array.from(grupos.entries()).map(([fecha, slotsDelDia]) => (
            <div key={fecha}>
              <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-1">
                {new Date(fecha+"T00:00:00").toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {slotsDelDia.map(s => (
                  <button key={s.id} type="button"
                    onClick={() => { setSeleccionado(s); setFase("confirmando"); }}
                    className="px-2.5 py-1 rounded-lg text-xs font-black border-2 border-[#e5e7eb] bg-white hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors">
                    {s.hora_inicio.slice(0,5)} ({s.duracion_minutos} min)
                    {s.capacidad_max - s.ocupados < 3 && <span className="ml-1 text-[#f59e0b]">·{s.capacidad_max - s.ocupados}c</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onCerrar} className="text-xs font-black text-[#9ca3af] underline">Cancelar</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#374151]">
        Nuevo turno: <span className="font-black text-[#7c3aed]">
          {seleccionado && formatFechaSlot(seleccionado.fecha, seleccionado.hora_inicio)} ({seleccionado?.duracion_minutos} min)
        </span>
      </p>
      <p className="text-[10px] text-[#6b7280]">El turno volverá a estado pendiente y se notificará al responsable.</p>
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={confirmar}
          className="px-3 py-1.5 rounded-xl bg-[#7c3aed] text-white text-xs font-black hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
          {pending ? "Reprogramando…" : "Confirmar reprogramación"}
        </button>
        <button type="button" disabled={pending} onClick={() => { setSeleccionado(null); setFase("seleccion"); }}
          className="px-3 py-1.5 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] disabled:opacity-50 transition-colors">
          Cambiar
        </button>
      </div>
    </div>
  );
}

/* ── Editar datos ────────────────────────────────────────────────────────── */

function EditPanel({ turno, onCerrar }: { turno: TurnoRow; onCerrar: () => void }) {
  const [form, setForm] = useState({
    // turno
    materia:          turno.materia,
    anio:             turno.anio,
    colegio_turno:    turno.colegio,
    objetivo:         turno.objetivo ?? "",
    notas:            turno.notas ?? "",
    duracion_minutos: turno.slot?.duracion_minutos ?? 60,
    // alumno
    nombre:           turno.alumno?.nombre ?? "",
    apellido:         turno.alumno?.apellido ?? "",
    edad:             turno.alumno?.edad != null ? String(turno.alumno.edad) : "",
    nivel_educativo:  turno.alumno?.nivel_educativo ?? "",
    anio_grado:       turno.alumno?.anio_grado ?? "",
    colegio_alumno:   turno.alumno?.colegio ?? "",
    nombre_contacto:  turno.alumno?.nombre_contacto ?? "",
    telefono_contacto: turno.alumno?.telefono_contacto ?? "",
  });
  const [fase, setFase] = useState<"idle"|"guardando"|"ok"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function guardar() {
    startTransition(async () => {
      setFase("guardando");
      const [resTurno, resAlumno] = await Promise.all([
        actualizarDatosTurno(turno.id, {
          materia:          form.materia.trim(),
          anio:             form.anio.trim(),
          colegio:          form.colegio_turno.trim(),
          objetivo:         form.objetivo.trim() || null,
          notas:            form.notas.trim() || null,
          duracion_minutos: Number(form.duracion_minutos),
        }),
        actualizarDatosAlumno(turno.alumno_id, {
          nombre:            form.nombre.trim(),
          apellido:          form.apellido.trim(),
          edad:              form.edad ? parseInt(form.edad) : null,
          nivel_educativo:   form.nivel_educativo || null,
          anio_grado:        form.anio_grado.trim() || null,
          colegio:           form.colegio_alumno.trim() || null,
          nombre_contacto:   form.nombre_contacto.trim() || null,
          telefono_contacto: form.telefono_contacto.trim() || null,
        }),
      ]);

      if (!resTurno.ok || !resAlumno.ok) {
        setErrorMsg(resTurno.error ?? resAlumno.error ?? "Error desconocido");
        setFase("error");
      } else {
        setFase("ok");
        setTimeout(onCerrar, 1200);
      }
    });
  }

  if (fase === "ok") return (
    <p className="text-xs font-black text-[#059669] py-2">✓ Datos guardados correctamente.</p>
  );

  return (
    <div className="space-y-4">
      {/* Datos del turno */}
      <div>
        <p className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wide mb-2">Datos del turno</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Materia</label>
            <input value={form.materia} onChange={set("materia")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Año / Curso</label>
            <input value={form.anio} onChange={set("anio")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Colegio (turno)</label>
            <input value={form.colegio_turno} onChange={set("colegio_turno")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Duración</label>
            <select value={form.duracion_minutos} onChange={set("duracion_minutos")} className={inputCls}>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Objetivo</label>
            <input value={form.objetivo} onChange={set("objetivo")} className={inputCls} placeholder="Objetivo académico" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Notas internas</label>
            <textarea value={form.notas} onChange={set("notas")} rows={2}
              className={inputCls + " resize-none"} placeholder="Notas para el profesor" />
          </div>
        </div>
      </div>

      {/* Datos del alumno */}
      <div className="pt-3 border-t border-[#e5e7eb]">
        <p className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wide mb-2">Datos del alumno</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Nombre</label>
            <input value={form.nombre} onChange={set("nombre")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Apellido</label>
            <input value={form.apellido} onChange={set("apellido")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nivel educativo</label>
            <select value={form.nivel_educativo} onChange={set("nivel_educativo")} className={inputCls}>
              <option value="">— sin especificar</option>
              {NIVELES.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Año / Grado</label>
            <input value={form.anio_grado} onChange={set("anio_grado")} className={inputCls} placeholder="Ej: 3º" />
          </div>
          <div>
            <label className={labelCls}>Edad</label>
            <input type="number" min={3} max={99} value={form.edad} onChange={set("edad")} className={inputCls} placeholder="—" />
          </div>
          <div>
            <label className={labelCls}>Colegio del alumno</label>
            <input value={form.colegio_alumno} onChange={set("colegio_alumno")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nombre contacto</label>
            <input value={form.nombre_contacto} onChange={set("nombre_contacto")} className={inputCls} placeholder="Tutor / madre / padre" />
          </div>
          <div>
            <label className={labelCls}>WhatsApp contacto</label>
            <input value={form.telefono_contacto} onChange={set("telefono_contacto")} className={inputCls} placeholder="3576…" />
          </div>
        </div>
      </div>

      {/* Acciones */}
      {fase === "error" && (
        <p className="text-xs font-black text-[#ef4444]">✗ {errorMsg}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" disabled={pending} onClick={guardar}
          className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-xs font-black hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
          {fase === "guardando" ? "Guardando…" : "Guardar cambios"}
        </button>
        <button type="button" disabled={pending} onClick={onCerrar}
          className="px-4 py-2 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] disabled:opacity-50 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ── TurnoCard ───────────────────────────────────────────────────────────── */

function TurnoCard({ turno }: { turno: TurnoRow }) {
  const [open, setOpen] = useState(false);
  const [showReprogramar, setShowReprogramar] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [pending, startTransition] = useTransition();
  const slot = turno.slot;
  const alumno = turno.alumno;

  const fechaLabel = slot
    ? new Date(slot.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    : "—";

  function handleOpenEditar() {
    setShowReprogramar(false);
    setShowEliminar(false);
    setShowEditar(true);
  }
  function handleOpenReprogramar() {
    setShowEditar(false);
    setShowEliminar(false);
    setShowReprogramar(true);
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#e5e7eb]">
      {/* Row principal */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#faf5ff] transition-colors">
        <div className="flex-shrink-0 w-14 text-center">
          <p className="text-xs font-black text-[#7c3aed] capitalize">
            {slot ? new Date(slot.fecha+"T00:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"}) : "—"}
          </p>
          <p className="text-[10px] text-[#9ca3af] font-semibold">{slot?.hora_inicio?.slice(0,5)}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-[#1e1b4b] truncate">{alumno?.nombre} {alumno?.apellido}</p>
          <p className="text-xs text-[#6b7280] font-semibold truncate">{turno.materia} · {turno.anio} · {turno.colegio}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge ok={turno.confirmado_por_profesor} labelOk="Confirmado" labelNo="Sin confirmar" />
            <Badge ok={turno.asistio} labelOk="Asistió" labelNo="No asistió" />
            {turno.pagado   && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#e0f2fe] text-[#0284c7]">Pagado</span>}
            {turno.cobrado  && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f0fdf4] text-[#15803d]">Cobrado</span>}
          </div>
        </div>
        <span className="text-[#9ca3af] text-xs mt-1 flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {/* Panel expandible */}
      {open && (
        <div className="px-4 pb-4 bg-[#faf5ff] border-t border-[#e5e7eb] space-y-3">

          {/* Resumen de datos */}
          <div className="text-xs text-[#6b7280] font-semibold pt-3 space-y-1">
            <p><span className="font-black text-[#374151]">Fecha:</span> {fechaLabel} · {slot?.hora_inicio?.slice(0,5)} — {slot?.hora_fin?.slice(0,5)} ({slot?.duracion_minutos} min)</p>
            {alumno?.nombre_contacto   && <p><span className="font-black text-[#374151]">Contacto:</span> {alumno.nombre_contacto}</p>}
            {alumno?.telefono_contacto && <p><span className="font-black text-[#374151]">WhatsApp:</span> {alumno.telefono_contacto}</p>}
            {turno.objetivo            && <p><span className="font-black text-[#374151]">Objetivo:</span> {turno.objetivo}</p>}
            {turno.notas               && <p><span className="font-black text-[#374151]">Notas:</span> {turno.notas}</p>}
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!turno.confirmado_por_profesor && (
              <button type="button" disabled={pending}
                onClick={() => startTransition(() => confirmarTurno(turno.id))}
                className="px-3 py-1.5 rounded-xl bg-[#7c3aed] text-white text-xs font-black hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
                ✓ Confirmar turno
              </button>
            )}
            {turno.asistio !== true && (
              <button type="button" disabled={pending}
                onClick={() => startTransition(() => marcarAsistencia(turno.id, true))}
                className="px-3 py-1.5 rounded-xl bg-[#10b981] text-white text-xs font-black hover:bg-[#059669] disabled:opacity-50 transition-colors">
                ✅ Asistió
              </button>
            )}
            {turno.asistio !== false && (
              <button type="button" disabled={pending}
                onClick={() => startTransition(() => marcarAsistencia(turno.id, false))}
                className="px-3 py-1.5 rounded-xl bg-[#ef4444] text-white text-xs font-black hover:bg-[#dc2626] disabled:opacity-50 transition-colors">
                ✗ No asistió
              </button>
            )}
          </div>

          {/* Cobro */}
          <div className="pt-2 border-t border-[#e5e7eb]">
            <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-2">Cobro al alumno</p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={turno.medio_cobro ?? ""} disabled={pending}
                onChange={e => startTransition(() => actualizarCobro(turno.id, { medio_cobro: (e.target.value as "efectivo"|"transferencia") || null }))}
                className={`text-xs font-extrabold rounded-lg border px-2 py-1.5 outline-none bg-white transition-colors ${
                  turno.medio_cobro === "efectivo"      ? "border-[#f59e0b] text-[#92400e]" :
                  turno.medio_cobro === "transferencia" ? "border-[#6366f1] text-[#4338ca]" :
                                                          "border-[#e5e7eb] text-[#9ca3af]"}`}>
                <option value="">— medio de cobro</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="efectivo">💵 Efectivo</option>
              </select>
              <button type="button" disabled={pending}
                onClick={() => startTransition(() => actualizarCobro(turno.id, { cobrado: !turno.cobrado }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-black disabled:opacity-50 transition-colors ${
                  turno.cobrado ? "bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]" : "bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]"}`}>
                {turno.cobrado ? "✓ Cobrado" : "⏳ Sin cobrar"}
              </button>
            </div>
          </div>

          {/* Editar datos */}
          <div className="pt-2 border-t border-[#e5e7eb]">
            <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-2">Editar datos</p>
            {!showEditar ? (
              <button type="button" onClick={handleOpenEditar}
                className="px-3 py-1.5 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] transition-colors">
                ✏️ Editar turno y alumno
              </button>
            ) : (
              <EditPanel turno={turno} onCerrar={() => setShowEditar(false)} />
            )}
          </div>

          {/* Reprogramar */}
          <div className="pt-2 border-t border-[#e5e7eb]">
            <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-2">Reprogramar</p>
            {!showReprogramar ? (
              <button type="button" onClick={handleOpenReprogramar}
                className="px-3 py-1.5 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] transition-colors">
                📅 Reprogramar turno
              </button>
            ) : (
              slot?.profesor_id && (
                <ReprogramarPanel
                  turnoId={turno.id} profesorId={slot.profesor_id} slotActualId={slot.id}
                  onCerrar={() => setShowReprogramar(false)}
                />
              )
            )}
          </div>

          {/* Eliminar */}
          <div className="pt-2 border-t border-[#fee2e2]">
            <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide mb-2">Zona de peligro</p>
            {!showEliminar ? (
              <button type="button"
                onClick={() => { setShowEditar(false); setShowReprogramar(false); setShowEliminar(true); setErrorEliminar(""); }}
                className="px-3 py-1.5 rounded-xl bg-[#fee2e2] text-[#ef4444] text-xs font-black hover:bg-[#fecaca] transition-colors">
                🗑️ Eliminar turno
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#374151]">
                  ¿Eliminás este turno? <span className="text-[#ef4444] font-black">Esta acción no se puede deshacer.</span>
                </p>
                {errorEliminar && <p className="text-xs font-black text-[#ef4444]">✗ {errorEliminar}</p>}
                <div className="flex gap-2">
                  <button type="button" disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const r = await eliminarTurno(turno.id);
                        if (!r.ok) setErrorEliminar(r.error ?? "Error al eliminar");
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#ef4444] text-white text-xs font-black hover:bg-[#dc2626] disabled:opacity-50 transition-colors">
                    {pending ? "Eliminando…" : "Sí, eliminar"}
                  </button>
                  <button type="button" disabled={pending}
                    onClick={() => setShowEliminar(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#f3f4f6] text-[#374151] text-xs font-black hover:bg-[#e5e7eb] disabled:opacity-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TurnosClient ────────────────────────────────────────────────────────── */

export default function TurnosClient({ turnos }: { turnos: TurnoRow[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtrados = turnos.filter(t => {
    if (filtro === "pendientes")  return !t.confirmado_por_profesor;
    if (filtro === "confirmados") return t.confirmado_por_profesor && t.asistio === null;
    if (filtro === "asistidos")   return t.asistio !== null;
    return true;
  });

  const FILTROS: { key: Filtro; label: string; count: number }[] = [
    { key: "todos",       label: "Todos",          count: turnos.length },
    { key: "pendientes",  label: "Sin confirmar",  count: turnos.filter(t => !t.confirmado_por_profesor).length },
    { key: "confirmados", label: "Confirmados",    count: turnos.filter(t => t.confirmado_por_profesor && t.asistio === null).length },
    { key: "asistidos",   label: "Con asistencia", count: turnos.filter(t => t.asistio !== null).length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button key={f.key} type="button" onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
              filtro === f.key ? "bg-[#7c3aed] text-white" : "bg-white text-[#6b7280] hover:bg-[#f3f4f6] border border-[#e5e7eb]"}`}>
            {f.label} <span className="opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

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
