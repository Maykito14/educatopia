"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function marcarPagados(turnoIds: string[]) {
  if (turnoIds.length === 0) return;
  const supabase = createServiceClient();
  await supabase.from("turnos").update({ pagado: true }).in("id", turnoIds);
  revalidatePath("/admin/liquidacion");
  revalidatePath("/admin");
}
