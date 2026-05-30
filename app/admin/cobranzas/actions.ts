"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function marcarCobrados(turnoIds: string[]) {
  if (turnoIds.length === 0) return;
  await createServiceClient().from("turnos").update({ cobrado: true }).in("id", turnoIds);
  revalidatePath("/admin/cobranzas");
  revalidatePath("/admin");
}
