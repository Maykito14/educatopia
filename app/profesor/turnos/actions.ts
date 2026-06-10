"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTurnoConfirmado, sendTurnoReprogramado } from "@/lib/whatsapp";

export type SlotDisponible = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  capacidad_max: number;
  ocupados: number;
  profesorNombre: string;
  turnosEnSlot: { materia: string; anio: string; colegio: string }[];
};

export async function confirmarTurno(turnoId: string) {
  const supabase = createServiceClient();

  await supabase
    .from("turnos")
    .update({ confirmado_por_profesor: true })
    .eq("id", turnoId);

  const { data } = await supabase
    .from("turnos")
    .select(`
      alumno:alumnos(telefono_contacto, nombre_contacto),
      slot:slots(fecha, hora_inicio, profesor:profesores(nombre))
    `)
    .eq("id", turnoId)
    .single<{
      alumno: { telefono_contacto: string | null; nombre_contacto: string | null } | null;
      slot: { fecha: string; hora_inicio: string; profesor: { nombre: string } | null } | null;
    }>();

  if (data?.alumno?.telefono_contacto) {
    const fecha  = data.slot?.fecha ?? "";
    const hora   = data.slot?.hora_inicio ?? "";
    const [y, m, d] = fecha.split("-");
    const fechaStr = fecha ? `${d}/${m}/${y} a las ${hora}` : "";
    await sendTurnoConfirmado({
      phone:          data.alumno.telefono_contacto,
      nombreContacto: data.alumno.nombre_contacto ?? "responsable",
      detalle:        fechaStr,
    });
  }

  revalidatePath("/profesor/turnos");
  revalidatePath("/profesor");
}

export async function actualizarDatosTurno(
  turnoId: string,
  patch: {
    materia?: string;
    anio?: string;
    colegio?: string;
    objetivo?: string | null;
    notas?: string | null;
    duracion_minutos?: number;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient();

  if (patch.duracion_minutos !== undefined) {
    const { data: t } = await supabase
      .from("turnos").select("slot_id").eq("id", turnoId).single<{ slot_id: string }>();
    if (t) await supabase.from("slots").update({ duracion_minutos: patch.duracion_minutos }).eq("id", t.slot_id);
  }

  const { duracion_minutos: _, ...turnoFields } = patch;
  if (Object.keys(turnoFields).length > 0) {
    const { error } = await supabase.from("turnos").update(turnoFields).eq("id", turnoId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/profesor/turnos");
  revalidatePath("/profesor");
  return { ok: true };
}

export async function actualizarDatosAlumno(
  alumnoId: string,
  patch: {
    nombre?: string;
    apellido?: string;
    edad?: number | null;
    nivel_educativo?: string | null;
    anio_grado?: string | null;
    colegio?: string | null;
    nombre_contacto?: string | null;
    telefono_contacto?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("alumnos").update(patch).eq("id", alumnoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/profesor/turnos");
  revalidatePath("/profesor");
  return { ok: true };
}

export async function eliminarTurno(
  turnoId: string
): Promise<{ ok: boolean; error?: string }> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { ok: false, error: "No autorizado" };

  const supabase = createServiceClient();

  const { data: profesor } = await supabase
    .from("profesores")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!profesor) return { ok: false, error: "No autorizado" };

  const { data: turno } = await supabase
    .from("turnos")
    .select("slot_id, slot:slots(profesor_id)")
    .eq("id", turnoId)
    .single<{ slot_id: string; slot: { profesor_id: string } | null }>();

  if (!turno) return { ok: false, error: "Turno no encontrado" };
  if (turno.slot?.profesor_id !== profesor.id) return { ok: false, error: "No autorizado" };

  const slotId = turno.slot_id;
  const { error } = await supabase.from("turnos").delete().eq("id", turnoId);
  if (error) return { ok: false, error: error.message };

  await sincronizarEstadoSlot(supabase, slotId);
  revalidatePath("/profesor/turnos");
  revalidatePath("/profesor");
  return { ok: true };
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

/** Devuelve todos los slots futuros con cupo disponible (todos los profesores), excluyendo el slot actual. */
export async function obtenerSlotsDisponibles(
  excludeSlotId: string
): Promise<SlotDisponible[]> {
  const supabase = createServiceClient();
  const hoy = new Date().toISOString().slice(0, 10);

  type SlotRaw = {
    id: string; fecha: string; hora_inicio: string; hora_fin: string;
    duracion_minutos: number; capacidad_max: number;
    profesor: { nombre: string } | null;
  };

  const { data: slots } = await supabase
    .from("slots")
    .select("id, fecha, hora_inicio, hora_fin, duracion_minutos, capacidad_max, profesor:profesores(nombre)")
    .neq("estado", "cancelado")
    .gte("fecha", hoy)
    .neq("id", excludeSlotId)
    .order("fecha")
    .order("hora_inicio")
    .returns<SlotRaw[]>();

  if (!slots || slots.length === 0) return [];

  const slotIds = slots.map(s => s.id);

  type TurnoEnSlot = { slot_id: string; materia: string; anio: string; colegio: string };
  const { data: turnosData } = await supabase
    .from("turnos")
    .select("slot_id, materia, anio, colegio")
    .in("slot_id", slotIds)
    .neq("estado", "cancelado")
    .returns<TurnoEnSlot[]>();

  const turnosPorSlot = new Map<string, TurnoEnSlot[]>();
  for (const t of turnosData ?? []) {
    const list = turnosPorSlot.get(t.slot_id) ?? [];
    list.push(t);
    turnosPorSlot.set(t.slot_id, list);
  }

  return slots
    .map(s => ({
      id:              s.id,
      fecha:           s.fecha,
      hora_inicio:     s.hora_inicio,
      hora_fin:        s.hora_fin,
      duracion_minutos: s.duracion_minutos,
      capacidad_max:   s.capacidad_max,
      ocupados:        (turnosPorSlot.get(s.id) ?? []).length,
      profesorNombre:  s.profesor?.nombre ?? "—",
      turnosEnSlot:    (turnosPorSlot.get(s.id) ?? []).map(t => ({ materia: t.materia, anio: t.anio, colegio: t.colegio })),
    }))
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

export async function reprogramarTurno(
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

  // Liberar cupo del slot anterior y actualizar el nuevo
  await Promise.all([
    sincronizarEstadoSlot(supabase, oldSlotId),
    sincronizarEstadoSlot(supabase, nuevoSlotId),
  ]);

  // Notificar por WhatsApp
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

  revalidatePath("/profesor/turnos");
  revalidatePath("/profesor");
  return { ok: true };
}
