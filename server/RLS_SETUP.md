# CampusFix Supabase Setup - RLS Configuration

## Issue: Row-Level Security (RLS) Blocking Seed Operations

The seed script is failing because Supabase has Table RLS (Row-Level Security) policies enabled, which restrict the anon key from inserting data. 

## Solution: Choose One of the Following

### Option 1: Disable RLS for Development (Recommended for Development)

1. Go to your [Supabase Project Dashboard](https://app.supabase.com)
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the following SQL and click **Run**:

```sql
-- Disable RLS on all tables for development
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
```

After running this, proceed to seed the database.

### Option 2: Use Service Role Key for Seeding

1. Go to your [Supabase Project Settings](https://app.supabase.com/project/_/settings/api)
2. Under **API Keys**, copy the **service_role** key (the secret key ending with `-new`)
3. Add it to your `.env` file:
   ```env
   SUPABASE_URL=your_service_role_key_here
   SUPABASE_KEY=your_service_role_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
4. The seed script will automatically use the service role key if available.

### Option 3: Set Up RLS Policies

Run the SQL policies in `server/migrations/setup_rls_policies.sql` via the Supabase SQL Editor to configure proper RLS while allowing app operations.

## After Fixing RLS

Once RLS is configured (either disabled for dev or service role key set), run:

```bash
cd server
node src/seed.js
```

You should see output like:
```
Starting Database Seeding...
Seeding Department: Hostel Maintenance & Cleanliness
Seeding Department: Academic Block Infrastructure
...
Seeding Admin User: admin@campusfix.edu / password: adminpassword123
Database Seeding Completed Successfully!
```

Save the admin credentials!

## Findings

**Phase 2+ Issue #1: RLS Configuration** ✗ BLOCKED
- Files written but never tested against live Supabase
- Anon key blocked from inserting data due to RLS
- Seed script fails immediately
- Status: BLOCKER - FIX REQUIRED
