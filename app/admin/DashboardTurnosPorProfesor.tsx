"use client";

import { useState } from "react";

export type TurnoPendienteDetalle = {
  id: string;
  materia: string;
  anio: string;
  alumnoNombre: string;
  alumnoApellido: string;
  fecha: string;
  hora: string;
};

export type ProfesorRowData = {
  nombre: string;
  total: number;
  pendientes: number;
  asistidos: number;
  noAsistidos: number;
  sinInfo: number;
  turnosPendientes: TurnoPendienteDetalle[];
};

function formatFecha(fecha: string) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  const diasSemana = ["dom","lun","mar","mié","jue","vie","sáb"];
  const dia = diasSemana[new Date(`${fecha}T00:00:00`).getDay()];
  return `${dia} ${d}/${m}/${y}`;
}

export default function DashboardTurnosPorProfesor({ rows }: { rows: ProfesorRowData[] }) {
  const [expandedProf, setExpandedProf] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
      <div className="px-5 py-4 border-b border-[#f3f4f6]">
        <h2 className="text-sm font-black text-[#1e1b4b]">Turnos por profesor</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f3f4f6]">
              {["Profesor","Total","Sin confirmar","Asistidos","No asistidos","Sin registrar"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-extrabold text-[#9ca3af] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <>
                <tr key={p.nombre} className="border-b border-[#f9fafb] hover:bg-[#faf5ff] transition-colors">
                  <td className="px-4 py-3 font-extrabold text-[#1e1b4b]">{p.nombre}</td>
                  <td className="px-4 py-3 font-black text-[#7c3aed]">{p.total}</td>
                  <td className="px-4 py-3">
                    {p.pendientes > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedProf(expandedProf === p.nombre ? null : p.nombre)}
                        title="Ver detalle de turnos sin confirmar"
                        className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a] transition-colors cursor-pointer underline-offset-2 hover:underline"
                      >
                        {p.pendientes}
                      </button>
                    ) : (
                      <span className="text-[#9ca3af]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#d1fae5] text-[#059669]">{p.asistidos}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.noAsistidos > 0
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fee2e2] text-[#ef4444]">{p.noAsistidos}</span>
                      : <span className="text-[#9ca3af]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#9ca3af] font-semibold">{p.sinInfo}</td>
                </tr>
                {expandedProf === p.nombre && (
                  <tr key={`${p.nombre}-detail`} className="bg-[#fefce8] border-b border-[#fde68a]">
                    <td colSpan={6} className="px-5 py-4">
                      <p className="text-xs font-extrabold text-[#d97706] mb-3">
                        Turnos sin confirmar de {p.nombre} ({p.turnosPendientes.length}):
                      </p>
                      {p.turnosPendientes.length === 0 ? (
                        <p className="text-xs text-[#9ca3af]">Sin turnos pendientes próximos.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {p.turnosPendientes
                            .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
                            .map(t => (
                              <div key={t.id} className="bg-white rounded-xl px-3 py-2 border border-[#fde68a] min-w-[180px]">
                                <p className="text-xs font-black text-[#1e1b4b]">{t.alumnoNombre} {t.alumnoApellido}</p>
                                <p className="text-[11px] font-semibold text-[#6b7280]">{t.materia}{t.anio ? ` · ${t.anio}` : ""}</p>
                                <p className="text-[11px] font-semibold text-[#9ca3af]">
                                  {formatFecha(t.fecha)}{t.hora ? ` · ${t.hora.slice(0,5)}` : ""}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
