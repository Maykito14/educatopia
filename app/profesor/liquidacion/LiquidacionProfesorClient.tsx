"use client";

import { useState } from "react";

type Precio = { nivel: string; valor_hora: number; porcentaje_profesor: number };
type TurnoLiq = {
  id: string;
  materia: string;
  anio: string;
  colegio: string;
  pagado: boolean;
  slot: { fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number } | null;
  alumno: { nombre: string; apellido: string; nivel_educativo: string | null } | null;
};

function getMon(d: Date) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "short", day: "2-digit", month: "2-digit",
  });
}
function fmtWeek(iso: string) {
  const desde = new Date(iso + "T00:00:00");
  const hasta = new Date(iso + "T00:00:00");
  hasta.setDate(hasta.getDate() + 6);
  return `${desde.getDate()}/${desde.getMonth()+1} — ${hasta.getDate()}/${hasta.getMonth()+1}`;
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function TurnoRow({ t, precio }: { t: TurnoLiq; precio: Precio }) {
  const horas = (t.slot?.duracion_minutos ?? 60) / 60;
  const monto = horas * precio.valor_hora * (precio.porcentaje_profesor / 100);

  return (
    <tr className="border-b border-[#f9fafb]">
      <td className="px-3 py-2.5 text-xs font-semibold text-[#6b7280] whitespace-nowrap">
        {t.slot ? fmtDate(t.slot.fecha) : "—"}
        <br />
        <span className="text-[#9ca3af]">{t.slot?.hora_inicio?.slice(0, 5)}</span>
      </td>
      <td className="px-3 py-2.5">
        <p className="font-extrabold text-[#1e1b4b] text-sm">{t.alumno?.nombre} {t.alumno?.apellido}</p>
        <p className="text-xs text-[#9ca3af] capitalize">{t.alumno?.nivel_educativo}</p>
      </td>
      <td className="px-3 py-2.5 text-xs font-semibold text-[#374151]">
        {t.materia}
        <br />
        <span className="text-[#9ca3af]">{t.anio}</span>
      </td>
      <td className="px-3 py-2.5 text-xs font-semibold text-[#374151] text-center">
        {horas.toFixed(1)} hs
      </td>
      <td className="px-3 py-2.5 font-black text-[#059669] text-right">
        {fmtMoney(monto)}
        <br />
        <span className="text-[9px] font-semibold text-[#9ca3af]">{precio.porcentaje_profesor}% de {fmtMoney(precio.valor_hora)}/h</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        {t.pagado
          ? <span className="text-[10px] font-black px-2 py-1 bg-[#d1fae5] text-[#059669] rounded-full">✓ Pagado</span>
          : <span className="text-[10px] font-black px-2 py-1 bg-[#fef3c7] text-[#d97706] rounded-full">⏳ Pendiente</span>}
      </td>
    </tr>
  );
}

export default function LiquidacionProfesorClient({
  profesorId,
  precios,
}: {
  profesorId: string;
  precios: Precio[];
}) {
  const [semana, setSemana] = useState(() =>
    getMon(new Date()).toISOString().slice(0, 10)
  );
  const [turnos, setTurnos] = useState<TurnoLiq[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [fetching, setFetching] = useState(false);

  const precioMap: Record<string, Precio> = {};
  precios.forEach(p => { precioMap[p.nivel] = p; });

  function getPrecio(nivel: string | null) {
    return precioMap[nivel ?? "secundario"] ?? precioMap["secundario"] ?? { valor_hora: 0, porcentaje_profesor: 50, nivel: "secundario" };
  }

  async function buscar(sem: string) {
    setFetching(true);
    setLoaded(false);
    const hasta = addDays(sem, 6);
    const res = await fetch(`/api/admin/liquidacion?profesor=${profesorId}&desde=${sem}&hasta=${hasta}`);
    const data = await res.json();
    setTurnos(data);
    setLoaded(true);
    setFetching(false);
  }

  function navSemana(delta: number) {
    const nueva = addDays(semana, delta * 7);
    setSemana(nueva);
    setLoaded(false);
  }

  const totalHoras = turnos.reduce((acc, t) => acc + (t.slot?.duracion_minutos ?? 60) / 60, 0);
  const totalMonto = turnos.reduce((acc, t) => {
    const p = getPrecio(t.alumno?.nivel_educativo ?? null);
    return acc + (t.slot?.duracion_minutos ?? 60) / 60 * p.valor_hora * (p.porcentaje_profesor / 100);
  }, 0);
  const totalPagado = turnos.filter(t => t.pagado).reduce((acc, t) => {
    const p = getPrecio(t.alumno?.nivel_educativo ?? null);
    return acc + (t.slot?.duracion_minutos ?? 60) / 60 * p.valor_hora * (p.porcentaje_profesor / 100);
  }, 0);
  const totalPendiente = totalMonto - totalPagado;

  const inputCls = "px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold text-[#374151] focus:border-[#7c3aed] outline-none bg-white";

  return (
    <div className="space-y-5">
      {/* Navegador de semana */}
      <div className="bg-white rounded-2xl p-5 flex flex-wrap gap-4 items-center" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
        <button type="button" onClick={() => navSemana(-1)}
          className="px-3 py-2 rounded-xl bg-[#f5f3ff] text-[#7c3aed] font-black hover:bg-[#ede9fe] transition-colors">
          ← Anterior
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs font-extrabold text-[#9ca3af] uppercase tracking-wide mb-0.5">Semana</p>
          <p className="text-base font-black text-[#1e1b4b]">{fmtWeek(semana)}</p>
        </div>
        <button type="button" onClick={() => navSemana(1)}
          className="px-3 py-2 rounded-xl bg-[#f5f3ff] text-[#7c3aed] font-black hover:bg-[#ede9fe] transition-colors">
          Siguiente →
        </button>
        <button type="button" onClick={() => buscar(semana)} disabled={fetching}
          className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white text-sm font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50">
          {fetching ? "Cargando…" : "Ver semana"}
        </button>
      </div>

      {loaded && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Turnos",          value: String(turnos.length),          color: "#7c3aed", bg: "#f5f3ff" },
              { label: "Horas trabajadas", value: `${totalHoras.toFixed(1)} hs`,  color: "#1e1b4b", bg: "#f9fafb" },
              { label: "Total semana",    value: fmtMoney(totalMonto),            color: "#059669", bg: "#f0fdf4" },
              { label: "Pendiente cobro", value: fmtMoney(totalPendiente),        color: "#d97706", bg: "#fffbeb" },
            ].map(k => (
              <div key={k.label} className="rounded-2xl p-4" style={{ background: k.bg, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <p className="text-xs font-extrabold text-[#9ca3af] uppercase tracking-wide mb-1">{k.label}</p>
                <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {turnos.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af] font-bold bg-white rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
              Sin turnos asistidos en esa semana.
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#f3f4f6]">
                      {["Fecha", "Alumno", "Materia", "Duración", "A cobrar", "Estado pago"].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-extrabold text-[#9ca3af] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {turnos.map(t => (
                      <TurnoRow
                        key={t.id}
                        t={t}
                        precio={getPrecio(t.alumno?.nivel_educativo ?? null)}
                      />
                    ))}
                  </tbody>
                  {/* Totales */}
                  <tfoot>
                    <tr className="bg-[#f5f3ff] border-t-2 border-[#e5e7eb]">
                      <td colSpan={3} className="px-3 py-3 text-xs font-extrabold text-[#7c3aed] uppercase">Total semana</td>
                      <td className="px-3 py-3 text-sm font-black text-[#1e1b4b] text-center">{totalHoras.toFixed(1)} hs</td>
                      <td className="px-3 py-3 text-sm font-black text-[#059669] text-right">{fmtMoney(totalMonto)}</td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] font-black px-2 py-1 bg-[#fef3c7] text-[#d97706] rounded-full">
                          Pendiente: {fmtMoney(totalPendiente)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
