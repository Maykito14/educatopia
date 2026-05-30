import { createServiceClient } from "@/lib/supabase/service";

type TurnoRow = {
  id: string; estado: string; confirmado_por_profesor: boolean;
  asistio: boolean | null; pagado: boolean; cobrado: boolean; materia: string;
  slot: { fecha: string; duracion_minutos: number; profesor_id: string } | null;
  alumno: { nivel_educativo: string | null } | null;
};

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-[#1e1b4b]">{value}</p>
        <p className="text-xs font-bold text-[#9ca3af]">{label}</p>
        {sub && <p className="text-[10px] text-[#d1d5db] font-semibold">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  const [turnosRes, profesoresRes] = await Promise.all([
    supabase.from("turnos").select(`
      id, estado, confirmado_por_profesor, asistio, pagado, cobrado, materia,
      slot:slots(fecha, duracion_minutos, profesor_id),
      alumno:alumnos(nivel_educativo)
    `).neq("estado", "cancelado"),
    supabase.from("profesores").select("id, nombre").eq("activo", true),
  ]);

  const turnos = (turnosRes.data ?? []) as unknown as TurnoRow[];
  const profesores = profesoresRes.data ?? [];

  const today = new Date(); today.setHours(0,0,0,0);
  const lunes = new Date(today); lunes.setDate(today.getDate() - ((today.getDay()+6)%7));
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate()+6);

  const estaSemana = turnos.filter(t => {
    if (!t.slot) return false;
    const f = new Date(t.slot.fecha+"T00:00:00");
    return f >= lunes && f <= domingo;
  });

  const pendientesConfirmar = turnos.filter(t => !t.confirmado_por_profesor && t.slot && new Date(t.slot.fecha+"T00:00:00") >= today);
  const asistidos           = turnos.filter(t => t.asistio === true);
  const pendientesCobrar    = turnos.filter(t => t.asistio === true && !t.cobrado);
  const pendientesPagar     = turnos.filter(t => t.asistio === true && !t.pagado);
  const talleres            = turnos.filter(t => t.alumno?.nivel_educativo === "taller");

  // Por profesor
  const porProfesor = profesores.map(p => {
    const pts = turnos.filter(t => t.slot?.profesor_id === p.id);
    return {
      nombre: p.nombre,
      total: pts.length,
      pendientes:  pts.filter(t => !t.confirmado_por_profesor).length,
      asistidos:   pts.filter(t => t.asistio === true).length,
      noAsistidos: pts.filter(t => t.asistio === false).length,
      sinInfo:     pts.filter(t => t.asistio === null && t.confirmado_por_profesor).length,
    };
  });

  // Talleres stats
  const tallerNiveles: Record<string, number> = {};
  talleres.forEach(t => {
    tallerNiveles[t.materia] = (tallerNiveles[t.materia] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-[#1e1b4b]">Panel de Administración</h1>

      {/* KPIs generales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📅" label="Esta semana"            value={estaSemana.length}         color="bg-[#ede9fe]" />
        <StatCard icon="⏳" label="Sin confirmar (próx.)"  value={pendientesConfirmar.length} color="bg-[#fef3c7]" />
        <StatCard icon="✅" label="Asistidos (total)"      value={asistidos.length}           color="bg-[#d1fae5]" />
        <StatCard icon="📊" label="Total turnos"           value={turnos.length}              color="bg-[#e0f2fe]" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Pendientes de pago (prof.)" value={pendientesPagar.length}  color="bg-[#fef9c3]" />
        <StatCard icon="📥" label="Pendientes de cobrar"       value={pendientesCobrar.length} color="bg-[#fce7f3]" />
        <StatCard icon="🛠️" label="Turnos taller"              value={talleres.length}         color="bg-[#f0fdf4]" />
        <StatCard icon="👨‍🏫" label="Profesores activos"        value={profesores.length}       color="bg-[#ede9fe]" />
      </div>

      {/* Por profesor */}
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
              {porProfesor.map(p => (
                <tr key={p.nombre} className="border-b border-[#f9fafb] hover:bg-[#faf5ff] transition-colors">
                  <td className="px-4 py-3 font-extrabold text-[#1e1b4b]">{p.nombre}</td>
                  <td className="px-4 py-3 font-black text-[#7c3aed]">{p.total}</td>
                  <td className="px-4 py-3">
                    {p.pendientes > 0
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fef3c7] text-[#d97706]">{p.pendientes}</span>
                      : <span className="text-[#9ca3af]">—</span>}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicadores talleres */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
        <h2 className="text-sm font-black text-[#1e1b4b] mb-3">Indicadores de Talleres</h2>
        {talleres.length === 0 ? (
          <p className="text-sm text-[#9ca3af] font-semibold">Sin turnos de taller registrados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(tallerNiveles).sort(([,a],[,b])=>b-a).map(([mat,n])=>(
              <div key={mat} className="bg-[#f0fdf4] rounded-xl px-3 py-2 text-center">
                <p className="text-base font-black text-[#059669]">{n}</p>
                <p className="text-[10px] font-extrabold text-[#6b7280]">{mat}</p>
              </div>
            ))}
            <div className="bg-[#ede9fe] rounded-xl px-3 py-2 text-center">
              <p className="text-base font-black text-[#7c3aed]">{talleres.length}</p>
              <p className="text-[10px] font-extrabold text-[#6b7280]">Total talleres</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
