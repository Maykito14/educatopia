import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type TurnoRow = {
  id: string; materia: string; anio: string; colegio: string;
  confirmado_por_profesor: boolean; asistio: boolean | null;
  pagado: boolean; cobrado: boolean; estado: string;
  slot: { fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number } | null;
  alumno: { nombre: string; apellido: string } | null;
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function semanaLabel(fecha: string) {
  const d = new Date(fecha + "T00:00:00");
  const lun = new Date(d); lun.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const vie = new Date(lun); vie.setDate(lun.getDate() + 6);
  return `${pad(lun.getDate())}/${pad(lun.getMonth()+1)} – ${pad(vie.getDate())}/${pad(vie.getMonth()+1)}`;
}

export default async function ProfesorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profesor } = await supabase
    .from("profesores")
    .select("id, nombre")
    .eq("profile_id", user.id)
    .single<{ id: string; nombre: string }>();

  if (!profesor) {
    return (
      <div className="text-center py-20 text-[#9ca3af] font-bold">
        Tu cuenta no tiene un perfil de profesor asociado. Contactá al administrador.
      </div>
    );
  }

  const { data: turnos } = await supabase
    .from("turnos")
    .select(`
      id, materia, anio, colegio, confirmado_por_profesor, asistio, pagado, cobrado, estado,
      slot:slots(fecha, hora_inicio, hora_fin, duracion_minutos),
      alumno:alumnos(nombre, apellido)
    `)
    .neq("estado", "cancelado")
    .returns<TurnoRow[]>();

  const all = turnos ?? [];

  // ── Stats ────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0);
  const lunes = new Date(today); lunes.setDate(today.getDate() - ((today.getDay()+6)%7));
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate()+6);

  const estaSemanaTurnos = all.filter(t => {
    if (!t.slot) return false;
    const f = new Date(t.slot.fecha + "T00:00:00");
    return f >= lunes && f <= domingo;
  });

  const pendientesConfirmar = all.filter(t => !t.confirmado_por_profesor && t.slot && new Date(t.slot.fecha+"T00:00:00") >= today);
  const asistidos = all.filter(t => t.asistio === true);
  const noAsistidos = all.filter(t => t.asistio === false);

  // Por materia (total)
  const porMateria: Record<string, number> = {};
  all.forEach(t => { porMateria[t.materia] = (porMateria[t.materia] ?? 0) + 1; });

  // Por colegio (total)
  const porColegio: Record<string, number> = {};
  all.forEach(t => { porColegio[t.colegio] = (porColegio[t.colegio] ?? 0) + 1; });

  // Últimas 8 semanas agrupadas
  const semanasMap: Record<string, number> = {};
  all.forEach(t => {
    if (!t.slot) return;
    const key = semanaLabel(t.slot.fecha);
    semanasMap[key] = (semanasMap[key] ?? 0) + 1;
  });
  const semanas = Object.entries(semanasMap).slice(-8);
  const maxSemana = Math.max(...semanas.map(([,v]) => v), 1);

  // Próximos turnos (hoy en adelante, sin confirmar primero)
  const proximos = all
    .filter(t => t.slot && new Date(t.slot.fecha+"T00:00:00") >= today)
    .sort((a, b) => {
      if (!a.slot || !b.slot) return 0;
      return a.slot.fecha.localeCompare(b.slot.fecha) || a.slot.hora_inicio.localeCompare(b.slot.hora_inicio);
    })
    .slice(0, 8);

  const statCard = (icon: string, label: string, value: number, color: string) => (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-[#1e1b4b]">{value}</p>
        <p className="text-xs font-bold text-[#9ca3af]">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-[#1e1b4b]">Bienvenido, {profesor.nombre} 👋</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCard("📅", "Esta semana", estaSemanaTurnos.length, "bg-[#ede9fe]")}
        {statCard("⏳", "Pendientes de confirmar", pendientesConfirmar.length, "bg-[#fef3c7]")}
        {statCard("✅", "Asistidos (total)", asistidos.length, "bg-[#d1fae5]")}
        {statCard("❌", "No asistidos (total)", noAsistidos.length, "bg-[#fee2e2]")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnos por semana */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
          <h2 className="text-sm font-black text-[#1e1b4b] mb-4">Turnos por semana</h2>
          {semanas.length === 0 ? (
            <p className="text-sm text-[#9ca3af] font-semibold">Sin datos aún.</p>
          ) : (
            <div className="space-y-2">
              {semanas.map(([semana, count]) => (
                <div key={semana} className="flex items-center gap-2">
                  <span className="text-xs text-[#9ca3af] font-semibold w-28 flex-shrink-0">{semana}</span>
                  <div className="flex-1 bg-[#f3f4f6] rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-[#7c3aed] rounded-full transition-all"
                      style={{ width: `${(count / maxSemana) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-[#7c3aed] w-4">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por materia y colegio */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
            <h2 className="text-sm font-black text-[#1e1b4b] mb-3">Alumnos por materia</h2>
            {Object.entries(porMateria).length === 0 ? (
              <p className="text-xs text-[#9ca3af] font-semibold">Sin datos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(porMateria).sort(([,a],[,b]) => b-a).map(([mat, n]) => (
                  <span key={mat} className="px-2 py-1 bg-[#ede9fe] text-[#7c3aed] text-xs font-extrabold rounded-lg">
                    {mat} · {n}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
            <h2 className="text-sm font-black text-[#1e1b4b] mb-3">Alumnos por colegio</h2>
            {Object.entries(porColegio).length === 0 ? (
              <p className="text-xs text-[#9ca3af] font-semibold">Sin datos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(porColegio).sort(([,a],[,b]) => b-a).map(([col, n]) => (
                  <span key={col} className="px-2 py-1 bg-[#d1fae5] text-[#059669] text-xs font-extrabold rounded-lg">
                    {col} · {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Próximos turnos */}
      {proximos.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
          <h2 className="text-sm font-black text-[#1e1b4b] mb-4">Próximos turnos</h2>
          <div className="space-y-2">
            {proximos.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[#f3f4f6] last:border-0">
                <div className="flex-shrink-0 text-center w-12">
                  <p className="text-xs font-black text-[#7c3aed]">
                    {t.slot ? new Date(t.slot.fecha+"T00:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"}) : "—"}
                  </p>
                  <p className="text-[10px] text-[#9ca3af] font-semibold">{t.slot?.hora_inicio?.slice(0,5)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-[#1e1b4b] truncate">
                    {t.alumno?.nombre} {t.alumno?.apellido}
                  </p>
                  <p className="text-xs text-[#6b7280] font-semibold">{t.materia} · {t.anio} · {t.colegio}</p>
                </div>
                {!t.confirmado_por_profesor && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-[#fef3c7] text-[#d97706] rounded-full flex-shrink-0">Sin confirmar</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
