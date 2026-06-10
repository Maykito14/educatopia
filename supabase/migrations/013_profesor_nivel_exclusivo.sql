-- Restricciones de profesor por nivel y alumno
-- Un profesor con filas aquí SOLO puede atender a esos alumnos para ese nivel
CREATE TABLE IF NOT EXISTS profesor_nivel_exclusivo (
  profesor_id UUID NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  nivel       TEXT NOT NULL CHECK (nivel IN ('primario','secundario','terciario','taller')),
  alumno_id   UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  PRIMARY KEY (profesor_id, nivel, alumno_id)
);

-- Señoandrea (b07c610f-2599-45cc-9894-051be20bf024) solo atiende secundario
-- a González Agustín (86d3bb71-9237-4364-892b-4708096b119d)
INSERT INTO profesor_nivel_exclusivo (profesor_id, nivel, alumno_id)
VALUES (
  'b07c610f-2599-45cc-9894-051be20bf024',
  'secundario',
  '86d3bb71-9237-4364-892b-4708096b119d'
)
ON CONFLICT DO NOTHING;

-- Ledesma Jorgelina: agregar cuando sea registrada en el sistema con:
-- INSERT INTO profesor_nivel_exclusivo (profesor_id, nivel, alumno_id)
-- VALUES ('b07c610f-2599-45cc-9894-051be20bf024', 'secundario', '<uuid_ledesma>');

-- Evitar alumnos duplicados con mismo nombre+apellido+DNI
CREATE UNIQUE INDEX IF NOT EXISTS alumnos_unique_nombre_apellido_dni
ON alumnos (LOWER(TRIM(nombre)), LOWER(TRIM(apellido)), dni)
WHERE dni IS NOT NULL;
