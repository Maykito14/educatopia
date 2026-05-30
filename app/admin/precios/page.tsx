import { createServiceClient } from "@/lib/supabase/service";
import PreciosClient from "./PreciosClient";

export default async function PreciosPage() {
  const { data } = await createServiceClient()
    .from("precios")
    .select("nivel, valor_hora, porcentaje_profesor, pack_semanal_precio, pack_mensual_precio, pack_horas_semana, pack_horas_mes")
    .order("nivel");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Configuración de Precios</h1>
        <p className="text-sm text-[#6b7280] font-semibold">Establecé el valor por hora, el porcentaje para el profesor y los precios de packs por nivel.</p>
      </div>
      <PreciosClient initialPrecios={data ?? []} />
    </div>
  );
}
