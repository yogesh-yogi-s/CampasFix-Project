# CampusFix

CampusFix is a full-stack college complaint management and tracking platform. Students can report campus issues, follow their progress, and receive updates. Administrators can review, assign, and resolve complaints from one dashboard.

## Problem Statement

Campus issues such as broken facilities, network outages, and hostel maintenance problems are often reported through informal channels. This makes it difficult for students to know whether their issue has been received or resolved, and difficult for administrators to manage priorities.

CampusFix creates one transparent workflow for reporting, assigning, tracking, and resolving campus complaints.

## Features

### Core features

- Student registration and login with JWT authentication
- Create complaints with title, description, location, category, priority, and optional attachment
- View personal complaint history and a detailed status timeline
- Automatic category and priority suggestions based on complaint content
- Duplicate-complaint detection using category and location
- Admin dashboard for viewing, filtering, assigning, and updating complaints
- Complaint lifecycle: Submitted → Under Review → Assigned → In Progress → Resolved → Closed
- Resolution feedback: students can rate a resolved complaint or reopen it
- In-app and real-time Socket.IO notifications
- Audit trail for complaint status changes

### Bonus features

- Responsive console-style user interface
- Department-wise assignment and reporting
- Admin analytics for complaint status, categories, priorities, and resolution time
- File upload validation for supported attachments

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Frontend libraries | Axios, Zustand, React Hook Form, Zod, Lucide React, Recharts |
| Backend | Node.js, Express 5 |
| Database | Supabase PostgreSQL |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Real-time | Socket.IO |
| Validation and uploads | express-validator, Multer |
| Hosting | Vercel (frontend), Render (backend) |

## Screenshots

Open the live application to view the main screens:

| Screen | Link |
| --- | --- |
| Landing page | [Open CampusFix](https://campas-fix-project.vercel.app/) |
| Create account | [Open registration](https://campas-fix-project.vercel.app/register) |
| Sign in | [Open login](https://campas-fix-project.vercel.app/login) |

> Add exported screenshots to `docs/screenshots/` and replace the links above with Markdown image links before a final project submission.

## Live Demo

[https://campas-fix-project.vercel.app](https://campas-fix-project.vercel.app)

## Backend

API base URL: [https://campasfix-project.onrender.com/api](https://campasfix-project.onrender.com/api)

Health check: [https://campasfix-project.onrender.com/api/health](https://campasfix-project.onrender.com/api/health)

## Setup Instructions

### Prerequisites

- Node.js 18 or later
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/yogesh-yogi-s/CampasFix-Project.git
cd CampasFix-Project
```

### 2. Configure Supabase

In the Supabase SQL Editor, run the SQL files in this order:

1. `server/setup_complete.sql` for an initial development setup, or
2. `server/migrations/setup_rls_policies.sql` for row-level-security policies.

### 3. Start the backend

```bash
cd server
npm install
copy .env.example .env
# Fill the required values in .env
npm run seed
npm run dev
```

The API starts at `http://localhost:5000`.

### 4. Start the frontend

Open another terminal:

```bash
cd client
npm install
copy .env.example .env.local
# Fill the required values in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create local environment files from the included examples. Never commit the resulting `.env` or `.env.local` files.

### Backend: `server/.env`

```text
PORT
JWT_SECRET
CLIENT_ORIGIN
SUPABASE_URL
SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY
```

### Frontend: `client/.env.local`

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SOCKET_URL
NEXT_PUBLIC_UPLOADS_URL
```

### Production configuration

| Platform | Required setting |
| --- | --- |
| Vercel | `NEXT_PUBLIC_API_URL=https://campasfix-project.onrender.com/api` |
| Render | `CLIENT_ORIGIN=https://campas-fix-project.vercel.app` |

Do not commit API keys, passwords, OAuth secrets, access tokens, Supabase service-role keys, or any other sensitive credentials to GitHub.

## Project Structure

```text
client/                    Next.js frontend
server/                    Express API
server/migrations/         Supabase SQL policies
server/setup_complete.sql  Initial Supabase setup script
```
