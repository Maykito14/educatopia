import { createServiceClient } from "@/lib/supabase/service";
import CalendarioAdminClient, { type TurnoAdmin } from "./CalendarioAdminClient";

export default async function CalendarioAdminPage() {
  const supabase = createServiceClient();

  const [turnosRes, profesoresRes] = await Promise.all([
    supabase.from("turnos").select(`
      id, materia, anio, colegio, confirmado_por_profesor, asistio, estado,
      slot:slots!inner(fecha, hora_inicio, hora_fin, duracion_minutos, profesor_id),
      alumno:alumnos(nombre, apellido),
      profesor:slots(profesor_id(nombre))
    `).neq("estado","cancelado"),
    supabase.from("profesores").select("id, nombre").eq("activo",true).order("nombre"),
  ]);

  // Adjuntar nombre del profesor al turno
  const profesoresMap: Record<string,string> = {};
  (profesoresRes.data??[]).forEach((p:{id:string;nombre:string})=>{ profesoresMap[p.id]=p.nombre; });

  const turnos = ((turnosRes.data??[]) as unknown[]).map((t:unknown) => {
    const row = t as TurnoAdmin & { slot?: { profesor_id?: string } };
    return {
      ...row,
      profesor: row.slot?.profesor_id ? { nombre: profesoresMap[row.slot.profesor_id as string] ?? "" } : null,
    } as TurnoAdmin;
  }).filter(t => t.slot?.fecha);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Calendario General</h1>
        <p className="text-sm text-[#6b7280] font-semibold">Todos los turnos confirmados de todos los profesores.</p>
      </div>
      <CalendarioAdminClient
        turnos={turnos}
        profesores={profesoresRes.data ?? []}
      />
    </div>
  );
}
