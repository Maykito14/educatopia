"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function confirmarTurno(turnoId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("turnos")
    .update({ confirmado_por_profesor: true })
    .eq("id", turnoId);
  revalidatePath("/profesor/turnos");
  revalidatePath("/profesor");
}

export async function marcarAsistencia(turnoId: string, asistio: boolean) {
  const supabase = createServiceClient();
  await supabase
    .from("turnos")
    .update({ asistio })
    .eq("id", turnoId);
  revalidatePath("/profesor/turnos");
  revalidatePath("/profesor");
}

export async function actualizarCobro(
  turnoId: string,
  patch: { cobrado?: boolean; medio_cobro?: "efectivo" | "transferencia" | null }
) {
  const supabase = createServiceClient();
  await supabase.from("turnos").update(patch).eq("id", turnoId);
  revalidatePath("/profesor/turnos");
}
