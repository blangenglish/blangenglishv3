
-- Check units table data
SELECT COUNT(*) as total_units FROM units;

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'units';

-- Check existing policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'units';

-- Sample data
SELECT id, title, course_id, is_published, sort_order FROM units LIMIT 10;
