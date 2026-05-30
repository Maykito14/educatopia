"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

async function getMyProfesorId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("profesores")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  return data?.id ?? null;
}

export async function actualizarPagadoProfesor(turnoId: string, pagado: boolean) {
  const profesorId = await getMyProfesorId();
  if (!profesorId) return;
  const supabase = createServiceClient();
  // Verificar que el turno pertenece a este profesor
  const { data: turno } = await supabase
    .from("turnos")
    .select("id, slot:slots!inner(profesor_id)")
    .eq("id", turnoId)
    .single<{ id: string; slot: { profesor_id: string } }>();
  if (!turno || (turno.slot as { profesor_id: string }).profesor_id !== profesorId) return;
  await supabase.from("turnos").update({ pagado }).eq("id", turnoId);
  revalidatePath("/profesor/liquidacion");
}

export async function actualizarMedioCobroProfesor(
  turnoId: string,
  medio_cobro: "efectivo" | "transferencia" | null
) {
  const profesorId = await getMyProfesorId();
  if (!profesorId) return;
  const supabase = createServiceClient();
  const { data: turno } = await supabase
    .from("turnos")
    .select("id, slot:slots!inner(profesor_id)")
    .eq("id", turnoId)
    .single<{ id: string; slot: { profesor_id: string } }>();
  if (!turno || (turno.slot as { profesor_id: string }).profesor_id !== profesorId) return;
  await supabase.from("turnos").update({ medio_cobro }).eq("id", turnoId);
  revalidatePath("/profesor/liquidacion");
}
