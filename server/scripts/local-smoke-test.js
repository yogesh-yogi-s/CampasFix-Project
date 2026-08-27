/**
 * Local pre-deploy API smoke test — run: node scripts/local-smoke-test.js
 */
const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const ts = Date.now();
const studentEmail = `smoke.student.${ts}@campusfix.edu`;
const studentPassword = 'testpass123';

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`  OK  ${label}`);
}

function fail(label, err) {
  failed++;
  console.error(` FAIL ${label}:`, err?.message || err);
}

async function req(method, path, { token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let fetchBody = body;
  if (body && !formData) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: fetchBody });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function run() {
  console.log('\n=== CampusFix API Smoke Test ===\n');

  // Health
  try {
    const h = await req('GET', '/health'.replace('/api', '') === '/health' ? '/../api/health'.slice(3) : '/health');
    const health = await fetch('http://localhost:5000/api/health');
    const hd = await health.json();
    if (hd.status === 'OK') ok('GET /api/health');
    else fail('GET /api/health', hd);
  } catch (e) {
    fail('GET /api/health', e);
  }

  // Register
  let studentToken;
  let studentUser;
  try {
    const r = await req('POST', '/auth/register', {
      body: { name: 'Smoke Student', email: studentEmail, password: studentPassword }
    });
    if (r.status === 201 || r.status === 200) ok('POST /auth/register');
    else fail('POST /auth/register', r.data);
  } catch (e) {
    fail('POST /auth/register', e);
  }

  // Invalid login
  try {
    const r = await req('POST', '/auth/login', {
      body: { email: studentEmail, password: 'wrongpassword' }
    });
    if (r.status === 401 || r.status === 400) ok('POST /auth/login invalid password rejected');
    else fail('POST /auth/login invalid', `status ${r.status}`);
  } catch (e) {
    fail('POST /auth/login invalid', e);
  }

  // Student login
  try {
    const r = await req('POST', '/auth/login', {
      body: { email: studentEmail, password: studentPassword }
    });
    if (r.data?.token) {
      studentToken = r.data.token;
      studentUser = r.data.user;
      ok('POST /auth/login student');
    } else fail('POST /auth/login student', r.data);
  } catch (e) {
    fail('POST /auth/login student', e);
  }

  // Admin login
  let adminToken;
  try {
    const r = await req('POST', '/auth/login', {
      body: { email: 'admin@campusfix.edu', password: 'adminpassword123' }
    });
    if (r.data?.token) {
      adminToken = r.data.token;
      ok('POST /auth/login admin');
    } else fail('POST /auth/login admin', r.data);
  } catch (e) {
    fail('POST /auth/login admin', e);
  }

  // Me
  try {
    const r = await req('GET', '/auth/me', { token: studentToken });
    if (r.data?.user?.email === studentEmail) ok('GET /auth/me');
    else fail('GET /auth/me', r.data);
  } catch (e) {
    fail('GET /auth/me', e);
  }

  // Create complaint
  let complaintId;
  try {
    const form = new FormData();
    form.append('title', `Smoke test issue ${ts}`);
    form.append('description', 'Automated smoke test complaint for local verification.');
    form.append('location', 'Block A Room 101');
    form.append('category', 'Classroom');
    form.append('priority', 'High');
    const res = await fetch(`${BASE}/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: form
    });
    const data = await res.json();
    if (res.ok && data.complaint?.id) {
      complaintId = data.complaint.id;
      ok('POST /complaints');
    } else fail('POST /complaints', data);
  } catch (e) {
    fail('POST /complaints', e);
  }

  // Mine
  try {
    const r = await req('GET', '/complaints/mine', { token: studentToken });
    if (Array.isArray(r.data?.complaints) && r.data.complaints.length > 0) ok('GET /complaints/mine');
    else fail('GET /complaints/mine', r.data);
  } catch (e) {
    fail('GET /complaints/mine', e);
  }

  // Detail
  try {
    const r = await req('GET', `/complaints/${complaintId}`, { token: studentToken });
    if (r.data?.complaint?.id === complaintId) ok('GET /complaints/:id student');
    else fail('GET /complaints/:id student', r.data);
  } catch (e) {
    fail('GET /complaints/:id student', e);
  }

  // Student delete (Submitted status only)
  try {
    const formDel = new FormData();
    formDel.append('title', `Delete test ${ts}`);
    formDel.append('description', 'Temporary complaint for delete smoke test.');
    formDel.append('location', 'Block B');
    formDel.append('category', 'Other');
    formDel.append('priority', 'Low');
    const createRes = await fetch(`${BASE}/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formDel
    });
    const createData = await createRes.json();
    const deleteId = createData.complaint?.id;
    if (!deleteId) throw new Error('Could not create delete test complaint');

    const delRes = await req('DELETE', `/complaints/${deleteId}`, { token: studentToken });
    if (delRes.status !== 200) throw new Error(JSON.stringify(delRes.data));

    const goneRes = await req('GET', `/complaints/${deleteId}`, { token: studentToken });
    if (goneRes.status === 400 || goneRes.status === 404) ok('DELETE /complaints/:id (student)');
    else fail('DELETE /complaints/:id (student)', `still exists status ${goneRes.status}`);
  } catch (e) {
    fail('DELETE /complaints/:id (student)', e);
  }

  // Departments
  let deptId;
  try {
    const r = await req('GET', '/departments', { token: adminToken });
    if (r.data?.departments?.length > 0) {
      deptId = r.data.departments[0].id;
      ok('GET /departments');
    } else fail('GET /departments', r.data);
  } catch (e) {
    fail('GET /departments', e);
  }

  // Admin stats
  try {
    const r = await req('GET', '/admin/stats', { token: adminToken });
    if (typeof r.data?.stats?.total === 'number') ok('GET /admin/stats');
    else fail('GET /admin/stats', r.data);
  } catch (e) {
    fail('GET /admin/stats', e);
  }

  // Admin list
  try {
    const r = await req('GET', '/admin/complaints', { token: adminToken });
    if (Array.isArray(r.data?.complaints)) ok('GET /admin/complaints');
    else fail('GET /admin/complaints', r.data);
  } catch (e) {
    fail('GET /admin/complaints', e);
  }

  // Assign
  try {
    const r = await req('PUT', `/admin/complaints/${complaintId}/assign`, {
      token: adminToken,
      body: { departmentId: deptId }
    });
    if (r.status === 200) ok('PUT /admin/complaints/:id/assign');
    else fail('PUT assign', r.data);
  } catch (e) {
    fail('PUT assign', e);
  }

  // Priority
  try {
    const r = await req('PUT', `/admin/complaints/${complaintId}/priority`, {
      token: adminToken,
      body: { priority: 'Critical' }
    });
    if (r.status === 200) ok('PUT /admin/complaints/:id/priority');
    else fail('PUT priority', r.data);
  } catch (e) {
    fail('PUT priority', e);
  }

  // Category
  try {
    const r = await req('PUT', `/admin/complaints/${complaintId}/category`, {
      token: adminToken,
      body: { category: 'Infrastructure' }
    });
    if (r.status === 200) ok('PUT /admin/complaints/:id/category');
    else fail('PUT category', r.data);
  } catch (e) {
    fail('PUT category', e);
  }

  // Status workflow: Assigned -> In Progress -> Resolved (after assign above)
  try {
    let r = await req('PUT', `/admin/complaints/${complaintId}/status`, {
      token: adminToken,
      body: { status: 'In Progress', comment: 'Smoke test: in progress' }
    });
    if (r.status !== 200) throw new Error(JSON.stringify(r.data));

    r = await req('PUT', `/admin/complaints/${complaintId}/status`, {
      token: adminToken,
      body: {
        status: 'Resolved',
        comment: 'Smoke test resolution',
        resolutionNote: 'Issue fixed during automated test.'
      }
    });
    if (r.status === 200) ok('PUT /admin/complaints/:id/status');
    else fail('PUT status', r.data);
  } catch (e) {
    fail('PUT status', e);
  }

  // Rate
  try {
    const r = await req('POST', `/complaints/${complaintId}/rate`, {
      token: studentToken,
      body: { rating: 4 }
    });
    if (r.status === 200) ok('POST /complaints/:id/rate');
    else fail('POST rate', r.data);
  } catch (e) {
    fail('POST rate', e);
  }

  // Notifications
  let notifId;
  try {
    const r = await req('GET', '/notifications', { token: studentToken });
    if (Array.isArray(r.data?.notifications)) {
      if (r.data.notifications.length > 0) notifId = r.data.notifications[0].id;
      ok('GET /notifications');
    } else fail('GET /notifications', r.data);
  } catch (e) {
    fail('GET /notifications', e);
  }

  if (notifId) {
    try {
      const r = await req('PUT', `/notifications/${notifId}/read`, { token: studentToken });
      if (r.status === 200) ok('PUT /notifications/:id/read');
      else fail('PUT mark read', r.data);
    } catch (e) {
      fail('PUT mark read', e);
    }
  }

  // Profile update
  try {
    const r = await req('PUT', '/auth/profile', {
      token: studentToken,
      body: { name: 'Smoke Student Updated' }
    });
    if (r.status === 200) ok('PUT /auth/profile');
    else fail('PUT /auth/profile', r.data);
  } catch (e) {
    fail('PUT /auth/profile', e);
  }

  // Student cannot access admin
  try {
    const r = await req('GET', '/admin/stats', { token: studentToken });
    if (r.status === 403) ok('Student blocked from admin stats (403)');
    else fail('Student admin access', `status ${r.status}`);
  } catch (e) {
    fail('Student admin access', e);
  }

  // Invalid register
  try {
    const r = await req('POST', '/auth/register', {
      body: { name: 'X', email: 'not-an-email', password: '123' }
    });
    if (r.status === 400) ok('Invalid register rejected (400)');
    else fail('Invalid register', `status ${r.status}`);
  } catch (e) {
    fail('Invalid register', e);
  }

  // No token -> 401
  try {
    const r = await req('GET', '/auth/me');
    if (r.status === 401) ok('Unauthenticated /auth/me rejected (401)');
    else fail('Unauthenticated /auth/me', `status ${r.status}`);
  } catch (e) {
    fail('Unauthenticated /auth/me', e);
  }

  // Invalid complaint id
  try {
    const r = await req('GET', '/complaints/00000000-0000-0000-0000-000000000000', { token: studentToken });
    if (r.status === 404 || r.status === 403 || r.status === 400) ok('Unknown complaint rejected');
    else fail('Unknown complaint', `status ${r.status}`);
  } catch (e) {
    fail('Unknown complaint', e);
  }

  // Invalid status transition
  try {
    const r = await req('PUT', `/admin/complaints/${complaintId}/status`, {
      token: adminToken,
      body: { status: 'Submitted', comment: 'Should fail' }
    });
    if (r.status === 400 || r.status === 500) ok('Invalid status transition rejected');
    else fail('Invalid status transition', `status ${r.status}`);
  } catch (e) {
    fail('Invalid status transition', e);
  }

  // Student cannot delete resolved complaint
  try {
    const r = await req('DELETE', `/complaints/${complaintId}`, { token: studentToken });
    if (r.status === 400 || r.status === 403) ok('Student blocked from deleting resolved complaint');
    else fail('Student delete resolved', `status ${r.status}`);
  } catch (e) {
    fail('Student delete resolved', e);
  }

  // Admin delete
  try {
    const r = await req('DELETE', `/admin/complaints/${complaintId}`, { token: adminToken });
    if (r.status === 200) ok('DELETE /admin/complaints/:id');
    else fail('DELETE /admin/complaints/:id', r.data);
  } catch (e) {
    fail('DELETE /admin/complaints/:id', e);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
