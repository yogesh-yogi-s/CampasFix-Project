# Phase 9: End-to-End Verification & Testing Script

**Status**: In Progress  
**Purpose**: Verify that Phases 2-8 work correctly end-to-end against live Supabase  
**Prerequisites**: RLS configuration fixed (see server/RLS_SETUP.md)

---

## Pre-Testing Checklist

Before running these tests, ensure:

- [ ] RLS is fixed (disabled for dev OR service role key added)
- [ ] Run `cd server && npm run seed` (successfully completes)
- [ ] Database has departmentsseeded
- [ ] Admin user created: `admin@campusfix.edu` / `adminpassword123`
- [ ] Server running: `npm run dev` (listens on port 5000)
- [ ] Client running: `npm run dev` (listens on port 3000)
- [ ] `.env` files configured correctly

---

## Test Execution Plan

### TEST SUITE A: Authentication (Phase 1)

#### Test A1: Health Check
```bash
# Run this in your terminal or Postman
curl http://localhost:5000/api/health

# Expected response:
# { "status": "OK", "timestamp": "2026-08-27T..." }
```
**Status**: [ ] PASS [ ] FAIL

#### Test A2: Student Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Student",
    "email": "student@test.edu",
    "password": "password123"
  }'

# Expected response (201):
# {
#   "message": "Student registration successful",
#   "user": { "id": "...", "name": "John Student", "email": "student@test.edu", "role": "student" }
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Save**: Note the returned user ID for later tests

#### Test A3: Student Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.edu",
    "password": "password123"
  }'

# Expected response (200):
# {
#   "message": "Login successful",
#   "user": { "id": "...", "name": "John Student", "email": "student@test.edu" },
#   "token": "eyJhbGc..." (JWT token)
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Save**: Save the JWT token as $STUDENT_TOKEN for protected endpoints

#### Test A4: Get Profile (Protected Route)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected response (200):
# { "user": { "id": "...", "name": "John Student", ... } }
```
**Status**: [ ] PASS [ ] FAIL

#### Test A5: Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@campusfix.edu",
    "password": "adminpassword123"
  }'

# Expected response (200):
# {
#   "message": "Login successful",
#   "user": { "role": "admin", ... },
#   "token": "eyJhbGc..." (JWT token)
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Save**: Save as $ADMIN_TOKEN

---

### TEST SUITE B: Complaint Submission (Phase 2)

#### Test B1: Create Complaint (Text Only)
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wi-Fi Not Working in Library",
    "description": "Wi-Fi router in the library has been disconnected for 2 days. Students cannot access internet for studies.",
    "location": "Central Library, 3rd Floor"
  }'

# Expected response (201):
# {
#   "message": "Complaint submitted successfully",
#   "complaint": {
#     "id": "complaint_id_1",
#     "title": "Wi-Fi Not Working...",
#     "status": "Submitted",
#     "category": "IT & Wi-Fi Services",  (auto-detected)
#     "priority": "High",  (auto-detected)
#     "student_id": "..."
#   },
#   "aiAnalysis": { "category": "IT & Wi-Fi Services", "priority": "High", ... }
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Status is "Submitted"
- [ ] Category correctly auto-detected as "IT & Wi-Fi Services"
- [ ] Priority correctly detected as "High"
- [ ] Audit trail created in database
**Save**: Note complaint_id_1 for later tests

#### Test B2: Create Complaint with File Attachment
```bash
# Create a test image file
echo "fake image data" > /tmp/test_image.txt

# Upload complaint with attachment
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -F "title=Hostel Water Issue" \
  -F "description=Water leak in hostel room ceiling causing damage" \
  -F "location=Hostel Block A, Room 305" \
  -F "attachment=@/tmp/test_image.txt"

# Expected response (201):
# {
#   "message": "Complaint submitted successfully",
#   "complaint": {
#     ...,
#     "category": "Hostel Maintenance & Cleanliness",
#     "attachments": ["/uploads/...filename..."]
#   }
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] File successfully uploaded
- [ ] Attachment URL returned
- [ ] Category auto-detected as "Hostel Maintenance & Cleanliness"
- [ ] Priority detected as "Critical" (water leak)
**Save**: Note complaint_id_2

