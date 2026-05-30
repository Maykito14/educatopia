import { createServiceClient } from "@/lib/supabase/service";
import TurnosAdminClient from "./TurnosAdminClient";

export default async function TurnosAdminPage() {
  const supabase = createServiceClient();

  const [turnosRes, profesoresRes] = await Promise.all([
    supabase.from("turnos").select(`
      id, materia, anio, colegio, estado,
      confirmado_por_profesor, asistio, pagado, cobrado, medio_cobro,
      slot:slots(id, fecha, hora_inicio, hora_fin, duracion_minutos, profesor_id),
      alumno:alumnos(nombre, apellido, nivel_educativo)
    `).order("created_at", { ascending: false }),
    supabase.from("profesores").select("id, nombre").eq("activo",true).order("nombre"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Administración de Turnos</h1>
        <p className="text-sm text-[#6b7280] font-semibold">Editá el estado, duración y registros de cada turno.</p>
      </div>
      <TurnosAdminClient
        turnos={(turnosRes.data??[]) as unknown as Parameters<typeof TurnosAdminClient>[0]["turnos"]}
        profesores={profesoresRes.data ?? []}
      />
    </div>
  );
}
