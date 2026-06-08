"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTurnoReprogramado } from "@/lib/whatsapp";

export type SlotDisponible = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  capacidad_max: number;
  ocupados: number;
};

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

/** Devuelve los slots futuros del profesor con cupo disponible, excluyendo el slot actual. */
export async function obtenerSlotsDisponiblesAdmin(
  profesorId: string,
  excludeSlotId: string
): Promise<SlotDisponible[]> {
  const supabase = createServiceClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: slots } = await supabase
    .from("slots")
    .select("id, fecha, hora_inicio, hora_fin, duracion_minutos, capacidad_max")
    .eq("profesor_id", profesorId)
    .neq("estado", "cancelado")
    .gte("fecha", hoy)
    .neq("id", excludeSlotId)
    .order("fecha")
    .order("hora_inicio")
    .returns<{ id: string; fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number; capacidad_max: number }[]>();

  if (!slots || slots.length === 0) return [];

  const slotIds = slots.map(s => s.id);
  const { data: turnosOcupados } = await supabase
    .from("turnos")
    .select("slot_id")
    .in("slot_id", slotIds)
    .neq("estado", "cancelado")
    .returns<{ slot_id: string }[]>();

  const ocupados = new Map<string, number>();
  for (const t of turnosOcupados ?? []) {
    ocupados.set(t.slot_id, (ocupados.get(t.slot_id) ?? 0) + 1);
  }

  return slots
    .map(s => ({ ...s, ocupados: ocupados.get(s.id) ?? 0 }))
    .filter(s => s.ocupados < s.capacidad_max);
}

async function sincronizarEstadoSlot(
  supabase: ReturnType<typeof createServiceClient>,
  slotId: string
) {
  const [{ count }, slotRes] = await Promise.all([
    supabase
      .from("turnos")
      .select("*", { count: "exact", head: true })
      .eq("slot_id", slotId)
      .neq("estado", "cancelado"),
    supabase
      .from("slots")
      .select("capacidad_max")
      .eq("id", slotId)
      .single<{ capacidad_max: number }>(),
  ]);
  if (slotRes.data && count !== null) {
    const estado = count >= slotRes.data.capacidad_max ? "lleno" : "disponible";
    await supabase.from("slots").update({ estado }).eq("id", slotId);
  }
}

export async function reprogramarTurnoAdmin(
  turnoId: string,
  nuevoSlotId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: turnoActual, error: fetchErr } = await supabase
    .from("turnos")
    .select("slot_id, alumno:alumnos(telefono_contacto, nombre_contacto)")
    .eq("id", turnoId)
    .single<{
      slot_id: string;
      alumno: { telefono_contacto: string | null; nombre_contacto: string | null } | null;
    }>();

  if (fetchErr || !turnoActual) return { ok: false, error: "Turno no encontrado" };

  const oldSlotId = turnoActual.slot_id;

  const { error } = await supabase
    .from("turnos")
    .update({ slot_id: nuevoSlotId, confirmado_por_profesor: false, estado: "pendiente" })
    .eq("id", turnoId);

  if (error) return { ok: false, error: error.message };

  await Promise.all([
    sincronizarEstadoSlot(supabase, oldSlotId),
    sincronizarEstadoSlot(supabase, nuevoSlotId),
  ]);

  if (turnoActual.alumno?.telefono_contacto) {
    const { data: nuevoSlot } = await supabase
      .from("slots")
      .select("fecha, hora_inicio")
      .eq("id", nuevoSlotId)
      .single<{ fecha: string; hora_inicio: string }>();

    if (nuevoSlot) {
      const [y, m, d] = nuevoSlot.fecha.split("-");
      const detalle = `${d}/${m}/${y} a las ${nuevoSlot.hora_inicio.slice(0, 5)}`;
      await sendTurnoReprogramado({
        phone:          turnoActual.alumno.telefono_contacto,
        nombreContacto: turnoActual.alumno.nombre_contacto ?? "responsable",
        detalle,
      });
    }
  }

  revalidatePath("/admin/turnos");
  revalidatePath("/admin");
  return { ok: true };
}
