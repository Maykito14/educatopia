"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export type PrecioInput = {
  nivel: string;
  valor_hora: number;
  porcentaje_profesor: number;
  pack_semanal_precio: number | null;
  pack_mensual_precio: number | null;
  pack_horas_semana: number | null;
  pack_horas_mes: number | null;
};

export async function guardarPrecios(data: PrecioInput[]) {
  const supabase = createServiceClient();
  for (const p of data) {
    await supabase.from("precios").upsert(
      { ...p, updated_at: new Date().toISOString() },
      { onConflict: "nivel" }
    );
  }
  revalidatePath("/admin/precios");
  revalidatePath("/admin/liquidacion");
  revalidatePath("/admin/cobranzas");
}
