-- Tipo de pedido por turno: suelto (hora suelta), pack_semanal o pack_mensual
ALTER TABLE turnos
ADD COLUMN IF NOT EXISTS tipo_pedido TEXT NOT NULL DEFAULT 'suelto'
  CHECK (tipo_pedido IN ('suelto', 'pack_semanal', 'pack_mensual'));
