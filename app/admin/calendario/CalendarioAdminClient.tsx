"use client";

import { useState } from "react";

const HORA_INI   = 7;
const HORA_FIN   = 22;
const PX_POR_MIN = 1.2;
const GRID_H     = (HORA_FIN - HORA_INI) * 60 * PX_POR_MIN;

const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb"];
const PROF_COLORS = ["#7c3aed","#059669","#d97706","#2563eb","#dc2626","#0891b2","#9333ea"];

function pad(n: number) { return String(n).padStart(2,"0"); }
function toKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function getMon(d: Date) {
  const m = new Date(d); m.setHours(0,0,0,0);
  m.setDate(m.getDate() - ((m.getDay()+6)%7));
  return m;
}
function timeToMin(t: string) { const [h,m]=t.slice(0,5).split(":").map(Number); return h*60+m; }
function topPx(h: string) { return (timeToMin(h)-HORA_INI*60)*PX_POR_MIN; }
function heightPx(d: number) { return Math.max(d*PX_POR_MIN, 28); }

export type TurnoAdmin = {
  id: string; materia: string; anio: string; colegio: string;
  confirmado_por_profesor: boolean; asistio: boolean | null; estado: string;
  slot: { fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number };
  alumno: { nombre: string; apellido: string } | null;
  profesor: { nombre: string } | null;
};

