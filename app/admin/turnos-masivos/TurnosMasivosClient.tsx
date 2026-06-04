"use client";

import { useState, useTransition } from "react";
import {
  crearTurnosMasivos,
  crearAlumnoYTurnosMasivos,
  type SlotGenerado,
  type NuevoAlumnoData,
} from "./actions";

type Disponibilidad = { dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean };
type ProfesorDisp   = {
  id: string; nombre: string;
  disponibilidad: Disponibilidad[];
  materias_join: { materia: { nombre: string } | null }[];
};
type AlumnoExist    = { id: string; nombre: string; apellido: string; nivel_educativo: string | null; colegio: string | null };

const DIAS_FULL    = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DURACIONES: (60|90)[] = [60, 90];
const INTERVALO    = 30;
const NIVELES      = ["primario","secundario","terciario","taller"];

function pad(n: number) { return String(n).padStart(2,"0"); }
function getMon(d: Date) {
  const m = new Date(d); m.setHours(0,0,0,0);
  m.setDate(m.getDate()-((m.getDay()+6)%7)); return m;
}
function timeToMin(t: string) { const [h,m]=t.slice(0,5).split(":").map(Number); return h*60+m; }
function minToTime(m: number) { return `${pad(Math.floor(m/60))}:${pad(m%60)}`; }

function generarSlots(profesor: ProfesorDisp, desde: Date, hasta: Date): SlotGenerado[] {
  const slots: SlotGenerado[] = [];
  const cur = new Date(desde);
  while (cur <= hasta) {
    const dow = cur.getDay();
    const dateStr = `${cur.getFullYear()}-${pad(cur.getMonth()+1)}-${pad(cur.getDate())}`;
    for (const d of profesor.disponibilidad.filter(x=>x.activo && x.dia_semana===dow)) {
      const wStart = timeToMin(d.hora_inicio); const wEnd = timeToMin(d.hora_fin);
      for (let start=wStart; start<wEnd; start+=INTERVALO) {
        for (const dur of DURACIONES) {
          if (start+dur>wEnd) continue;
          slots.push({ profesorId: profesor.id, fecha: dateStr, hora_inicio: minToTime(start), hora_fin: minToTime(start+dur), duracion_minutos: dur });
        }
      }
    }
    cur.setDate(cur.getDate()+1);
  }
  return slots;
}

function slotKey(s: SlotGenerado) {
  return `${s.fecha}|${s.hora_inicio}|${s.duracion_minutos}`;
}

const inputCls = "w-full px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold text-[#374151] focus:border-[#7c3aed] outline-none bg-white";

