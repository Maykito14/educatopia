import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import TurnosClient from "./TurnosClient";

export default async function MisTurnosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profesor } = await supabase
    .from("profesores")
    .select("id, nombre")
    .eq("profile_id", user.id)
    .single<{ id: string; nombre: string }>();

  if (!profesor) redirect("/profesor");

  const service = createServiceClient();

  const [{ data: turnos }, { data: precios }] = await Promise.all([
    supabase
      .from("turnos")
      .select(`
        id, alumno_id, materia, anio, colegio, objetivo, notas, estado, tipo_pedido,
        confirmado_por_profesor, asistio, pagado, cobrado, medio_cobro, monto_cobrado,
        slot:slots(id, fecha, hora_inicio, hora_fin, duracion_minutos, profesor_id),
        alumno:alumnos(nombre, apellido, edad, nivel_educativo, anio_grado, colegio, saldo_a_favor, nombre_contacto, telefono_contacto)
      `)
      .neq("estado", "cancelado")
      .order("created_at", { ascending: false }),
    service
      .from("precios")
      .select("nivel, valor_hora, pack_semanal_precio, pack_semanal_horas, pack_mensual_precio, pack_mensual_horas"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Mis Turnos</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Confirmá los turnos solicitados y registrá la asistencia.
        </p>
      </div>
      <TurnosClient
        turnos={(turnos ?? []) as Parameters<typeof TurnosClient>[0]["turnos"]}
        precios={(precios ?? []) as Parameters<typeof TurnosClient>[0]["precios"]}
      />
    </div>
  );
}
