"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function actualizarTurno(id: string, patch: {
  estado?: string;
  confirmado_por_profesor?: boolean;
  asistio?: boolean | null;
  pagado?: boolean;
  cobrado?: boolean;
  duracion_minutos?: number;
  medio_cobro?: "efectivo" | "transferencia" | null;
}) {
  const supabase = createServiceClient();
  // Si cambia duracion, actualizar el slot también
  if (patch.duracion_minutos !== undefined) {
    const { data: turno } = await supabase.from("turnos").select("slot_id").eq("id",id).single<{slot_id:string}>();
    if (turno) {
      await supabase.from("slots").update({ duracion_minutos: patch.duracion_minutos }).eq("id", turno.slot_id);
    }
  }
  const { duracion_minutos: _, ...turnoFields } = patch;
  if (Object.keys(turnoFields).length > 0) {
    await supabase.from("turnos").update(turnoFields).eq("id", id);
  }
  revalidatePath("/admin/turnos");
  revalidatePath("/admin");
}
