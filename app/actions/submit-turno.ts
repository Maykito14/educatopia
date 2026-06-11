"use server";

import { createServiceClient } from "@/lib/supabase/service";
import type { FormData } from "@/app/(dashboard)/turnos/nuevo/types";
import type { MockSlot } from "@/app/(dashboard)/turnos/nuevo/types";

export type SubmitResult =
  | { success: true; turnoId: string; creados: number }
  | { success: false; error: string };

type SlotInput = Pick<MockSlot, "profesorId" | "fecha" | "hora_inicio" | "hora_fin" | "duracion_minutos" | "capacidad_max">;

export async function submitTurno(
  formData: FormData,
  slots: SlotInput[]
): Promise<SubmitResult> {
  try {
    const supabase = createServiceClient();

    if (slots.length === 0) return { success: false, error: "No se seleccionaron turnos." };

    // 1 — Alumno: reusar existente (por DNI) o crear nuevo
    let alumnoId: string;

    if (formData.alumnoExistenteId) {
      alumnoId = formData.alumnoExistenteId;
    } else {
      const { data: alumno, error: alumnoErr } = await supabase
        .from("alumnos")
        .insert({
          nombre:            formData.nombre,
          apellido:          formData.apellido,
          edad:              formData.edad ? parseInt(formData.edad) : null,
          nivel_educativo:   (formData.nivelEducativo as string) || null,
          anio_grado:        formData.anioGrado || null,
          colegio:           formData.colegio,
          telefono_contacto: formData.whatsapp || null,
          nombre_contacto:   formData.nombreContacto || null,
          origen:            (formData.origen as string) || null,
          dni:               formData.dni || null,
        })
        .select("id")
        .single();
      if (alumnoErr) return { success: false, error: alumnoErr.message };
      alumnoId = alumno.id;
    }

    // 2 — Por cada slot: upsert + crear turno
    let primerTurnoId = "";
    let creados = 0;

    for (const slot of slots) {
      const { data: dbSlot, error: slotErr } = await supabase
        .from("slots")
        .upsert(
          {
            profesor_id:      slot.profesorId,
            fecha:            slot.fecha,
            hora_inicio:      slot.hora_inicio,
            hora_fin:         slot.hora_fin,
            duracion_minutos: slot.duracion_minutos,
            capacidad_max:    slot.capacidad_max,
            estado:           "disponible",
          },
          { onConflict: "profesor_id,fecha,hora_inicio,duracion_minutos" }
        )
        .select("id, estado")
        .single();

      if (slotErr || !dbSlot) continue;
      if (dbSlot.estado === "lleno") continue;

      const { data: turno, error: turnoErr } = await supabase
        .from("turnos")
        .insert({
          slot_id:      dbSlot.id,
          alumno_id:    alumnoId,
          materia:      formData.materia,
          anio:         formData.anioGrado || "",
          colegio:      formData.colegio,
          especialidad: formData.especialidad || null,
          objetivo:     (formData.objetivo as string) || null,
          estado:       "pendiente",
          notas:        formData.comentarios || null,
          medio_cobro:  formData.metodoPago ?? "transferencia",
        })
        .select("id")
        .single();

      if (!turnoErr && turno) {
        if (!primerTurnoId) primerTurnoId = turno.id;
        creados++;
      }
    }

    if (creados === 0) return { success: false, error: "No se pudo crear ningún turno. Puede que los turnos seleccionados ya no estén disponibles." };

    return { success: true, turnoId: primerTurnoId, creados };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
