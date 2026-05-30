"use client";

import { useState } from "react";
import type { TurnoCalendario } from "./page";

// ── Constantes del grid ───────────────────────────────────────
const HORA_INI  = 7;   // El grid empieza a las 07:00
const HORA_FIN  = 22;  // El grid termina a las 22:00
const PX_POR_MIN = 1.2; // píxeles por minuto
const GRID_H    = (HORA_FIN - HORA_INI) * 60 * PX_POR_MIN; // altura total en px

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_FULL   = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

// Colores por materia (círculo de colores)
const PALETTE = [
  "#7c3aed","#059669","#d97706","#2563eb","#dc2626",
  "#7c3aed","#0891b2","#65a30d","#9333ea","#c2410c",
];
const materiaColor: Record<string, string> = {};
let colorIdx = 0;
function getColor(materia: string): string {
  if (!materiaColor[materia]) {
    materiaColor[materia] = PALETTE[colorIdx % PALETTE.length];
    colorIdx++;
  }
  return materiaColor[materia];
}

// ── Helpers ───────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function timeToMin(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function topPx(hora: string): number {
  return (timeToMin(hora) - HORA_INI * 60) * PX_POR_MIN;
}

function heightPx(dur: number): number {
  return Math.max(dur * PX_POR_MIN, 28); // mínimo 28px para que se vea la tarjeta
}