#### Test B3: Create Complaint with Duplicate Detection
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Library Wi-Fi Still Down",
    "description": "Wi-Fi continues to be disconnected in library area",
    "location": "Central Library, 3rd Floor"
  }'

# Expected response (201):
# Should detect complaint_id_1 as potential duplicate
# Response includes "aiAnalysis": { "isPotentialDuplicate": true, "duplicates": [...] }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Duplicate detection flags previous complaint
- [ ] Response indicates `isPotentialDuplicate: true`

---

### TEST SUITE C: Student Dashboard (Phase 3)

#### Test C1: Get Student's Complaints List
```bash
curl http://localhost:5000/api/complaints/mine \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected response (200):
# {
#   "complaints": [
#     { "id": "complaint_id_1", "title": "Wi-Fi...", "status": "Submitted", ... },
#     { "id": "complaint_id_2", "title": "Hostel...", "status": "Submitted", ... }
#   ]
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Returns all complaints created by this student
- [ ] Status shows "Submitted"
- [ ] Ordered by creation date (newest first)

#### Test C2: Get Complaint Details with Audit Trail
```bash
curl http://localhost:5000/api/complaints/complaint_id_1 \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected response (200):
# {
#   "complaint": {
#     "id": "complaint_id_1",
#     "title": "Wi-Fi Not Working in Library",
#     "description": "...",
#     "status": "Submitted",
#     "category": "IT & Wi-Fi Services",
#     "priority": "High",
#     "student_id": { "id": "...", "name": "John Student" },
#     "assigned_to": null,
#     "attachments": [],
#     "resolution_note": null,
#     "created_at": "...",
#     "updated_at": "..."
#   },
#   "logs": [
#     {
#       "id": "...",
#       "complaint_id": "complaint_id_1",
#       "previous_status": null,
#       "new_status": "Submitted",
#       "changed_by": { "id": "...", "name": "John Student", "role": "student" },
#       "comment": "Complaint submitted by student.",
#       "timestamp": "..."
#     }
#   ]
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Complaint details returned correctly
- [ ] Audit log shows creation entry
- [ ] Timeline shows when complaint was submitted
- [ ] Student can see resolution notes (if any)

---

### TEST SUITE D: Admin Dashboard (Phase 4)

#### Test D1: Get All Complaints (Admin View)
```bash
curl http://localhost:5000/api/admin/complaints \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response (200):
# {
#   "complaints": [
#     { "id": "complaint_id_1", "title": "...", "student_id": {...}, ... },
#     { "id": "complaint_id_2", "title": "...", "student_id": {...}, ... }
#   ]
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Admin sees all complaints (not just theirs)
- [ ] Student information included
- [ ] Multiple complaints returned

#### Test D2: Filter Complaints by Status
```bash
curl "http://localhost:5000/api/admin/complaints?status=Submitted" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response (200):
# { "complaints": [ ...only "Submitted" complaints... ] }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Filtering by status works
- [ ] Only complaints with matching status returned

#### Test D3: Get Department List
```bash
curl http://localhost:5000/api/departments

# Expected response (200):
# {
#   "departments": [
#     { "id": "...", "name": "Hostel Maintenance & Cleanliness", "description": "..." },
#     { "id": "...", "name": "Academic Block Infrastructure", "description": "..." },
#     { "id": "...", "name": "IT & Wi-Fi Services", "description": "..." },
#     { "id": "...", "name": "Campus Transportation", "description": "..." },
#     { "id": "...", "name": "General Facilities & Utilities", "description": "..." }
#   ]
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] All 5 departments returned
- [ ] Department names correct
**Save**: Note IT & Wi-Fi Services dept_id for assignment test

#### Test D4: Assign Complaint to Department
```bash
curl -X PUT http://localhost:5000/api/admin/complaints/complaint_id_1/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "departmentId": "IT_WIFI_SERVICES_DEPT_ID"
  }'

