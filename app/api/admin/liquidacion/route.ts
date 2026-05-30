import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const profesorId = searchParams.get("profesor");
  const desde      = searchParams.get("desde");
  const hasta      = searchParams.get("hasta");
  if (!profesorId || !desde || !hasta) return NextResponse.json([]);

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("turnos")
    .select(`
      id, materia, anio, colegio, pagado,
      slot:slots!inner(fecha, hora_inicio, hora_fin, duracion_minutos, profesor_id),
      alumno:alumnos(nombre, apellido, nivel_educativo)
    `)
    .eq("asistio", true)
    .eq("slot.profesor_id", profesorId)
    .gte("slot.fecha", desde)
    .lte("slot.fecha", hasta)
    .neq("estado", "cancelado")
    .order("slot(fecha)");

  return NextResponse.json(data ?? []);
}