// ── Tooltip ───────────────────────────────────────────────────
function Tooltip({ t, side }: { t: TurnoCalendario; side: "left" | "right" }) {
  const alumno = t.alumno;
  return (
    <div
      className={`
        absolute top-0 z-50 w-56
        bg-white border border-[#e5e7eb] rounded-2xl shadow-xl p-3
        pointer-events-none
        ${side === "right" ? "left-full ml-2" : "right-full mr-2"}
      `}
    >
      {/* Nombre */}
      <p className="font-black text-[#1e1b4b] text-sm leading-tight">
        {alumno?.nombre} {alumno?.apellido}
      </p>

      {/* Materia + año */}
      <p className="text-xs font-extrabold mt-1" style={{ color: getColor(t.materia) }}>
        {t.materia}
      </p>
      <p className="text-xs text-[#6b7280] font-semibold">{t.anio} · {t.colegio}</p>

      {/* Horario */}
      <div className="mt-2 flex items-center gap-1 text-xs text-[#374151] font-bold">
        <span>🕐</span>
        <span>{t.slot.hora_inicio.slice(0,5)} – {t.slot.hora_fin.slice(0,5)}</span>
        <span className="text-[#9ca3af]">({t.slot.duracion_minutos} min)</span>
      </div>

      {/* Objetivo */}
      {t.objetivo && (
        <p className="text-xs text-[#6b7280] font-semibold mt-1">🎯 {t.objetivo}</p>
      )}

      {/* Contacto */}
      {alumno?.nombre_contacto && (
        <p className="text-xs text-[#9ca3af] font-semibold mt-1">📞 {alumno.nombre_contacto}</p>
      )}
      {alumno?.telefono_contacto && (
        <p className="text-xs text-[#9ca3af] font-semibold">💬 {alumno.telefono_contacto}</p>
      )}

      {/* Estado asistencia */}
      {t.asistio !== null && (
        <div className="mt-2">
          {t.asistio
            ? <span className="text-[10px] font-black px-2 py-0.5 bg-[#d1fae5] text-[#059669] rounded-full">✓ Asistió</span>
            : <span className="text-[10px] font-black px-2 py-0.5 bg-[#fee2e2] text-[#ef4444] rounded-full">✗ No asistió</span>
          }
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de turno ──────────────────────────────────────────
function TurnoCard({ turno, dayIdx, totalDays }: { turno: TurnoCalendario; dayIdx: number; totalDays: number }) {
  const [hovered, setHovered] = useState(false);
  const color  = getColor(turno.materia);
  const top    = topPx(turno.slot.hora_inicio);
  const height = heightPx(turno.slot.duracion_minutos);
  const side   = dayIdx >= totalDays - 2 ? "left" : "right";

  return (
    <div
      className="absolute left-1 right-1 rounded-lg cursor-default overflow-visible"
      style={{ top, height, backgroundColor: color + "22", borderLeft: `3px solid ${color}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Contenido mínimo de la tarjeta (siempre visible) */}
      <div className="px-1.5 py-0.5 overflow-hidden h-full flex flex-col justify-start">
        <p className="text-[10px] font-extrabold leading-tight truncate" style={{ color }}>
          {turno.slot.hora_inicio.slice(0,5)}
        </p>
        {height >= 40 && (
          <p className="text-[9px] font-bold text-[#374151] leading-tight truncate">
            {turno.materia}
          </p>
        )}
      </div>

      {/* Tooltip al hacer hover */}
      {hovered && <Tooltip t={turno} side={side} />}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function CalendarioClient({ turnos }: { turnos: TurnoCalendario[] }) {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));

  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekTurnos = turnos.filter(t => {
    const f = new Date(t.slot.fecha + "T00:00:00");
    return f >= weekStart && f <= weekEnd;
  });

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }
  function goToday() {
    setWeekStart(getMondayOf(new Date()));
  }

  const todayKey = toDateKey(new Date());

  // Líneas de hora para el fondo del grid
  const horas = Array.from(
    { length: HORA_FIN - HORA_INI + 1 },
    (_, i) => HORA_INI + i
  );

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(124,58,237,0.08)" }}>

      {/* ── Cabecera de navegación ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevWeek}
            className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] font-black transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextWeek}
            className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] font-black transition-colors"
          >
            ›
          </button>
          <span className="text-sm font-extrabold text-[#1e1b4b] ml-1">
            {weekStart.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
            {" – "}
            {weekEnd.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9ca3af] font-semibold hidden sm:inline">
            {weekTurnos.length} turno{weekTurnos.length !== 1 ? "s" : ""} esta semana
          </span>
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-extrabold text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* ── Grid del calendario ── */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">

          {/* Encabezado de días */}
          <div className="flex border-b border-[#e5e7eb]">
            {/* Columna de horas */}
            <div className="w-14 flex-shrink-0" />
            {weekDays.map((day, i) => {
              const key   = toDateKey(day);
              const isHoy = key === todayKey;
              return (
                <div
                  key={key}
                  className="flex-1 text-center py-2 border-l border-[#f3f4f6]"
                >
                  <p className={`text-[11px] font-extrabold uppercase tracking-wide ${isHoy ? "text-[#7c3aed]" : "text-[#9ca3af]"}`}>
                    {DIAS_SEMANA[i]}
                  </p>
                  <p className={`text-base font-black leading-tight ${isHoy ? "text-[#7c3aed]" : "text-[#1e1b4b]"}`}>
                    {day.getDate()}
                  </p>
                  {isHoy && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mx-auto mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Área de tiempo + turnos */}
          <div className="flex" style={{ height: GRID_H + 16 }}>

            {/* Columna de horas */}
            <div className="w-14 flex-shrink-0 relative">
              {horas.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex justify-end pr-2"
                  style={{ top: (h - HORA_INI) * 60 * PX_POR_MIN - 7 }}
                >
                  <span className="text-[10px] font-semibold text-[#d1d5db]">
                    {pad(h)}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {weekDays.map((day, dayIdx) => {
              const key = toDateKey(day);
              const isHoy = key === todayKey;
              const dayTurnos = weekTurnos.filter(t => t.slot.fecha === key);

              return (
                <div
                  key={key}
                  className="flex-1 border-l border-[#f3f4f6] relative"
                  style={{ height: GRID_H }}
                >
                  {/* Fondo de hoy */}
                  {isHoy && (
                    <div className="absolute inset-0 bg-[#7c3aed] opacity-[0.02] pointer-events-none" />
                  )}

                  {/* Líneas horizontales por hora */}
                  {horas.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-[#f3f4f6]"
                      style={{ top: (h - HORA_INI) * 60 * PX_POR_MIN }}
                    />
                  ))}

                  {/* Línea del momento actual (solo si es hoy) */}
                  {isHoy && (() => {
                    const now = new Date();
                    const minFromStart = (now.getHours() * 60 + now.getMinutes()) - HORA_INI * 60;
                    if (minFromStart < 0 || minFromStart > (HORA_FIN - HORA_INI) * 60) return null;
                    return (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-[#7c3aed] z-10"
                        style={{ top: minFromStart * PX_POR_MIN }}
                      >
                        <div className="w-2 h-2 rounded-full bg-[#7c3aed] -mt-1 -ml-1" />
                      </div>
                    );
                  })()}

                  {/* Turnos del día */}
                  {dayTurnos.map(t => (
                    <TurnoCard
                      key={t.id}
                      turno={t}
                      dayIdx={dayIdx}
                      totalDays={weekDays.length}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Leyenda de materias ── */}
      {weekTurnos.length > 0 && (
        <div className="px-4 py-3 border-t border-[#f3f4f6] flex flex-wrap gap-2">
          {[...new Set(weekTurnos.map(t => t.materia))].map(mat => (
            <span key={mat} className="flex items-center gap-1 text-xs font-extrabold text-[#374151]">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getColor(mat) }}
              />
              {mat}
            </span>
          ))}
        </div>
      )}

      {/* ── Estado vacío ── */}
      {weekTurnos.length === 0 && (
        <div className="py-16 text-center text-[#9ca3af]">
          <p className="text-3xl mb-2">📭</p>
          <p className="font-bold text-sm">Sin turnos confirmados esta semana.</p>
          <p className="text-xs font-semibold mt-1">Usá las flechas para navegar a otras semanas.</p>
        </div>
      )}
    </div>
  );
}