# Expected response (200):
# {
#   "message": "Complaint assigned successfully",
#   "complaint": {
#     "id": "complaint_id_1",
#     "status": "Assigned",  (status changed from "Submitted")
#     "assigned_to": "IT_WIFI_SERVICES_DEPT_ID",
#     "updated_at": "..."
#   }
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Complaint status changed to "Assigned"
- [ ] Department assignment updated
- [ ] Notification created for student
- [ ] Audit log entry created

#### Test D5: Update Complaint Status
```bash
curl -X PUT http://localhost:5000/api/admin/complaints/complaint_id_1/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress",
    "comment": "Technician dispatched to library to fix wi-fi router"
  }'

# Expected response (200):
# {
#   "message": "Complaint status updated successfully",
#   "complaint": {
#     "status": "In Progress",
#     "updated_at": "..."
#   }
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Status changed to "In Progress"
- [ ] Comment stored in audit trail
- [ ] Student notification created

#### Test D6: Update Priority
```bash
curl -X PUT http://localhost:5000/api/admin/complaints/complaint_id_2/priority \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d {
    "priority": "Critical"
  }'

# Expected response (200):
# {
#   "message": "Complaint priority updated successfully",
#   "complaint": { "priority": "Critical", ... }
# }
```
**Status**: [ ] PASS [ ] FAIL

#### Test D7: Get Admin Statistics
```bash
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response (200):
# {
#   "stats": {
#     "total": 2,
#     "statusCounts": { "Submitted": 0, "Under Review": 0, "Assigned": 1, "In Progress": 1, ... },
#     "categoryCounts": { "IT & Wi-Fi Services": 1, "Hostel Maintenance & Cleanliness": 1, ... },
#     "priorityCounts": { "High": 1, "Critical": 1, ... },
#     "departmentCounts": { "...dept_id...": 1, ... },
#     "averageResolutionTimeHours": 0
#   }
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Total complaint count correct
- [ ] Status breakdown accurate
- [ ] Category breakdown accurate
- [ ] Statistics update correctly as complaints change status

---

### TEST SUITE E: Notifications (Phase 5)

#### Test E1: Check Notifications Created
```bash
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected response (200):
# {
#   "notifications": [
#     {
#       "id": "notif_1",
#       "type": "assignment",
#       "title": "Complaint Assigned",
#       "message": "Your complaint has been assigned to the IT & Wi-Fi Services department.",
#       "is_read": false,
#       "created_at": "..."
#     },
#     {
#       "id": "notif_2",
#       "type": "status_change",
#       "title": "Status Changed: In Progress",
#       "message": "Your complaint status has changed from Assigned to In Progress. Message: \"Technician dispatched...\"",
#       "is_read": false,
#       "created_at": "..."
#     }
#   ]
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Notifications created for assignment
- [ ] Notifications created for status changes
- [ ] Correct notification type and title
- [ ] Message contains relevant details
- [ ] is_read=false initially

#### Test E2: Mark Notification as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/notif_1/read \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected response (200):
# {
#   "message": "Notification marked as read",
#   "notification": { "id": "notif_1", "is_read": true, ... }
# }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Notification is_read updated to true
- [ ] Only mark user's own notifications

---

### TEST SUITE F: AI Categorization (Phase 6)

#### Test F1: Keyword-Based Categorization
Create complaints with different keywords and verify auto-categorization:

**Test F1a: Hostel Issue**
```bash
# Complaint with "hostel", "bathroom", "shower" keywords
# Expected: Category = "Hostel Maintenance & Cleanliness"
```
**Status**: [ ] PASS [ ] FAIL

**Test F1b: Transport Issue**
```bash
# Complaint with "bus", "transport", "shuttle" keywords  
# Expected: Category = "Campus Transportation"
```
**Status**: [ ] PASS [ ] FAIL

**Test F1c: Academic Issue**
```bash
# Complaint with "lab", "classroom", "projector" keywords
# Expected: Category = "Academic Block Infrastructure"
```
**Status**: [ ] PASS [ ] FAIL

**Test F1d: Utilities Issue**
```bash
# Complaint with "electricity", "water", "garden" keywords
# Expected: Category = "General Facilities & Utilities"
```
**Status**: [ ] PASS [ ] FAIL

#### Test F2: Priority Suggestion
Verify priority is auto-suggested based on severity keywords:

**Test F2a: Critical Priority**
```bash
# Complaints mentioning "fire", "electric shock", "water leak", "injury", "fire hazard"
# Expected: Priority = "Critical"
```
**Status**: [ ] PASS [ ] FAIL

**Test F2b: High Priority**
```bash
# Complaints mentioning "exam", "theft", "urgent", "urgent"
# Expected: Priority = "High"
```
**Status**: [ ] PASS [ ] FAIL

---

### TEST SUITE G: Real-Time Notifications (Phase 8)

#### Test G1: Socket.IO Connection
**Use Postman's WebSocket or a Socket.IO client library**

```bash
# Connect to socket.io endpoint
URL: ws://localhost:5000/socket.io/?transport=websocket&EIO=4&t=...

