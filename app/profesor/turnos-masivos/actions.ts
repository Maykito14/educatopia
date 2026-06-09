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

/** Obtiene el profesor_id y el profile_id del usuario autenticado */
async function getMyAuth(): Promise<{ profesorId: string; profileId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("profesores")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!data) return null;
  return { profesorId: data.id, profileId: user.id };
}

async function _crearTurnos(
  supabase: ReturnType<typeof createServiceClient>,
  alumnoId: string,
  materia: string,
  anio: string,
  colegio: string,
  slots: SlotGenerado[],
  profesorId: string,
  tienePack: boolean,
  solicitadoPor: string | null = null
): Promise<{ creados: number; errores: number }> {
  let creados = 0; let errores = 0;

  for (const s of slots) {
    // Seguridad: verificar que el slot pertenece al propio profesor
    if (s.profesorId !== profesorId) { errores++; continue; }

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

export async function crearTurnosMasivosProfesor(
  alumnoId: string, materia: string, anio: string, colegio: string,
  slots: SlotGenerado[], tienePack: boolean
): Promise<{ creados: number; errores: number; error?: string }> {
  const auth = await getMyAuth();
  if (!auth) return { creados: 0, errores: 0, error: "No autorizado" };

  const supabase = createServiceClient();
  const result = await _crearTurnos(supabase, alumnoId, materia, anio, colegio, slots, auth.profesorId, tienePack, auth.profileId);
  await notificarTurnos(supabase, alumnoId, result.creados);
  revalidatePath("/profesor/turnos-masivos");
  revalidatePath("/profesor");
  return result;
}

export async function crearAlumnoYTurnosMasivosProfesor(
  alumnoData: NuevoAlumnoData, materia: string, anio: string,
  slots: SlotGenerado[], tienePack: boolean
): Promise<{ creados: number; errores: number; error?: string }> {
  const auth = await getMyAuth();
  if (!auth) return { creados: 0, errores: 0, error: "No autorizado" };

  const supabase = createServiceClient();

  const { data: alumno, error: alumnoErr } = await supabase
    .from("alumnos")
    .insert({
      nombre:          alumnoData.nombre.trim(),
      apellido:        alumnoData.apellido.trim(),
      edad:            alumnoData.edad ? parseInt(alumnoData.edad) : null,
      nivel_educativo: alumnoData.nivel_educativo || null,
      colegio:         alumnoData.colegio.trim() || null,
      dni:             alumnoData.dni.trim() || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (alumnoErr || !alumno) {
    return { creados: 0, errores: 0, error: alumnoErr?.message ?? "Error al crear alumno" };
  }

  const result = await _crearTurnos(supabase, alumno.id, materia, anio, alumnoData.colegio, slots, auth.profesorId, tienePack, auth.profileId);
  await notificarTurnos(supabase, alumno.id, result.creados);
  revalidatePath("/profesor/turnos-masivos");
  revalidatePath("/profesor");
  return result;
}
