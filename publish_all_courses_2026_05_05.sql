
-- Publicar todos los cursos
UPDATE public.courses SET is_published = true;

-- También publicar todas las unidades
UPDATE public.units SET is_published = true WHERE is_published = false OR is_published IS NULL;

-- Verificar
SELECT id, title, level, is_published FROM courses ORDER BY level;
SELECT COUNT(*) as total_units, COUNT(*) FILTER (WHERE is_published = true) as published_units FROM units;
