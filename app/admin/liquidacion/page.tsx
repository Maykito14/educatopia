import { createServiceClient } from "@/lib/supabase/service";
import LiquidacionClient from "./LiquidacionClient";

export default async function LiquidacionPage() {
  const supabase = createServiceClient();
  const [profesoresRes, preciosRes] = await Promise.all([
    supabase.from("profesores").select("id, nombre").eq("activo",true).order("nombre"),
    supabase.from("precios").select("nivel, valor_hora, porcentaje_profesor").order("nivel"),
  ]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Liquidación de Honorarios</h1>
        <p className="text-sm text-[#6b7280] font-semibold">Calculá lo que le corresponde pagar a cada profesor por la semana seleccionada.</p>
      </div>
      <LiquidacionClient
        profesores={profesoresRes.data ?? []}
        precios={(preciosRes.data ?? []) as { nivel: string; valor_hora: number; porcentaje_profesor: number }[]}
      />
    </div>
  );
}
