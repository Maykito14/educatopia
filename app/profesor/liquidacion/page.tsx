import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import LiquidacionProfesorClient from "./LiquidacionProfesorClient";

export default async function LiquidacionProfesorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [profesorRes, preciosRes] = await Promise.all([
    service
      .from("profesores")
      .select("id")
      .eq("profile_id", user.id)
      .single<{ id: string }>(),
    service
      .from("precios")
      .select("nivel, valor_hora, porcentaje_profesor, pack_semanal_precio, pack_semanal_horas, pack_mensual_precio, pack_mensual_horas"),
  ]);

  if (!profesorRes.data) redirect("/profesor");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Mi Liquidación</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Detalle semanal de horas trabajadas e importes a cobrar.
        </p>
      </div>
      <LiquidacionProfesorClient
        profesorId={profesorRes.data.id}
        precios={(preciosRes.data ?? []) as Parameters<typeof LiquidacionProfesorClient>[0]["precios"]}
      />
    </div>
  );
}
