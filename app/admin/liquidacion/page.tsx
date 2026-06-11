import { createServiceClient } from "@/lib/supabase/service";
import LiquidacionClient from "./LiquidacionClient";

export default async function LiquidacionPage() {
  const supabase = createServiceClient();
  const [profesoresRes, preciosRes] = await Promise.all([
    supabase.from("profesores").select("id, nombre").eq("activo",true).order("nombre"),
    supabase.from("precios").select("nivel, valor_hora, porcentaje_profesor, pack_semanal_precio, pack_semanal_horas, pack_mensual_precio, pack_mensual_horas").order("nivel"),
  ]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Liquidación de Honorarios</h1>
        <p className="text-sm text-[#6b7280] font-semibold">Calculá lo que le corresponde pagar a cada profesor por la semana seleccionada.</p>
      </div>
      <LiquidacionClient
        profesores={profesoresRes.data ?? []}
        precios={(preciosRes.data ?? []) as Parameters<typeof LiquidacionClient>[0]["precios"]}
      />
    </div>
  );
}
