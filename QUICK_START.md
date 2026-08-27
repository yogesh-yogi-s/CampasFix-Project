# 🚀 CampusFix - 5 Minute Quick Start

**Current Status**: Code ready, waiting for RLS configuration  
**Time to Ready**: ~15 minutes (mostly waiting for you)

---

## ⚠️ DO THIS FIRST (BLOCKS EVERYTHING)

### Option A: Fastest (Recommended) ⚡
1. Open your Supabase dashboard: https://app.supabase.com
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy ALL content from: [`server/setup_complete.sql`](server/setup_complete.sql)
5. Paste into the SQL editor
6. Click **Run** button
7. ✅ Done! Database is ready

**This single query disables RLS and seeds everything.**

---

### OR Option B: Production-Ready
1. Get your **service_role key** from: Supabase Settings → API → Copy the "secret" key
2. Edit `server/.env` file and add:
   ```
   SUPABASE_SERVICE_ROLE_KEY=paste_your_key_here
   ```
3. Run: `cd server && npm run seed`
4. ✅ Done! Database is seeded

---

### OR Option C: Secure (Advanced)
1. Go to Supabase SQL Editor
2. Copy [`server/migrations/setup_rls_policies.sql`](server/migrations/setup_rls_policies.sql)
3. Run in SQL Editor
4. ✅ Done! RLS configured with proper policies

---

## ✅ NOW: Start the Applications

### Terminal 1: Backend
```bash
cd server
npm install          # (if not done)
npm run seed         # (if you chose Option B)


# You should see: "CampusFix Server listening on port 5000"
```

### Terminal 2: Frontend
```bash
cd client
npm install          # (if not done)
npm run dev
# Browser will open: http://localhost:3000
```

---

## 🎉 Try It Out

### As a Student:
1. Go to http://localhost:3000/register
2. Create account: `student1@test.edu` / `password123`
3. Go to http://localhost:3000/complaints/new
4. Submit a test complaint
5. See it appear in your dashboard

### As Admin:
1. Open new incognito/private tab
2. Go to http://localhost:3000/login
3. Login: `admin@campusfix.edu` / `adminpassword123`
4. Go to http://localhost:3000/admin/dashboard
5. See your student's complaint
6. Click to assign to a department
7. Watch instant notification appear to student!

---

## 📋 Run Full Tests

Once working, run the comprehensive test suite:
```bash
# See file: PHASE_9_VERIFICATION.md
# Contains 59 detailed test cases with curl commands
# ~2-3 hours to complete
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "RLS policy violation" error | You skipped step 1. Do Option A/B/C above. |
| "SUPABASE_URL not found" | Check `server/.env` has SUPABASE_URL=... |
| "Cannot create complaints" | Seed script didn't run. Do `npm run seed` |
| "Socket timeout" | Is backend running? Check port 5000 |
| Frontend won't start | Check `client/.env.local` has API_URL |

---

## 📚 Full Documentation

After you get it running:

1. **Setup Guide**: `README_DEPLOYMENT_READY.md`
2. **Test Cases**: `PHASE_9_VERIFICATION.md`
3. **Phase Status**: `task.md`
4. **Issues Found**: `VERIFICATION_FINDINGS.md`
5. **RLS Help**: `server/RLS_SETUP.md`

---

## 🎯 Next Steps After Quick Start

1. ✅ Get the app running (this guide)
2. ✅ Run basic manual tests (register, submit, assign)
3. ✅ Run full test suite (PHASE_9_VERIFICATION.md)
4. ✅ Update task.md with verification results
5. ✅ Deploy to staging
6. ✅ Deploy to production

---

## 💡 Key Credentials

After seeding, you have:

**Admin Account**:
- Email: `admin@campusfix.edu`
- Password: `adminpassword123`

**5 Pre-Seeded Departments**:
1. Hostel Maintenance & Cleanliness
2. Academic Block Infrastructure
3. IT & Wi-Fi Services
4. Campus Transportation
5. General Facilities & Utilities

---

## 🚨 What's Already Done

✅ Code is complete (Phases 1-8)  
✅ Database schema created  
✅ All 20+ API endpoints built  
✅ Real-time notifications ready  
✅ File upload handling ready  
✅ Admin dashboard ready  

**Only waiting for**: Your one-time RLS configuration (see top of this guide)

---

**Stuck?** Read `VERIFICATION_FINDINGS.md` section "Solutions Provided"  
**Questions?** All docs are in this folder  
**Ready to deploy?** See `README_DEPLOYMENT_READY.md`

Good luck! 🎉