# Emit join event
socket.emit('join', 'student_user_id')

# Expected: 
# Server logs: "User student_user_id joined room: student_user_id"
```
**Status**: [ ] PASS [ ] FAIL

#### Test G2: Real-Time Status Update Notification
```bash
# While socket is connected, have admin update complaint status
# curl -X PUT .../admin/complaints/{id}/status ...

# Expected on socket:
# Receive 'notification' event with updated notification
# Browser should show real-time badge/alert
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Notification received in real-time
- [ ] Message content correct
- [ ] Notification persisted in database

---

### TEST SUITE H: Status Transitions & Validation (Phase 4)

#### Test H1: Valid Status Transition
```bash
# From: Submitted → To: Under Review
# Expected: SUCCESS (200)
```
**Status**: [ ] PASS [ ] FAIL

#### Test H2: Valid Status Transition
```bash
# From: Under Review → To: Assigned
# Expected: SUCCESS (200)
```
**Status**: [ ] PASS [ ] FAIL

#### Test H3: Valid Status Transition
```bash
# From: Assigned → To: In Progress
# Expected: SUCCESS (200)
```
**Status**: [ ] PASS [ ] FAIL

#### Test H4: Valid Status Transition
```bash
# From: In Progress → To: Resolved (with resolutionNote)
# Expected: SUCCESS (200)
# Verify: resolution_note stored in database
```
**Status**: [ ] PASS [ ] FAIL

#### Test H5: Invalid Status Transition
```bash
# From: Submitted → To: In Progress (should require Under Review first)
# Expected: FAIL (400) "Invalid status transition from Submitted to In Progress"
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Server validates transitions
- [ ] Invalid transitions rejected with error message

####Test H6: Reopen Resolved Complaint
```bash
# Complaint status is Resolved
curl -X POST http://localhost:5000/api/complaints/complaint_id/reopen \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Issue persists, need further assistance"
  }'

# Expected response (200):
# { "message": "Complaint reopened successfully", "complaint": { "status": "Reopened", ... } }
```
**Status**: [ ] PASS [ ] FAIL  
**Verification**:
- [ ] Status changed to "Reopened"
- [ ] Rating cleared
- [ ] Comment logged in audit trail

---

### TEST SUITE I: Permission & Authorization (All Phases)

#### Test I1: Student Cannot Access Admin Endpoints
```bash
curl http://localhost:5000/api/admin/complaints \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected response (403 Forbidden)
# Error: "Access denied" or similar
```
**Status**: [ ] PASS [ ] FAIL

#### Test I2: Student Cannot View Other Student's Complaint
```bash
# Register a second student and get their token
# Try to access first student's complaint as second student
curl http://localhost:5000/api/complaints/complaint_id_1 \
  -H "Authorization: Bearer $STUDENT_TOKEN_2"

