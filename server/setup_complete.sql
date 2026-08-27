-- CampusFix Complete Setup Script
-- Run this entire script in Supabase SQL Editor to get the database ready for development

-- ============================================
-- 1. DISABLE RLS FOR DEVELOPMENT
-- ============================================
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. SEED DEPARTMENTS
-- ============================================
INSERT INTO public.departments (name, description) VALUES 
  ('Hostel Maintenance & Cleanliness', 'Handles hostel rooms, bathrooms, corridors, and general cleanliness.'),
  ('Academic Block Infrastructure', 'Handles classroom benches, projector issues, laboratory equipment issues.'),
  ('IT & Wi-Fi Services', 'Handles campus Wi-Fi connectivity, computer labs, server downs.'),
  ('Campus Transportation', 'Handles college buses, routes, shuttle services.'),
  ('General Facilities & Utilities', 'Handles campus gardens, sports area, drinking water, electricity.')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. SEED ADMIN USER
-- ============================================
-- Password: adminpassword123 (hashed with bcrypt cost 12)
INSERT INTO public.users (name, email, password, role, department_id) VALUES
  ('System Admin', 'admin@campusfix.edu', '$2a$12$r9h6cIPz0gi.URNNGRH2e.qxwJ15aZ3ZN4wqM3LD3/HcafJfDQGgS', 'admin', NULL)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these SELECTs to verify the data was inserted:
-- SELECT COUNT(*) as departments_count FROM public.departments;
-- SELECT COUNT(*) as users_count FROM public.users;
-- SELECT * FROM public.users WHERE email = 'admin@campusfix.edu';
