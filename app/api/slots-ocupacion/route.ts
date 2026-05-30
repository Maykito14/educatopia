import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = createServiceClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const desde   = today.toISOString().slice(0, 10);
  const hastaD  = new Date(today);
  hastaD.setDate(today.getDate() + 14);
  const hasta   = hastaD.toISOString().slice(0, 10);

  const { data: profs } = await supabase
    .from("profesores")
    .select("id")
    .eq("activo", true);

  const profesorIds = (profs ?? []).map((p: { id: string }) => p.id);
  if (profesorIds.length === 0) return NextResponse.json({ ocupacion: [], bloqueos: [] });

  const [ocupacionRes, bloqueosRes, preciosRes] = await Promise.all([
    supabase.rpc("get_ocupacion_slots", {
      p_profesor_ids: profesorIds,
      p_desde: desde,
      p_hasta: hasta,
    }),
    supabase
      .from("profesores_bloqueos")
      .select("profesor_id, fecha, hora_inicio, hora_fin")
      .in("profesor_id", profesorIds)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase.from("precios").select("nivel, valor_hora, pack_semanal_precio, pack_mensual_precio"),
  ]);

  type BloqueoRow = { profesor_id: string; fecha: string; hora_inicio: string | null; hora_fin: string | null };

  const bloqueos = (bloqueosRes.data ?? []).map((b: BloqueoRow) => ({
    profesor_id: b.profesor_id,
    fecha:       b.fecha,
    hora_inicio: b.hora_inicio ? b.hora_inicio.slice(0, 5) : null,
    hora_fin:    b.hora_fin    ? b.hora_fin.slice(0, 5)    : null,
  }));

  return NextResponse.json({
    ocupacion: ocupacionRes.data ?? [],
    bloqueos,
    precios:   preciosRes.data ?? [],
  });
}
