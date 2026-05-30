import { createServiceClient } from "@/lib/supabase/service";
import TurnosMasivosClient from "./TurnosMasivosClient";

export default async function TurnosMasivosPage() {
  const supabase = createServiceClient();

  const [alumnosRes, profesoresRes, colegiosRes] = await Promise.all([
    supabase
      .from("alumnos")
      .select("id, nombre, apellido, nivel_educativo, colegio")
      .order("apellido"),
    supabase
      .from("profesores")
      .select(`
        id, nombre,
        disponibilidad:profesores_disponibilidad(dia_semana, hora_inicio, hora_fin, activo)
      `)
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("colegios")
      .select("nombre")
      .eq("activo", true)
      .order("orden"),
  ]);

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
        profesores={(profesoresRes.data ?? []) as Parameters<typeof TurnosMasivosClient>[0]["profesores"]}
        colegios={(colegiosRes.data ?? []).map((c: { nombre: string }) => c.nombre)}
      />
    </div>
  );
}
