# CampusFix Complaint Management & Tracking Platform

CampusFix is a full-stack college complaint management and tracking platform where students can file issues (with optional file attachments), track status through a timeline pipeline, and receive real-time notifications, while admins can triage, change priorities, and assign complaints to departments.

---

## Technical Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Zustand, Axios, React Hook Form, Zod, and Lucide React.
- **Backend**: Node.js/Express, JWT authentication, and Supabase client (@supabase/supabase-js) as the database.
- **Real-Time Notification System**: Socket.IO.
- **Auto-Categorization & Duplicate Detection**: Keyword Analyzer & Location-Matcher Engine.

---

## Directory Structure
```
PROJECT DOC FOLD/
├── client/                     # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                # Next.js App Router (login, register, dashboard, complaints)
│   │   ├── components/         # Shared components (AppShell, ProtectedRoute, StatusTimeline)
│   │   ├── services/           # Api client (Axios) and Socket.IO client
│   │   └── store/              # Zustand Auth Store
│   ├── package.json
│   └── tailwind.config.js
└── server/                     # Node.js Express Backend API
    ├── src/
    │   ├── config/             # DB & Socket connection helpers
    │   ├── controllers/        # Express Route Handlers (auth, complaints, admin)
    │   ├── middlewares/        # Authentication & Role Validations
    │   ├── routes/             # App Routing mounts
    │   └── services/           # Business Logic layer (complaints, notification, categorization)
    ├── uploads/                # Temporary local directory for file uploads
    └── package.json
```

---

## Step 1: Database Setup (Supabase)
Instead of a local PostgreSQL database, CampusFix uses **Supabase**. 

1. Go to [Supabase](https://supabase.com/) and create a free project.
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Click "New Query" and paste the following database SQL script to initialize table mappings and triggers:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened')),
  priority TEXT NOT NULL DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assigned_to UUID REFERENCES departments(id) ON DELETE SET NULL,
  attachments TEXT[] DEFAULT '{}',
  resolution_note TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Complaint Logs (Audit Trail) Table
CREATE TABLE IF NOT EXISTS complaint_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

4. Click **Run** to execute the script and build the database tables.

---

## Step 2: Server Setup & Configuration

1. Open your terminal at `server/`.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `server/` directory:
   ```env
   PORT=5000
   JWT_SECRET=campusfix_secret_token_123!
   
   # Retrieve these values from your Supabase Project Settings -> API
   SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
   SUPABASE_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
   ```
4. Seeding the initial administrative user & departments:
   A CLI seed script is available to auto-create standard departments and a pre-configured administrator. Run:
   ```bash
   node src/config/seed.js
   ```
   *This output will print the admin email and password. Save these credentials to log in as admin!*

5. Start the server (development mode with hot reloading):
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

---

## Step 3: Client Setup & Configuration

1. Open your terminal at `client/`.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root of the `client/` directory:
   ```env
   # API endpoints routing
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```
4. Start the frontend Next.js server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## Step 4: Verification of Integration Workflow

### 1. Student Portal Registration & Submission
1. Navigate to `http://localhost:3000/register`.
2. Fill out detailed name, email, and password (e.g. `student@campusfix.edu`).
3. Log in via `http://localhost:3000/login`.
4. Click **Report Issue** and add a description containing keywords such as:
   - *"Wi-Fi router in the library is disconnect because of wiring"* => triggers auto-categorization into **IT & Wi-Fi Services** panel.
   - *"water leak in hostel room ceiling"* => flags status to **Hostel Maintenance & Cleanliness** and sets threat level suggestion to **Critical**.
5. Log a file attachment. Submit.

### 2. Admin Assignment & Progress
1. Open a separate incog / session tab and log in as the Administrator (credentials printed during `seed.js`).
2. Go to the dashboard metric panel to view active tickets load bars.
3. Click the submitted ticket to enter details.
4. Select a **Department Target** (e.g., Hostels / IT) and set **Priority** to critical.
5. In the **Pipeline Status** select box, choose **Under Review** or **In Progress**, add a log comment (e.g. *"Electrician dispatched to check wires"*), and submit.
6. The Student session will instantly receive a notification badge update and see the update on their ticket audit timeline!

### 3. Resolution Feedback
1. As admin, set status to **Resolved** and register a response note (e.g., *"Replaced faulty ceiling pipeline segment."*).
2. As student, visit the ticket detail view. The **Satisfaction Survey** will appear.
3. Select rating stars to finalize resolution.
4. If the leak continues, click **Reopen Complaint** to restore it to the active pipeline queues.
