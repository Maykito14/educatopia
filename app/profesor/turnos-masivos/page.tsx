import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import TurnosMasivosProfesorClient from "./TurnosMasivosProfesorClient";

export default async function TurnosMasivosProfesorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [profesorRes, alumnosRes, colegiosRes] = await Promise.all([
    service
      .from("profesores")
      .select("id, disponibilidad:profesores_disponibilidad(dia_semana, hora_inicio, hora_fin, activo)")
      .eq("profile_id", user.id)
      .single<{
        id: string;
        disponibilidad: { dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[];
      }>(),
    service
      .from("alumnos")
      .select("id, nombre, apellido, nivel_educativo, colegio")
      .order("apellido"),
    service
      .from("colegios")
      .select("nombre")
      .eq("activo", true)
      .order("orden"),
  ]);

  if (!profesorRes.data) redirect("/profesor");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Turnos Masivos</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Creá turnos para toda la semana usando tu disponibilidad configurada.
        </p>
      </div>
      <TurnosMasivosProfesorClient
        profesorId={profesorRes.data.id}
        disponibilidad={profesorRes.data.disponibilidad}
        alumnos={(alumnosRes.data ?? []) as Parameters<typeof TurnosMasivosProfesorClient>[0]["alumnos"]}
        colegios={(colegiosRes.data ?? []).map((c: { nombre: string }) => c.nombre)}
      />
    </div>
  );
}
