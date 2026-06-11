-- Especialidad: campo requerido para turnos de nivel secundario.
-- Vinculado al colegio (cada institución habilita ciertas especialidades).
ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS especialidad TEXT;

-- Actualizar get_ocupacion_slots para incluir especialidad en los grupos
-- (permite detectar en el formulario si un slot ya tiene un grupo con la misma
--  materia + anio + colegio + especialidad)
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
        jsonb_build_object(
          'materia', t.materia,
          'anio', t.anio,
          'colegio', t.colegio,
          'especialidad', t.especialidad
        )
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