function Tooltip({ t, side, color }: { t: TurnoAdmin; side: "left"|"right"; color: string }) {
  return (
    <div className={`absolute top-0 z-50 w-52 bg-white border border-[#e5e7eb] rounded-2xl shadow-xl p-3 pointer-events-none ${side==="right"?"left-full ml-2":"right-full mr-2"}`}>
      <p className="font-black text-[#1e1b4b] text-sm">{t.alumno?.nombre} {t.alumno?.apellido}</p>
      <p className="text-xs font-extrabold mt-0.5" style={{color}}>{t.materia}</p>
      <p className="text-xs text-[#6b7280] font-semibold">{t.anio} · {t.colegio}</p>
      <p className="text-xs text-[#374151] font-bold mt-1">🕐 {t.slot.hora_inicio.slice(0,5)} – {t.slot.hora_fin.slice(0,5)}</p>
      {t.profesor && <p className="text-xs text-[#9ca3af] font-semibold mt-0.5">👨‍🏫 {t.profesor.nombre}</p>}
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {t.confirmado_por_profesor
          ? <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#d1fae5] text-[#059669] rounded-full">Confirmado</span>
          : <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#fef3c7] text-[#d97706] rounded-full">Sin confirmar</span>}
        {t.asistio===true  && <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#d1fae5] text-[#059669] rounded-full">Asistió</span>}
        {t.asistio===false && <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#fee2e2] text-[#ef4444] rounded-full">No asistió</span>}
      </div>
    </div>
  );
}

function TurnoCard({ t, dayIdx, profColor }: { t: TurnoAdmin; dayIdx: number; profColor: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="absolute left-0.5 right-0.5 rounded-md cursor-default overflow-visible"
      style={{ top: topPx(t.slot.hora_inicio), height: heightPx(t.slot.duracion_minutos), backgroundColor: profColor+"22", borderLeft: `3px solid ${profColor}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-1 py-0.5 overflow-hidden h-full">
        <p className="text-[9px] font-extrabold leading-tight truncate" style={{color:profColor}}>{t.slot.hora_inicio.slice(0,5)}</p>
        {heightPx(t.slot.duracion_minutos) >= 36 && (
          <p className="text-[8px] font-bold text-[#374151] leading-tight truncate">{t.alumno?.apellido ?? "—"}</p>
        )}
      </div>
      {hovered && <Tooltip t={t} side={dayIdx>=4?"left":"right"} color={profColor} />}
    </div>
  );
}

export default function CalendarioAdminClient({ turnos, profesores }: { turnos: TurnoAdmin[]; profesores: { id: string; nombre: string }[] }) {
  const [weekStart, setWeekStart] = useState(() => getMon(new Date()));

  const profColorMap: Record<string,string> = {};
  profesores.forEach((p,i) => { profColorMap[p.id] = PROF_COLORS[i % PROF_COLORS.length]; });

  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
  const weekDays = Array.from({length:6},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });
  const todayKey = toKey(new Date());

  const weekTurnos = turnos.filter(t => {
    const f = new Date(t.slot.fecha+"T00:00:00");
    return f >= weekStart && f <= weekEnd;
  });

  const horas = Array.from({length: HORA_FIN-HORA_INI+1},(_,i)=>HORA_INI+i);

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:"0 2px 16px rgba(124,58,237,0.08)"}}>
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <button type="button" onClick={()=>{ const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); }} className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] font-black">‹</button>
          <button type="button" onClick={()=>{ const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); }} className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] font-black">›</button>
          <span className="text-sm font-extrabold text-[#1e1b4b] ml-1">
            {weekStart.toLocaleDateString("es-AR",{day:"numeric",month:"long"})} – {weekEnd.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9ca3af] font-semibold hidden sm:inline">{weekTurnos.length} turno{weekTurnos.length!==1?"s":""}</span>
          <button type="button" onClick={()=>setWeekStart(getMon(new Date()))} className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-extrabold text-[#6b7280] hover:bg-[#f3f4f6]">Hoy</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header días */}
          <div className="flex border-b border-[#e5e7eb]">
            <div className="w-14 flex-shrink-0"/>
            {weekDays.map((day,i)=>{
              const key=toKey(day); const isHoy=key===todayKey;
              return (
                <div key={key} className="flex-1 text-center py-2 border-l border-[#f3f4f6]">
                  <p className={`text-[11px] font-extrabold uppercase ${isHoy?"text-[#7c3aed]":"text-[#9ca3af]"}`}>{DIAS_SEMANA[i]}</p>
                  <p className={`text-base font-black ${isHoy?"text-[#7c3aed]":"text-[#1e1b4b]"}`}>{day.getDate()}</p>
                  {isHoy && <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mx-auto mt-0.5"/>}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex" style={{height: GRID_H+16}}>
            <div className="w-14 flex-shrink-0 relative">
              {horas.map(h=>(
                <div key={h} className="absolute left-0 right-0 flex justify-end pr-2" style={{top:(h-HORA_INI)*60*PX_POR_MIN-7}}>
                  <span className="text-[10px] font-semibold text-[#d1d5db]">{pad(h)}:00</span>
                </div>
              ))}
            </div>
            {weekDays.map((day,dayIdx)=>{
              const key=toKey(day); const isHoy=key===todayKey;
              const dayTurnos = weekTurnos.filter(t=>t.slot.fecha===key);
              return (
                <div key={key} className="flex-1 border-l border-[#f3f4f6] relative" style={{height:GRID_H}}>
                  {isHoy && <div className="absolute inset-0 bg-[#7c3aed] opacity-[0.02] pointer-events-none"/>}
                  {horas.map(h=><div key={h} className="absolute left-0 right-0 border-t border-[#f3f4f6]" style={{top:(h-HORA_INI)*60*PX_POR_MIN}}/>)}
                  {isHoy && (()=>{
                    const now=new Date(); const m=(now.getHours()*60+now.getMinutes())-HORA_INI*60;
                    if(m<0||m>(HORA_FIN-HORA_INI)*60) return null;
                    return <div className="absolute left-0 right-0 border-t-2 border-[#7c3aed] z-10" style={{top:m*PX_POR_MIN}}><div className="w-2 h-2 rounded-full bg-[#7c3aed] -mt-1 -ml-1"/></div>;
                  })()}
                  {dayTurnos.map(t=>(
                    <TurnoCard key={t.id} t={t} dayIdx={dayIdx} profColor={profColorMap[t.slot?.fecha ? (profesores.find(p=> weekTurnos.filter(wt=>wt.slot.fecha===key).some(wt2=>wt2.id===t.id && wt2.profesor?.nombre===p.nombre))?.id ?? "") : ""] ?? PROF_COLORS[0]} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leyenda profesores */}
      <div className="px-4 py-3 border-t border-[#f3f4f6] flex flex-wrap gap-3">
        {profesores.map((p,i)=>(
          <span key={p.id} className="flex items-center gap-1.5 text-xs font-extrabold text-[#374151]">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{backgroundColor:PROF_COLORS[i%PROF_COLORS.length]}}/>
            {p.nombre}
          </span>
        ))}
      </div>

      {weekTurnos.length===0 && (
        <div className="py-12 text-center text-[#9ca3af]">
          <p className="text-3xl mb-2">📭</p>
          <p className="font-bold text-sm">Sin turnos confirmados esta semana.</p>
        </div>
      )}
    </div>
  );
}
