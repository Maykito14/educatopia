-- Horas totales que cubre cada tipo de pack, por nivel
-- Necesario para calcular: precio_por_turno = (pack_precio / pack_horas) × turno_horas
ALTER TABLE precios
  ADD COLUMN IF NOT EXISTS pack_semanal_horas NUMERIC DEFAULT 3,
  ADD COLUMN IF NOT EXISTS pack_mensual_horas NUMERIC DEFAULT 6;