# Expected response (403 Forbidden)
# Error: "Access forbidden"
```
**Status**: [ ] PASS [ ] FAIL

#### Test I3: Admin Can View All Complaints
```bash
curl http://localhost:5000/api/admin/complaints \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response (200)
# Returns all complaints regardless of student
```
**Status**: [ ] PASS [ ] FAIL

#### Test I4: Missing Authentication Token
```bash
curl http://localhost:5000/api/complaints/mine
# No Authorization header

# Expected response (401 Unauthorized)
# Error: "Authentication token required"
```
**Status**: [ ] PASS [ ] FAIL

---

### TEST SUITE J: Database Audit Trail (All Phases)

#### Test J1: Complaint Creation Logged
```bash
# After creating a complaint, fetch its logs
curl http://localhost:5000/api/complaints/complaint_id_1 \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Check "logs" array
# Should contain entry: { prev_status: null, new_status: "Submitted", comment: "Complaint submitted by student." }
```
**Status**: [ ] PASS [ ] FAIL

#### Test J2: Assignment Logged
```bash
# After assigning complaint to department
# Fetch logs again, should contain: { prev_status: "Submitted", new_status: "Assigned", comment: "Assigned to department: ..." }
```
**Status**: [ ] PASS [ ] FAIL

#### Test J3: Status Updates Logged
```bash
# After updating status to "In Progress"
# Logs should contain: { prev_status: "Assigned", new_status: "In Progress", comment: "..." }
```
**Status**: [ ] PASS [ ] FAIL

#### Test J4: Audit Trail Completeness
```bash
# Fetch full complaint with logs
# Logs should be ordered by timestamp (ascending)
# Each status change should be documented
# Each change should show: previous_status, new_status, changed_by (user), comment, timestamp
```
**Status**: [ ] PASS [ ] FAIL

---

## Test Results Summary

### Phase 2: Complaint Submission
- [ ] A1-A5: Auth ___/5 passed
- [ ] B1-B3: Complaint Creation ___/3 passed
- **Phase 2 Overall**: ___/8 PASS

### Phase 3: Student Dashboard
- [ ] C1-C2: Dashboard Views ___/2 passed
- **Phase 3 Overall**: ___/2 PASS

### Phase 4: Admin Dashboard
- [ ] D1-D7: Admin Operations ___/7 passed
- **Phase 4 Overall**: ___/7 PASS

### Phase 5: Notifications
- [ ] E1-E2: Notifications ___/2 passed
- **Phase 5 Overall**: ___/2 PASS

### Phase 6: AI Categorization
- [ ] F1-F2: Categorization ___/6 passed
- **Phase 6 Overall**: ___/6 PASS

### Phase 8: Real-Time
- [ ] G1-G2: Socket.IO ___/2 passed
- **Phase 8 Overall**: ___/2 PASS

### Cross-Phase
- [ ] H1-H6: Status Transitions ___/6 passed
- [ ] I1-I4: Authorization ___/4 passed
- [ ] J1-J4: Audit Trail ___/4 passed
- **Cross-Phase Overall**: ___/14 PASS

---

## TOTAL TEST RESULTS

**Total Tests**: 59  
**Passed**: ___  
**Failed**: ___  
**Not Yet Run**: ___

**Pass Rate**: ____%

---

## Known Issues Found During Testing

(Document any issues found here)

| Issue | Phase | Severity | Status | Fix Applied |
|-------|-------|----------|--------|-------------|
| | | | [ ] | [ ] |

---

## Recommendations

- [ ] All tests passing - Ready for deployment
- [ ] Some tests failing - See "Known Issues" section
- [ ] Major failures - Do not deploy

**Next Steps**:
1. Fix any failing tests
2. Update task.md with final verified status
3. Mark Phases 2-8 as "VERIFIED END-TO-END"
4. Proceed to production deployment

---

## Approval Sign-Off

**Tester Name**: __________________  
**Date**: __________________  
**Outcome**: [ ] ALL PASS [ ] PARTIAL [ ] MAJOR ISSUES  

**Verified By**: __________________  
**Time Taken**: __________________ (hours)
