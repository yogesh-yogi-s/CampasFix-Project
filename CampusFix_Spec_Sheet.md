# Complete Specification

## Project Overview & Tech Stack

### Project Overview
Build a full-stack **College Complaint Management & Tracking Platform** called **CampusFix** that lets students report problems or complaints within their college — classrooms, laboratories, hostels, Wi-Fi, infrastructure, transportation, cleanliness, or other campus facilities — and track them through a transparent resolution pipeline. The platform must connect students to the correct department or staff member, let admins triage and assign complaints, allow status updates and resolution notes, notify students as their complaint progresses, and persist a full audit trail of every complaint from submission to closure.

### Tech Stack
**Frontend:** Next.js (App Router), React, Tailwind CSS, Zustand (or Context API), Axios, React Hook Form + Zod (form validation), lucide-react icons, Recharts (for admin analytics charts).

**Backend:** Node.js, Express, supabase, Mongoose (if needed), JSON Web Tokens, bcryptjs, express-validator, multer (file uploads), Cloudinary or local disk storage for attachments, Nodemailer (email notifications), helmet, morgan, compression, cors.

**Real-Time (bonus):** Socket.IO for live status-update notifications.

**AI Integration (bonus):** OpenRouter API or Google Generative AI SDK for AI-assisted complaint categorization, duplicate-complaint detection, and auto-generated complaint summaries.

**Deployment:** Frontend on Vercel, backend on Render/Railway, MongoDB Atlas for the database.

---

## Authentication, Complaint Submission & Complaint Lifecycle

### Authentication
The authentication system must support student registration and login, JWT-based session handling, protected routes, a `/auth/me` profile endpoint, role separation between `student` and `admin`, password hashing with bcrypt at cost factor 12, and persistent login state on the client via Zustand/localStorage token handling. Admin accounts are seeded/created separately (not via public self-registration) to prevent unauthorized admin access.

### Complaint Submission
Students must be able to submit a complaint with a category, a detailed description, the physical location of the issue (e.g. building/room/hostel block), an optional image or file attachment (max size and type validated), and an auto-assigned priority suggestion. Every complaint stores the reporting student, timestamps, current status, assigned department/staff, priority, and a full status-change history.

### Complaint Lifecycle (Status Workflow)
Every complaint moves through a fixed set of statuses:
`Submitted → Under Review → Assigned → In Progress → Resolved → Closed`
(with an optional `Reopened` transition if a student is unsatisfied with a resolution). Each status transition is logged with a timestamp, the actor who made the change, and an optional comment — forming the audit trail shown on the complaint's timeline.

### Example Workflow
Student → Submit Complaint → Admin Reviews → Assign Department/Staff → Complaint In Progress → Issue Resolved → Student Views Resolution → (optional) Student Reopens or Rates Resolution

---

## Notifications, File Handling, AI Assistance & Real-Time Layer

### Complaint Management (Admin Side)
Admins must be able to view all complaints in a searchable, filterable, sortable list (by status, category, priority, department, date range), open any complaint to see full details and history, assign a complaint to a department or specific staff member, change its status and priority, and add internal comments or resolution notes visible to the student once posted.

### File Attachments
Students can attach one or more images/files as evidence when submitting a complaint. Files are validated for type and size on both client and server, stored via Cloudinary (or local `/uploads` in dev), and referenced by URL on the Complaint document — never stored as raw binary in MongoDB.

### Notifications
When a complaint's status changes, is assigned, or receives an admin comment, the system must create a Notification record for the student and (bonus) push it in real time via Socket.IO and/or send an email via Nodemailer. A notifications bell/drawer on the student dashboard shows unread updates.

### AI-Assisted Categorization (Bonus)
When a student submits a complaint, the system may call an AI provider (OpenRouter primary, Gemini fallback, keyword-based rule engine as the final fallback when no API key is configured) to suggest a category and priority level, and to flag likely duplicate complaints already open in the same location/category. This must degrade gracefully — the platform must remain fully usable with the rule-based fallback alone.

### Real-Time Layer (Bonus)
The Socket.IO server broadcasts status-change events for a complaint to the student who filed it and to the admin dashboard, so both sides see live updates without refreshing.

---

## Frontend Pages

- **/** – Landing page introducing CampusFix, how it works, and CTA buttons to log in/register.
- **/login** – Student/admin login form with JWT handling and validation.
- **/register** – Student registration form with validation and error states.
- **/dashboard** (student) – Overview of the student's own complaints, quick "Submit New Complaint" action, status summary cards, and recent notifications.
- **/complaints/new** – Complaint submission form: category select, description, location, file upload, live preview.
- **/complaints** (student) – List/history of the student's own submitted complaints with status badges, search and filter.
- **/complaints/[id]** – Complaint details page showing description, attachments, status timeline, admin comments, and (once resolved) a resolution rating/feedback control.
- **/admin/dashboard** – Admin console: complaint volume metrics, status breakdown, department-wise stats, average resolution time (bonus analytics).
- **/admin/complaints** – Full complaint list for admins with search, filter by category/status/priority/department, bulk assignment.
- **/admin/complaints/[id]** – Admin complaint detail view: assign department/staff, change status/priority, add comments, mark resolved.
- **/settings** – Profile management, password change, notification preferences.

---

## Backend Architecture & Database Collections

### Backend Architecture
**Routes:** Handles HTTP routing, request validation via express-validator, and middleware composition (auth, role check, validation, error handler).
**Controllers:** Request parsing and response shaping only (never talks directly to MongoDB).
**Services:** Business logic ownership (complaint CRUD, status transitions, assignment logic, notification creation, AI categorization, file handling).
**Middleware:** JWT auth guard, role-based access guard (student vs admin), file-upload middleware, error handler.
**Config Layer:** Centralizes environment variables, MongoDB connection, Cloudinary/mailer/Socket.IO setup.

