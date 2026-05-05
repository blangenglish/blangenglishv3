
-- ============================================================
-- FIX RLS: Permitir lectura de units y courses a todos
-- ============================================================

-- 1. UNITS: disable RLS OR add public read policy
ALTER TABLE units DISABLE ROW LEVEL SECURITY;

-- 2. COURSES: ensure public read works (already worked via anon test but let's be sure)
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 3. Also fix unit_stage_materials and unit_stage_quizzes to be fully readable
-- (we already did this but let's ensure)
ALTER TABLE unit_stage_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE unit_stage_quizzes DISABLE ROW LEVEL SECURITY;

-- 4. unit_progress: keep RLS but ensure authenticated can manage their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'unit_progress' AND policyname = 'students_manage_own_progress'
  ) THEN
    -- Drop all existing policies first
    DROP POLICY IF EXISTS "allow_all_progress" ON unit_progress;
    DROP POLICY IF EXISTS "students_own_progress" ON unit_progress;
    -- Create proper policy
    CREATE POLICY "students_manage_own_progress" ON unit_progress
      FOR ALL TO authenticated
      USING (student_id = auth.uid())
      WITH CHECK (student_id = auth.uid());
  END IF;
END $$;

-- Verify
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('units', 'courses', 'unit_stage_materials', 'unit_stage_quizzes', 'unit_progress')
ORDER BY tablename;

-- Count units
SELECT COUNT(*) as units_count FROM units;
SELECT COUNT(*) as published_units FROM units WHERE is_published = true;
