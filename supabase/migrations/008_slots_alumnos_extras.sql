-- ============================================================
-- Educatopia — Slots: unique constraint para upsert
--              Alumnos: columnas nombre_contacto y origen
-- ============================================================

-- Permite hacer UPSERT de slots al momento de reservar un turno.
-- El slot queda identificado de forma única por profesor + fecha + hora + duración.
ALTER TABLE public.slots
  ADD CONSTRAINT slots_unique_booking
  UNIQUE (profesor_id, fecha, hora_inicio, duracion_minutos);

-- Datos del responsable del alumno (padre/tutor) y canal de origen
ALTER TABLE public.alumnos
  ADD COLUMN IF NOT EXISTS nombre_contacto TEXT,
  ADD COLUMN IF NOT EXISTS origen          TEXT;

-- Función pública: devuelve ocupación de slots sin exponer datos personales.
-- SECURITY DEFINER omite RLS → seguro para llamar con la anon key.
CREATE OR REPLACE FUNCTION public.get_ocupacion_slots(
  p_profesor_ids UUID[],
  p_desde        DATE DEFAULT CURRENT_DATE,
  p_hasta        DATE DEFAULT CURRENT_DATE + INTERVAL '14 days'
)
RETURNS TABLE (
  profesor_id      UUID,
  fecha            DATE,
  hora_inicio      TIME,
  duracion_minutos INT,
  ocupados         BIGINT,
  grupos           JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.profesor_id,
    s.fecha,
    s.hora_inicio,
    s.duracion_minutos,
    COUNT(t.id)                                                    AS ocupados,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('materia', t.materia, 'anio', t.anio, 'colegio', t.colegio)
      ) FILTER (WHERE t.id IS NOT NULL AND t.estado != 'cancelado'),
      '[]'::jsonb
    )                                                              AS grupos
  FROM public.slots s
  LEFT JOIN public.turnos t
         ON t.slot_id = s.id AND t.estado != 'cancelado'
  WHERE s.profesor_id = ANY(p_profesor_ids)
    AND s.fecha BETWEEN p_desde AND p_hasta
  GROUP BY s.profesor_id, s.fecha, s.hora_inicio, s.duracion_minutos;
$$;
