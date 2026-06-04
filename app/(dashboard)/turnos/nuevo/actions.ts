"use server";

import { createServiceClient } from "@/lib/supabase/service";

export type AlumnoDNIResult = {
  id: string;
  nombre: string;
  apellido: string;
} | null;

/** Busca un alumno por DNI. Devuelve {id, nombre, apellido} o null. */
export async function buscarAlumnoPorDNI(dni: string): Promise<AlumnoDNIResult> {
  const clean = dni.trim();
  if (!clean) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido")
    .eq("dni", clean)
    .limit(1)
    .maybeSingle<{ id: string; nombre: string; apellido: string }>();
  return data ?? null;
}
