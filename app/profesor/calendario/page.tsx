import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import CalendarioClient from "./CalendarioClient";

export type TurnoCalendario = {
  id: string;
  materia: string;
  anio: string;
  colegio: string;
  objetivo: string | null;
  confirmado_por_profesor: boolean;
  asistio: boolean | null;
  slot: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    duracion_minutos: number;
  };
  alumno: {
    nombre: string;
    apellido: string;
    nivel_educativo: string | null;
    nombre_contacto: string | null;
    telefono_contacto: string | null;
  } | null;
};

export default async function CalendarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profesor } = await supabase
    .from("profesores")
    .select("id, nombre")
    .eq("profile_id", user.id)
    .single<{ id: string; nombre: string }>();

  if (!profesor) redirect("/profesor");

  // Traer todos los turnos confirmados con slot y alumno
  const service = createServiceClient();
  const { data: turnos } = await service
    .from("turnos")
    .select(`
      id, materia, anio, colegio, objetivo,
      confirmado_por_profesor, asistio,
      slot:slots!inner(fecha, hora_inicio, hora_fin, duracion_minutos, profesor_id),
      alumno:alumnos(nombre, apellido, nivel_educativo, nombre_contacto, telefono_contacto)
    `)
    .eq("slot.profesor_id", profesor.id)
    .eq("confirmado_por_profesor", true)
    .neq("estado", "cancelado");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Calendario de turnos</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Pasá el mouse sobre cada turno para ver los detalles.
        </p>
      </div>
      <CalendarioClient turnos={(turnos ?? []) as unknown as TurnoCalendario[]} />
    </div>
  );
}
