import { createServiceClient } from "@/lib/supabase/service";
import TurnosMasivosClient from "./TurnosMasivosClient";

export default async function TurnosMasivosPage() {
  const supabase = createServiceClient();

  const [alumnosRes, profesoresRes, colegiosRes, restriccionesRes] = await Promise.all([
    supabase
      .from("alumnos")
      .select("id, nombre, apellido, nivel_educativo, colegio")
      .order("apellido"),
    supabase
      .from("profesores")
      .select(`
        id, nombre,
        disponibilidad:profesores_disponibilidad(dia_semana, hora_inicio, hora_fin, activo),
        materias_join:profesores_materias(materia:materias(nombre))
      `)
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("colegios")
      .select("nombre")
      .eq("activo", true)
      .order("orden"),
    supabase
      .from("profesor_nivel_exclusivo")
      .select("profesor_id, nivel, alumno:alumnos(id, nombre, apellido)"),
  ]);

  type RestriccionRow = { profesor_id: string; nivel: string; alumno: { id: string; nombre: string; apellido: string } | null };
  const restriccionesMap = new Map<string, { nivel: string; alumnos: { id: string; nombre: string; apellido: string }[] }>();
  for (const row of (restriccionesRes.data ?? []) as unknown as RestriccionRow[]) {
    if (!row.alumno) continue;
    const key = `${row.profesor_id}|${row.nivel}`;
    if (!restriccionesMap.has(key)) restriccionesMap.set(key, { nivel: row.nivel, alumnos: [] });
    restriccionesMap.get(key)!.alumnos.push(row.alumno);
  }
  const restricciones = Array.from(restriccionesMap.entries()).map(([key, val]) => ({
    profesorId: key.split("|")[0],
    nivel:      val.nivel,
    alumnos:    val.alumnos,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Turnos Masivos</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Creá turnos para toda la semana — elegí un alumno existente o cargá uno nuevo.
        </p>
      </div>
      <TurnosMasivosClient
        alumnos={(alumnosRes.data ?? []) as Parameters<typeof TurnosMasivosClient>[0]["alumnos"]}
        profesores={(profesoresRes.data ?? []) as unknown as Parameters<typeof TurnosMasivosClient>[0]["profesores"]}
        colegios={(colegiosRes.data ?? []).map((c: { nombre: string }) => c.nombre)}
        restricciones={restricciones}
      />
    </div>
  );
}
