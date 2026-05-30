-- Agregar columna medio_cobro a turnos
ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS medio_cobro TEXT CHECK (medio_cobro IN ('efectivo', 'transferencia'));
