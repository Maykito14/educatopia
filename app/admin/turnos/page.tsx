import { createServiceClient } from "@/lib/supabase/service";
import TurnosAdminClient from "./TurnosAdminClient";

export default async function TurnosAdminPage() {
  const supabase = createServiceClient();

  const [turnosRes, profesoresRes, preciosRes] = await Promise.all([
    supabase.from("turnos").select(`
      id, created_at, solicitado_por, materia, anio, colegio, estado, tipo_pedido,
      confirmado_por_profesor, asistio, pagado, cobrado, medio_cobro,
      slot:slots(id, fecha, hora_inicio, hora_fin, duracion_minutos, profesor_id),
      alumno:alumnos(nombre, apellido, nivel_educativo)
    `).order("created_at", { ascending: false }),
    supabase.from("profesores").select("id, nombre").eq("activo",true).order("nombre"),
    supabase.from("precios").select("nivel, valor_hora, pack_semanal_precio, pack_semanal_horas, pack_mensual_precio, pack_mensual_horas"),
  ]);

  // Resolver nombre del creador para cada turno
  const solicitadoPorIds = [
    ...new Set(
      (turnosRes.data ?? [])
        .map((t: { solicitado_por?: string | null }) => t.solicitado_por)
        .filter((id): id is string => !!id)
    ),
  ];
  const profilesRes = solicitadoPorIds.length > 0
    ? await supabase.from("profiles").select("id, nombre, rol").in("id", solicitadoPorIds)
    : { data: [] as { id: string; nombre: string; rol: string }[] };
  const profilesMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));

  type RawTurno = {
    id: string; created_at: string | null; solicitado_por: string | null;
    materia: string; anio: string; colegio: string; estado: string;
    tipo_pedido: string | null;
    confirmado_por_profesor: boolean; asistio: boolean | null;
    pagado: boolean; cobrado: boolean; medio_cobro: "efectivo" | "transferencia" | null;
    slot: { id: string; fecha: string; hora_inicio: string; hora_fin: string; duracion_minutos: number; profesor_id: string } | null;
    alumno: { nombre: string; apellido: string; nivel_educativo: string | null } | null;
  };

  const turnos = ((turnosRes.data ?? []) as unknown as RawTurno[]).map(t => {
    const creadorProfile = t.solicitado_por ? profilesMap.get(t.solicitado_por) : undefined;
    const creador = creadorProfile && (creadorProfile.rol === "profesor" || creadorProfile.rol === "admin")
      ? { nombre: creadorProfile.nombre, rol: creadorProfile.rol }
      : null;
    return { ...t, creador };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Administración de Turnos</h1>
        <p className="text-sm text-[#6b7280] font-semibold">Editá el estado, duración y registros de cada turno.</p>
      </div>
      <TurnosAdminClient
        turnos={turnos as unknown as Parameters<typeof TurnosAdminClient>[0]["turnos"]}
        profesores={profesoresRes.data ?? []}
        precios={(preciosRes.data ?? []) as Parameters<typeof TurnosAdminClient>[0]["precios"]}
      />
    </div>
  );
}
