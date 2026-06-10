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

  const [ocupacionRes, bloqueosRes, preciosRes, restriccionesRes] = await Promise.all([
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
    supabase
      .from("profesor_nivel_exclusivo")
      .select("profesor_id, nivel, alumno:alumnos(id, nombre, apellido)"),
  ]);

  type BloqueoRow = { profesor_id: string; fecha: string; hora_inicio: string | null; hora_fin: string | null };
  type RestriccionRow = { profesor_id: string; nivel: string; alumno: { id: string; nombre: string; apellido: string } | null };

  const bloqueos = (bloqueosRes.data ?? []).map((b: BloqueoRow) => ({
    profesor_id: b.profesor_id,
    fecha:       b.fecha,
    hora_inicio: b.hora_inicio ? b.hora_inicio.slice(0, 5) : null,
    hora_fin:    b.hora_fin    ? b.hora_fin.slice(0, 5)    : null,
  }));

  // Agrupar restricciones por profesorId+nivel
  const restriccionesMap = new Map<string, { nivel: string; alumnos: { id: string; nombre: string; apellido: string }[] }>();
  for (const row of (restriccionesRes.data ?? []) as unknown as RestriccionRow[]) {
    if (!row.alumno) continue;
    const key = `${row.profesor_id}|${row.nivel}`;
    if (!restriccionesMap.has(key)) restriccionesMap.set(key, { nivel: row.nivel, alumnos: [] });
    restriccionesMap.get(key)!.alumnos.push(row.alumno);
  }
  const restricciones = Array.from(restriccionesMap.entries()).map(([key, val]) => ({
    profesorId: key.split("|")[0],
    nivel:      val.nivel,
    alumnos:    val.alumnos,
  }));

  return NextResponse.json({
    ocupacion:    ocupacionRes.data ?? [],
    bloqueos,
    precios:      preciosRes.data ?? [],
    restricciones,
  });
}
