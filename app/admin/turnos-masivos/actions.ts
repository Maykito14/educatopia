"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export type SlotGenerado = {
  profesorId: string; fecha: string;
  hora_inicio: string; hora_fin: string; duracion_minutos: number;
};

export type NuevoAlumnoData = {
  nombre: string; apellido: string; edad: string;
  nivel_educativo: string; colegio: string;
};

async function _crearTurnos(
  supabase: ReturnType<typeof createServiceClient>,
  alumnoId: string,
  materia: string,
  anio: string,
  colegio: string,
  slots: SlotGenerado[]
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
      estado: "pendiente", confirmado_por_profesor: false,
    });
    turnoErr ? errores++ : creados++;
  }
  return { creados, errores };
}

/** Crea turnos para un alumno ya existente */
export async function crearTurnosMasivos(
  alumnoId: string, materia: string, anio: string, colegio: string,
  slots: SlotGenerado[]
): Promise<{ creados: number; errores: number }> {
  const supabase = createServiceClient();
  const result = await _crearTurnos(supabase, alumnoId, materia, anio, colegio, slots);
  revalidatePath("/admin/turnos-masivos");
  revalidatePath("/admin");
  return result;
}

/** Crea un alumno nuevo y luego sus turnos */
export async function crearAlumnoYTurnosMasivos(
  alumnoData: NuevoAlumnoData, materia: string, anio: string,
  slots: SlotGenerado[]
): Promise<{ creados: number; errores: number; error?: string }> {
  const supabase = createServiceClient();

  const { data: alumno, error: alumnoErr } = await supabase
    .from("alumnos")
    .insert({
      nombre:           alumnoData.nombre.trim(),
      apellido:         alumnoData.apellido.trim(),
      edad:             alumnoData.edad ? parseInt(alumnoData.edad) : null,
      nivel_educativo:  alumnoData.nivel_educativo || null,
      colegio:          alumnoData.colegio.trim() || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (alumnoErr || !alumno) {
    return { creados: 0, errores: 0, error: alumnoErr?.message ?? "Error al crear alumno" };
  }

  const result = await _crearTurnos(supabase, alumno.id, materia, anio, alumnoData.colegio, slots);
  revalidatePath("/admin/turnos-masivos");
  revalidatePath("/admin");
  return result;
}
