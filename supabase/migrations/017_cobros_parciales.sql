-- Cobros parciales y saldo a favor
--
-- monto_cobrado: importe efectivamente recibido por ese turno.
--   NULL  = aún no se registró ningún cobro
--   > 0   = pago parcial (cobrado sigue en false hasta cubrir el costo total)
--   >= costo_turno → cobrado = true (lo actualiza el backend)
--
-- saldo_a_favor: crédito acumulado del alumno.
--   Se incrementa cuando monto_cobrado > costo_turno.
--   Se puede aplicar a futuros turnos.

ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS monto_cobrado NUMERIC;

ALTER TABLE public.alumnos
  ADD COLUMN IF NOT EXISTS saldo_a_favor NUMERIC NOT NULL DEFAULT 0;

-- Función atómica para sumar/restar al saldo_a_favor
-- (p_monto positivo = agregar crédito, negativo = consumir crédito)
CREATE OR REPLACE FUNCTION public.incrementar_saldo_a_favor(
  p_alumno_id UUID,
  p_monto     NUMERIC
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.alumnos
  SET saldo_a_favor = GREATEST(0, saldo_a_favor + p_monto)
  WHERE id = p_alumno_id;
$$;
