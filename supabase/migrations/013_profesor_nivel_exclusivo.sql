-- Restricciones de profesor por nivel y alumno
-- Un profesor con filas aquí SOLO puede atender a esos alumnos para ese nivel
CREATE TABLE IF NOT EXISTS profesor_nivel_exclusivo (
  profesor_id UUID NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  nivel       TEXT NOT NULL CHECK (nivel IN ('primario','secundario','terciario','taller')),
  alumno_id   UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  PRIMARY KEY (profesor_id, nivel, alumno_id)
);

-- Ejemplo: insertar la restricción de Señoandrea para Ledesma y González
-- Reemplazar los UUIDs con los valores reales de la base de datos
--
-- INSERT INTO profesor_nivel_exclusivo (profesor_id, nivel, alumno_id)
-- VALUES
--   ('<uuid_señoandrea>', 'secundario', '<uuid_ledesma>'),
--   ('<uuid_señoandrea>', 'secundario', '<uuid_gonzalez>');
