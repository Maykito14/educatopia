import { createServiceClient } from "@/lib/supabase/service";
import CalendarioAdminClient, { type TurnoAdmin } from "./CalendarioAdminClient";

export default async function CalendarioAdminPage() {
  const supabase = createServiceClient();

  const [turnosRes, profesoresRes] = await Promise.all([
    supabase
      .from("turnos")
      .select(`
        id, materia, anio, colegio, confirmado_por_profesor, asistio, estado,
        slot:slots!inner(fecha, hora_inicio, hora_fin, duracion_minutos, profesor_id),
        alumno:alumnos(nombre, apellido)
      `)
      .neq("estado", "cancelado"),
    supabase.from("profesores").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  // Mapa id → nombre
  const profMap: Record<string, string> = {};
  for (const p of profesoresRes.data ?? []) profMap[p.id] = p.nombre;

  type RawSlot = { fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number; profesor_id: string };
  type RawRow  = { id: string; materia: string; anio: string; colegio: string; confirmado_por_profesor: boolean; asistio: boolean | null; estado: string; slot: RawSlot | null; alumno: { nombre: string; apellido: string } | null };

  const turnos: TurnoAdmin[] = ((turnosRes.data ?? []) as unknown as RawRow[])
    .filter(r => r.slot?.fecha)
    .map(r => ({
      id:                      r.id,
      materia:                 r.materia,
      anio:                    r.anio,
      colegio:                 r.colegio,
      confirmado_por_profesor: r.confirmado_por_profesor,
      asistio:                 r.asistio,
      estado:                  r.estado,
      profesorId:              r.slot?.profesor_id ?? null,
      slot:                    r.slot!,
      alumno:                  r.alumno,
      profesor:                r.slot?.profesor_id ? { nombre: profMap[r.slot.profesor_id] ?? "" } : null,
    }));

  const profesores = profesoresRes.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Calendario General</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Turnos de todos los profesores · {profesores.length} profesor{profesores.length !== 1 ? "es" : ""}
        </p>
      </div>
      <CalendarioAdminClient turnos={turnos} profesores={profesores} />
    </div>
  );
}