### Database Collections
create the tables and ask for credentials to use it on your own 
**Users:** name, email, password (`select: false`), role (`student | admin`), department (for admin/staff), lastLogin.
**Complaints:** title, description, category, location, student (ref), status (`Submitted | Under Review | Assigned | In Progress | Resolved | Closed | Reopened`), priority (`Low | Medium | High | Critical`), assignedTo (ref, department/staff), attachments (array of URLs), resolutionNote, rating, createdAt/updatedAt.
**ComplaintLogs:** complaintId, previousStatus, newStatus, changedBy, comment, timestamp — the audit trail for each complaint.
**Departments:** name, description, staff members assigned.
**Notifications:** owner, complaintId, type, title, message, isRead, createdAt.

---

## API Endpoints

### Health and Auth
- `GET /api/health` – System heartbeat and status check.
- `POST /api/auth/register` – Register a new student account.
- `POST /api/auth/login` – Authenticate user and issue JWT.
- `GET /api/auth/me` – Fetch current user profile.

### Complaints (Student)
- `POST /api/complaints` – Submit a new complaint (with file upload).
- `GET /api/complaints/mine` – List the logged-in student's complaints.
- `GET /api/complaints/:id` – Fetch complaint details and status history.
- `POST /api/complaints/:id/reopen` – Reopen a resolved complaint.
- `POST /api/complaints/:id/rate` – Submit resolution rating/feedback.

### Complaints (Admin)
- `GET /api/admin/complaints` – List all complaints with filters/pagination.
- `PUT /api/admin/complaints/:id/assign` – Assign to department/staff.
- `PUT /api/admin/complaints/:id/status` – Update status (with comment).
- `PUT /api/admin/complaints/:id/priority` – Update priority.
- `GET /api/admin/stats` – Aggregated complaint statistics for the dashboard.

### Departments & Notifications
- `GET /api/departments` – List departments (for assignment dropdowns).
- `GET /api/notifications` – List the logged-in user's notifications.
- `PUT /api/notifications/:id/read` – Mark a notification as read.

---

## Folder Structure & Development Phases

### Frontend Structure
```
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── ComplaintCard/
    │   ├── ComplaintForm/
    │   ├── StatusTimeline/
    │   ├── AdminTable/
    │   └── ProtectedRoute/
    ├── app/ (or pages/)
    │   ├── login/
    │   ├── register/
    │   ├── dashboard/
    │   ├── complaints/
    │   │   ├── new/
    │   │   ├── [id]/
    │   │   └── index.js
    │   └── admin/
    │       ├── dashboard/
    │       └── complaints/
    ├── store/
    │   └── authStore.js
    └── services/
        ├── api.js
        └── socket.js
```

### Backend Structure
```
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── complaintRoutes.js
    │   ├── adminRoutes.js
    │   └── notificationRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── complaintController.js
    │   └── adminController.js
    ├── services/
    │   ├── authService.js
    │   ├── complaintService.js
    │   ├── notificationService.js
    │   └── aiCategorizationService.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── roleMiddleware.js
    │   └── uploadMiddleware.js
    └── models/
        ├── User.js
        ├── Complaint.js
        ├── ComplaintLog.js
        ├── Department.js
        └── Notification.js
```

### Development Phases
- **Phase 1:** Project setup (Next.js, Express, MongoDB, JWT auth, role-based routing, base layout).
- **Phase 2:** Complaint submission flow — form, file upload, category/location capture, database persistence.
- **Phase 3:** Student dashboard — complaint list, complaint details page, status timeline.
- **Phase 4:** Admin dashboard — complaint list/filtering, assignment, status/priority updates, resolution notes.
- **Phase 5:** Notifications — in-app notification records, (bonus) email via Nodemailer, (bonus) Socket.IO live updates.
- **Phase 6 (bonus):** AI-assisted categorization/duplicate detection, admin analytics charts, resolution-time tracking, student feedback/rating.

---

## UI, Security, Outcome, and Codex Instructions

### UI and UX Requirements
The UI must use a clean, approachable console aesthetic with Tailwind, be fully responsive/mobile-friendly, include loading states and skeleton loaders, show color-coded status badges (Submitted/Under Review/Assigned/In Progress/Resolved/Closed), render a clear status timeline on the complaint detail page, and provide a notifications drawer/bell accessible from the shell.

### Security Requirements
The application must hash passwords with bcrypt at cost 12, sign and verify JWTs with `JWT_SECRET`, restrict admin-only routes with role-based middleware, validate every request body with express-validator, validate uploaded file types/sizes server-side (never trust client-side checks alone), set HTTP security headers via helmet, apply CORS limited to the client origin, rate-limit auth endpoints, and ensure students can only view/modify their own complaints (never another student's).

### Final Expected Outcome
The completed platform must let a student describe a campus issue, submit it with evidence, watch it move through review and assignment, see admin updates and resolution notes in real time, rate the resolution, and trust that nothing gets lost — all backed by a full audit trail in MongoDB. The final application should feel like a modern, trustworthy campus helpdesk — meaningfully more useful than a form-only "tutorial" complaint box, with real workflow logic, role separation, and (where implemented) AI-assisted triage.

### Codex & AI Agent Implementation Instructions
The AI coding agent must build the application phase by phase, follow the folder structure strictly, keep controllers thin and push logic into services, never call Mongo directly from a controller, never trust client-supplied status transitions without server-side validation of the allowed workflow order, treat every secret as `process.env`, validate file uploads on both ends, write one ComplaintLog entry per status/assignment change, emit a Socket.IO event for every status change if real-time is implemented, and report the list of files created or changed at the end of every phase.
