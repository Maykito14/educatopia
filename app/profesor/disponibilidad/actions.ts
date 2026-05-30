"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

async function getProfesorId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profesores")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  return data?.id ?? null;
}

export async function toggleDisponibilidad(disponibilidadId: string, activo: boolean) {
  const supabase = createServiceClient();
  await supabase
    .from("profesores_disponibilidad")
    .update({ activo })
    .eq("id", disponibilidadId);
  revalidatePath("/profesor/disponibilidad");
}

export async function agregarBloqueo(
  fecha: string,
  motivo: string,
  horaInicio: string,   // "" = todo el día
  horaFin: string
) {
  const profesorId = await getProfesorId();
  if (!profesorId) return;
  const supabase = createServiceClient();
  await supabase.from("profesores_bloqueos").upsert(
    {
      profesor_id: profesorId,
      fecha,
      motivo:      motivo || null,
      hora_inicio: horaInicio || null,
      hora_fin:    horaFin    || null,
    },
    { onConflict: "profesor_id,fecha,hora_inicio" }
  );
  revalidatePath("/profesor/disponibilidad");
}

export async function quitarBloqueo(bloqueoId: string) {
  const supabase = createServiceClient();
  await supabase.from("profesores_bloqueos").delete().eq("id", bloqueoId);
  revalidatePath("/profesor/disponibilidad");
}
