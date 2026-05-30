"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function guardarMaterias(materiaIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión" };

  const { data: profesor } = await supabase
    .from("profesores")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!profesor) return { error: "Sin perfil de profesor" };

  const service = createServiceClient();

  // Borrar todas las relaciones actuales y re-insertar las seleccionadas
  await service.from("profesores_materias").delete().eq("profesor_id", profesor.id);

  if (materiaIds.length > 0) {
    await service.from("profesores_materias").insert(
      materiaIds.map(mid => ({ profesor_id: profesor.id, materia_id: mid }))
    );
  }

  // Actualizar el array de materias en la tabla profesores (campo legacy)
  const { data: materiasData } = await service
    .from("materias")
    .select("nombre")
    .in("id", materiaIds);
  const nombres = [...new Set((materiasData ?? []).map((m: { nombre: string }) => m.nombre))];
  await service.from("profesores").update({ materias: nombres }).eq("id", profesor.id);

  revalidatePath("/profesor/materias");
  revalidatePath("/profesor");
  return { success: true };
}