export default function TurnosMasivosClient({
  alumnos, profesores, colegios,
}: {
  alumnos:   AlumnoExist[];
  profesores: ProfesorDisp[];
  colegios:  string[];
}) {
  // ── Modo alumno ──────────────────────────────────────────────
  const [modoAlumno, setModoAlumno]   = useState<"existente"|"nuevo">("existente");
  const [alumnoId, setAlumnoId]       = useState(alumnos[0]?.id ?? "");
  const [nuevoAlumno, setNuevoAlumno] = useState<NuevoAlumnoData>({
    nombre: "", apellido: "", edad: "", nivel_educativo: "", colegio: "", dni: "",
  });

  // ── Config del turno ─────────────────────────────────────────
  const [profId, setProfId]       = useState(profesores[0]?.id ?? "");
  const [materia, setMateria]     = useState("");
  const [anio, setAnio]           = useState("");
  const [semana, setSemana]       = useState(() => getMon(new Date()).toISOString().slice(0,10));

  // ── Slots ────────────────────────────────────────────────────
  const [slots, setSlots]         = useState<SlotGenerado[]>([]);
  const [selSlots, setSelSlots]   = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState(false);

  // ── Estado de envío ──────────────────────────────────────────
  const [result, setResult]       = useState<{creados:number;errores:number;error?:string}|null>(null);
  const [pending, startTrans]     = useTransition();

  // ── Cálculos ─────────────────────────────────────────────────
  const selectedSlots = slots.filter(s => selSlots.has(slotKey(s)));
  const horasSeleccionadas = selectedSlots.reduce((acc,s) => acc + s.duracion_minutos/60, 0);

  const alumnoActual  = alumnos.find(a => a.id === alumnoId);
  const profesor      = profesores.find(p => p.id === profId);
  const materiasProf  = (profesor?.materias_join ?? [])
    .map(mj => mj.materia?.nombre)
    .filter((n): n is string => !!n)
    .sort();

  // Colegio a usar según modo
  const colegioParaTurno = modoAlumno === "nuevo"
    ? nuevoAlumno.colegio
    : (alumnoActual?.colegio ?? "");

  // ── Acciones ─────────────────────────────────────────────────
  function generar() {
    if (!profesor) return;
    const desde = new Date(semana+"T00:00:00");
    const hasta = new Date(desde); hasta.setDate(desde.getDate()+6);
    const ss = generarSlots(profesor, desde, hasta);
    setSlots(ss);
    setSelSlots(new Set());   // ← todos sin marcar por defecto
    setGenerated(true);
    setResult(null);
  }

  function toggleSlot(key: string) {
    setSelSlots(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  }

  function seleccionarTodos() {
    setSelSlots(new Set(slots.map(slotKey)));
  }

  function deseleccionarTodos() {
    setSelSlots(new Set());
  }

  function puedeCrear() {
    if (selectedSlots.length === 0 || !materia || !anio || pending) return false;
    if (modoAlumno === "existente") return !!alumnoId;
    return !!(nuevoAlumno.nombre.trim() && nuevoAlumno.apellido.trim());
  }

  function crear() {
    startTrans(async () => {
      let r: { creados: number; errores: number; error?: string };
      if (modoAlumno === "existente") {
        r = await crearTurnosMasivos(alumnoId, materia, anio, colegioParaTurno, selectedSlots);
      } else {
        r = await crearAlumnoYTurnosMasivos(nuevoAlumno, materia, anio, selectedSlots);
      }
      setResult(r);
      if (!r.error) setGenerated(false);
    });
  }

  // ── Render ───────────────────────────────────────────────────
  const porFecha: Record<string, SlotGenerado[]> = {};
  slots.forEach(s => { if (!porFecha[s.fecha]) porFecha[s.fecha]=[]; porFecha[s.fecha].push(s); });

  return (
    <div className="space-y-5">

      {/* ── Panel de configuración ── */}
      <div className="bg-white rounded-2xl p-5 space-y-5" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>

        {/* Toggle existente / nuevo */}
        <div className="flex gap-2">
          {(["existente","nuevo"] as const).map(modo => (
            <button
              key={modo}
              type="button"
              onClick={() => { setModoAlumno(modo); setGenerated(false); setResult(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-colors ${
                modoAlumno===modo
                  ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]"
                  : "border-[#e5e7eb] text-[#9ca3af] hover:border-[#c4b5fd]"
              }`}
            >
              {modo==="existente" ? "👤 Alumno existente" : "✨ Alumno nuevo"}
            </button>
          ))}
        </div>

        {/* Datos alumno */}
        {modoAlumno === "existente" ? (
          <div>
            <label className="block text-xs font-extrabold text-[#374151] mb-1">Alumno</label>
            <select
              value={alumnoId}
              onChange={e => setAlumnoId(e.target.value)}
              className={inputCls}
            >
              <option value="">— Seleccioná un alumno —</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>
                  {a.apellido}, {a.nombre}
                  {a.nivel_educativo ? ` (${a.nivel_educativo})` : ""}
                  {a.colegio ? ` · ${a.colegio}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-[#374151]">Datos del alumno nuevo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-1">Nombre *</label>
                <input
                  type="text" placeholder="Nombre"
                  value={nuevoAlumno.nombre}
                  onChange={e => setNuevoAlumno(p => ({...p, nombre: e.target.value}))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-1">Apellido *</label>
                <input
                  type="text" placeholder="Apellido"
                  value={nuevoAlumno.apellido}
                  onChange={e => setNuevoAlumno(p => ({...p, apellido: e.target.value}))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-1">DNI</label>
                <input
                  type="text" placeholder="Ej: 45123456"
                  value={nuevoAlumno.dni}
                  onChange={e => setNuevoAlumno(p => ({...p, dni: e.target.value}))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-1">Edad</label>
                <input
                  type="number" placeholder="Ej: 12" min={4} max={80}
                  value={nuevoAlumno.edad}
                  onChange={e => setNuevoAlumno(p => ({...p, edad: e.target.value}))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-1">Nivel educativo</label>
                <select
                  value={nuevoAlumno.nivel_educativo}
                  onChange={e => setNuevoAlumno(p => ({...p, nivel_educativo: e.target.value}))}
                  className={inputCls}
                >
                  <option value="">— Seleccioná —</option>
                  {NIVELES.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase()+n.slice(1)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-[#9ca3af] mb-1">Colegio / Institución</label>
                <select
                  value={nuevoAlumno.colegio}
                  onChange={e => setNuevoAlumno(p => ({...p, colegio: e.target.value}))}
                  className={inputCls}
                >
                  <option value="">— Seleccioná —</option>
                  {colegios.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Profesor, semana, materia, año */}
        <div className="border-t border-[#f3f4f6] pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-[#374151] mb-1">Profesor</label>
            <select value={profId} onChange={e=>{setProfId(e.target.value);setGenerated(false);setMateria("");}} className={inputCls}>
              {profesores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#374151] mb-1">Semana (lunes)</label>
            <input type="date" value={semana} onChange={e=>{setSemana(e.target.value);setGenerated(false);}} className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#374151] mb-1">Materia</label>
            <select
              value={materia}
              onChange={e => setMateria(e.target.value)}
              disabled={materiasProf.length === 0}
              className={inputCls}
            >
              <option value="">— Seleccioná una materia —</option>
              {materiasProf.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#374151] mb-1">Año / Grado</label>
            <input type="text" placeholder="Ej: 3° año" value={anio} onChange={e=>setAnio(e.target.value)} className={inputCls}/>
          </div>
        </div>

        <button
          type="button"
          onClick={generar}
          disabled={!profId}
          className="px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white text-sm font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
        >
          Ver turnos disponibles →
        </button>
      </div>

      {/* ── Resultado ── */}
      {result && (
        <div className={`rounded-2xl p-4 font-bold text-sm ${
          result.error ? "bg-[#fee2e2] text-[#ef4444]" :
          result.errores===0 ? "bg-[#d1fae5] text-[#059669]" :
          "bg-[#fef3c7] text-[#d97706]"
        }`}>
          {result.error
            ? `❌ Error: ${result.error}`
            : `✓ ${result.creados} turno${result.creados!==1?"s":""} creado${result.creados!==1?"s":""}`
          }
          {!result.error && result.errores > 0 && ` · ${result.errores} ya existían`}
        </div>
      )}

      {/* ── Sin turnos disponibles ── */}
      {generated && slots.length===0 && (
        <div className="bg-white rounded-2xl py-10 text-center text-[#9ca3af] font-bold">
          Sin turnos disponibles esa semana para ese profesor.
        </div>
      )}

      {/* ── Selección de slots ── */}
      {generated && slots.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>

          {/* Barra superior con contador de horas */}
          <div className="px-5 py-4 bg-[#f5f3ff] border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between flex-wrap gap-3">

              {/* Contador dinámico */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase">Turnos seleccionados</p>
                  <p className="text-xl font-black text-[#7c3aed]">{selSlots.size}</p>
                </div>
                <div className="w-px h-8 bg-[#e5e7eb]"/>
                <div>
                  <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase">Horas totales</p>
                  <p className="text-xl font-black text-[#1e1b4b]">{horasSeleccionadas.toFixed(1)} hs</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={seleccionarTodos}
                  className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-extrabold text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={deseleccionarTodos}
                  className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-extrabold text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                >
                  Ninguno
                </button>
                <button
                  type="button"
                  disabled={!puedeCrear()}
                  onClick={crear}
                  className="px-4 py-2 rounded-xl bg-[#059669] text-white text-sm font-black hover:bg-[#047857] transition-colors disabled:opacity-50"
                >
                  {pending ? "Creando…" : `⚡ Crear ${selSlots.size} turno${selSlots.size!==1?"s":""}`}
                </button>
              </div>
            </div>
          </div>

          {/* Slots por día */}
          <div className="divide-y divide-[#f3f4f6]">
            {Object.entries(porFecha).sort().map(([fecha, ss]) => {
              const dayKey = new Date(fecha+"T00:00:00");
              const dayName = DIAS_FULL[dayKey.getDay()];
              const dayLabel = dayKey.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"});
              const selCount = ss.filter(s=>selSlots.has(slotKey(s))).length;

              return (
                <div key={fecha} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-extrabold text-[#374151]">
                      {dayName} {dayLabel}
                    </p>
                    {selCount > 0 && (
                      <span className="text-[10px] font-black text-[#7c3aed] bg-[#ede9fe] px-2 py-0.5 rounded-full">
                        {selCount} seleccionado{selCount!==1?"s":""}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ss.map(s => {
                      const key = slotKey(s);
                      const sel = selSlots.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSlot(key)}
                          className={`px-3 py-2 rounded-xl text-xs font-extrabold border-2 transition-all ${
                            sel
                              ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]"
                              : "border-[#e5e7eb] text-[#9ca3af] hover:border-[#c4b5fd] hover:text-[#7c3aed]"
                          }`}
                        >
                          <span className="block">{s.hora_inicio} – {s.hora_fin}</span>
                          <span className="block text-[9px] font-bold opacity-70">{s.duracion_minutos === 60 ? "1 h" : "1:30 h"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
