import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import DisponibilidadClient from "./DisponibilidadClient";

export default async function DisponibilidadPage() {
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

  const [dispRes, bloqueoRes] = await Promise.all([
    service
      .from("profesores_disponibilidad")
      .select("id, dia_semana, hora_inicio, hora_fin, duracion_minutos, activo")
      .eq("profesor_id", profesor.id)
      .order("dia_semana")
      .order("hora_inicio"),
    service
      .from("profesores_bloqueos")
      .select("id, fecha, motivo, hora_inicio, hora_fin")
      .eq("profesor_id", profesor.id)
      .gte("fecha", new Date().toISOString().slice(0,10))
      .order("fecha")
      .order("hora_inicio"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Disponibilidad</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Gestioná tu horario semanal y bloqueá días específicos.
        </p>
      </div>
      <DisponibilidadClient
        disponibilidad={dispRes.data ?? []}
        bloqueos={bloqueoRes.data ?? []}
      />
    </div>
  );
}
