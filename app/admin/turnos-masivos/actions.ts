"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTurnoConfirmado } from "@/lib/whatsapp";

export type SlotGenerado = {
  profesorId: string; fecha: string;
  hora_inicio: string; hora_fin: string; duracion_minutos: number;
};

export type NuevoAlumnoData = {
  nombre: string; apellido: string; edad: string;
  nivel_educativo: string; colegio: string; dni: string;
};

async function _crearTurnos(
  supabase: ReturnType<typeof createServiceClient>,
  alumnoId: string,
  materia: string,
  anio: string,
  colegio: string,
  especialidad: string,
  slots: SlotGenerado[],
  tienePack: boolean,
  solicitadoPor: string | null = null
): Promise<{ creados: number; errores: number }> {
  let creados = 0; let errores = 0;

  for (const s of slots) {
    const { data: slot, error: slotErr } = await supabase
      .from("slots")
      .upsert(
        { profesor_id: s.profesorId, fecha: s.fecha, hora_inicio: s.hora_inicio, hora_fin: s.hora_fin, duracion_minutos: s.duracion_minutos, capacidad_max: 4, estado: "disponible" },
        { onConflict: "profesor_id,fecha,hora_inicio,duracion_minutos" }
      )
      .select("id").single();
    if (slotErr || !slot) { errores++; continue; }

    const { error: turnoErr } = await supabase.from("turnos").insert({
      slot_id: slot.id, alumno_id: alumnoId, materia, anio, colegio,
      especialidad: especialidad || null,
      estado: "confirmado",
      confirmado_por_profesor: false,
      solicitado_por: solicitadoPor,
    });
    turnoErr ? errores++ : creados++;
  }
  return { creados, errores };
}

async function notificarTurnos(
  supabase: ReturnType<typeof createServiceClient>,
  alumnoId: string,
  creados: number
) {
  if (creados === 0) return;
  const { data: alumno } = await supabase
    .from("alumnos")
    .select("telefono_contacto, nombre_contacto")
    .eq("id", alumnoId)
    .single<{ telefono_contacto: string | null; nombre_contacto: string | null }>();
  if (!alumno?.telefono_contacto) return;
  await sendTurnoConfirmado({
    phone:          alumno.telefono_contacto,
    nombreContacto: alumno.nombre_contacto ?? "responsable",
    detalle:        creados === 1 ? "próximamente" : `${creados} turnos confirmados`,
  });
}

/** Crea turnos para un alumno ya existente */
export async function crearTurnosMasivos(
  alumnoId: string, materia: string, anio: string, colegio: string,
  especialidad: string, slots: SlotGenerado[], tienePack: boolean
): Promise<{ creados: number; errores: number }> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const solicitadoPor = user?.id ?? null;

  const supabase = createServiceClient();
  const result = await _crearTurnos(supabase, alumnoId, materia, anio, colegio, especialidad, slots, tienePack, solicitadoPor);
  await notificarTurnos(supabase, alumnoId, result.creados);
  revalidatePath("/admin/turnos-masivos");
  revalidatePath("/admin");
  return result;
}

/** Crea un alumno nuevo y luego sus turnos */
export async function crearAlumnoYTurnosMasivos(
  alumnoData: NuevoAlumnoData, materia: string, anio: string,
  especialidad: string, slots: SlotGenerado[], tienePack: boolean
): Promise<{ creados: number; errores: number; error?: string }> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const solicitadoPor = user?.id ?? null;

  const supabase = createServiceClient();

  const { data: alumno, error: alumnoErr } = await supabase
    .from("alumnos")
    .insert({
      nombre:           alumnoData.nombre.trim(),
      apellido:         alumnoData.apellido.trim(),
      edad:             alumnoData.edad ? parseInt(alumnoData.edad) : null,
      nivel_educativo:  alumnoData.nivel_educativo || null,
      colegio:          alumnoData.colegio.trim() || null,
      dni:              alumnoData.dni.trim() || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (alumnoErr || !alumno) {
    return { creados: 0, errores: 0, error: alumnoErr?.message ?? "Error al crear alumno" };
  }

  const result = await _crearTurnos(supabase, alumno.id, materia, anio, alumnoData.colegio, especialidad, slots, tienePack, solicitadoPor);
  await notificarTurnos(supabase, alumno.id, result.creados);
  revalidatePath("/admin/turnos-masivos");
  revalidatePath("/admin");
  return result;
}
