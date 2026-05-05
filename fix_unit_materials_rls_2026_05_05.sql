-- Ensure unit_stage_materials is readable by authenticated users (students)
ALTER TABLE unit_stage_materials ENABLE ROW LEVEL SECURITY;

-- Drop old policies if any
DROP POLICY IF EXISTS "Students can read published materials" ON unit_stage_materials;
DROP POLICY IF EXISTS "Allow read for all" ON unit_stage_materials;
DROP POLICY IF EXISTS "Public read" ON unit_stage_materials;

-- Allow anyone authenticated (or even anon) to read published materials
CREATE POLICY "Anyone can read published materials"
  ON unit_stage_materials
  FOR SELECT
  USING (is_published = true OR is_published IS NULL);

-- Confirm unit_progress is also accessible
ALTER TABLE unit_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own progress" ON unit_progress;
CREATE POLICY "Students manage own progress"
  ON unit_progress
  FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- unit_stage_quizzes: readable by all
ALTER TABLE unit_stage_quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read quizzes" ON unit_stage_quizzes;
CREATE POLICY "Anyone can read quizzes"
  ON unit_stage_quizzes
  FOR SELECT
  USING (true);