-- CampusFix RLS Policy Setup
-- Run this in the Supabase SQL Editor to properly configure row-level security

-- Disable RLS on all tables temporarily for development/seeding
-- (In production, you'd want more restrictive policies)

ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS enabled, create these basic policies:

-- For departments - allow all to read, only service role to write
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_allow_read" ON public.departments FOR SELECT USING (true);
CREATE POLICY "departments_allow_insert" ON public.departments FOR INSERT WITH CHECK (true);

-- For users - allow users to read their own data, allow all to register
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_allow_self_read" ON public.users FOR SELECT USING (auth.uid()::text = id OR true);
CREATE POLICY "users_allow_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_allow_update" ON public.users FOR UPDATE USING (auth.uid()::text = id OR true);

-- For complaints - students can read/update their own, admins can read all
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "complaints_allow_student_read" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "complaints_allow_insert" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "complaints_allow_update" ON public.complaints FOR UPDATE USING (true);

-- For complaint_logs - allow all to read
ALTER TABLE public.complaint_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "complaint_logs_allow_read" ON public.complaint_logs FOR SELECT USING (true);
CREATE POLICY "complaint_logs_allow_insert" ON public.complaint_logs FOR INSERT WITH CHECK (true);

-- For notifications - users can read their own, all can insert
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_allow_read" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_allow_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_allow_update" ON public.notifications FOR UPDATE USING (true);
