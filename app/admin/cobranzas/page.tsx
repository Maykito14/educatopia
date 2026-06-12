import { createServiceClient } from "@/lib/supabase/service";
import CobranzasClient from "./CobranzasClient";

export default async function CobranzasPage() {
  const supabase = createServiceClient();
  const [turnosRes, preciosRes] = await Promise.all([
    supabase.from("turnos").select(`
      id, materia, anio, cobrado, tipo_pedido, monto_cobrado,
      slot:slots(fecha, duracion_minutos),
      alumno:alumnos(id, nombre, apellido, nivel_educativo, telefono_contacto, saldo_a_favor)
    `).eq("asistio",true).eq("cobrado",false).neq("estado","cancelado").order("created_at"),
    supabase.from("precios").select("nivel, valor_hora, pack_semanal_precio, pack_semanal_horas, pack_mensual_precio, pack_mensual_horas"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Cobranzas Pendientes</h1>
        <p className="text-sm text-[#6b7280] font-semibold">Turnos asistidos aún no cobrados, agrupados por alumno.</p>
      </div>
      <CobranzasClient
        turnos={(turnosRes.data??[]) as unknown as Parameters<typeof CobranzasClient>[0]["turnos"]}
        precios={(preciosRes.data??[]) as Parameters<typeof CobranzasClient>[0]["precios"]}
      />
    </div>
  );
}
