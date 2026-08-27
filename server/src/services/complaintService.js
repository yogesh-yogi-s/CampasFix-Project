const supabase = require('../config/db');
const { analyzeComplaint } = require('./aiCategorizationService');
const { createNotification } = require('./notificationService');
const path = require('path');
const fs = require('fs');

const VALID_STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'];
const VALID_CATEGORIES = ['Classroom', 'Laboratory', 'Hostel', 'Wi-Fi', 'Infrastructure', 'Transportation', 'Cleanliness', 'General Facilities & Utilities', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Validate status transition order
function isValidTransition(oldStatus, newStatus) {
  if (oldStatus === newStatus) return true;
  
  const allowed = {
    'Submitted': ['Under Review', 'Closed'],
    'Under Review': ['Assigned', 'Closed'],
    'Assigned': ['In Progress', 'Closed'],
    'In Progress': ['Resolved'],
    'Resolved': ['Closed', 'Reopened'],
    'Closed': ['Reopened'],
    'Reopened': ['Under Review', 'Assigned', 'In Progress', 'Closed']
  };

  return allowed[oldStatus] ? allowed[oldStatus].includes(newStatus) : false;
}

function normalizeCategory(value) {
  if (!value) return 'Other';
  const matches = VALID_CATEGORIES.find((option) => option.toLowerCase() === String(value).trim().toLowerCase());
  return matches || 'Other';
}

function normalizePriority(value) {
  if (!value) return 'Low';
  const matches = VALID_PRIORITIES.find((option) => option.toLowerCase() === String(value).trim().toLowerCase());
  return matches || 'Low';
}

async function createComplaint({ studentId, title, description, location, category, priority, attachments }) {
  // Optional AI suggestions only fill gaps; explicit dropdown values win
  const aiAnalysis = await analyzeComplaint(description, location);
  const selectedCategory = normalizeCategory(category || aiAnalysis.category);
  const selectedPriority = normalizePriority(priority || aiAnalysis.priority);

  // Insert complaint
  const { data: complaint, error } = await supabase
    .from('complaints')
    .insert([{
      title,
      description,
      location,
      student_id: studentId,
      category: selectedCategory,
      priority: selectedPriority,
      status: 'Submitted',
      attachments: attachments || []
    }])
    .select('*')
    .single();

  if (error) throw error;

  // Write log audit trail
  await supabase
    .from('complaint_logs')
    .insert([{
      complaint_id: complaint.id,
      previous_status: null,
      new_status: 'Submitted',
      changed_by: studentId,
      comment: `Complaint submitted by student. Category: ${selectedCategory}, Priority: ${selectedPriority}`
    }]);

  return { complaint, aiAnalysis: { ...aiAnalysis, category: selectedCategory, priority: selectedPriority } };
}

async function getStudentComplaints(studentId) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, assigned_to(id, name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function getAdminComplaints({ status, category, priority, department, search, dateFrom, dateTo }) {
  let query = supabase.from('complaints').select('*, student_id(id, name, email), assigned_to(id, name)');

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (priority) query = query.eq('priority', priority);
  if (department) query = query.eq('assigned_to', department);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) {
    // Inclusive end-of-day when only a date is provided
    const end = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`;
    query = query.lte('created_at', end);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function bulkAssignComplaints(complaintIds, departmentId, adminId) {
  if (!Array.isArray(complaintIds) || complaintIds.length === 0) {
    throw new Error('At least one complaint ID is required');
  }

  const results = [];
  for (const complaintId of complaintIds) {
    const updated = await assignComplaint(complaintId, departmentId, adminId);
    results.push(updated);
  }
  return results;
}

async function getComplaintDetails(complaintId) {
  // Fetch complaint details
  const { data: complaint, error } = await supabase
    .from('complaints')
    .select('*, student_id(id, name, email), assigned_to(id, name)')
    .eq('id', complaintId)
    .single();

  if (error || !complaint) {
    throw new Error('Complaint not found');
  }

  // Fetch status logs / audit trail
  const { data: logs, error: logsError } = await supabase
    .from('complaint_logs')
    .select('*, changed_by(id, name, role)')
    .eq('complaint_id', complaintId)
    .order('timestamp', { ascending: true });

  if (logsError) throw logsError;

  return { complaint, logs };
}

async function assignComplaint(complaintId, departmentId, adminId) {
  // Get department name for log and notification
  const { data: dept, error: deptErr } = await supabase
    .from('departments')
    .select('name')
    .eq('id', departmentId)
    .single();

  if (deptErr || !dept) throw new Error('Department not found');

  // Fetch current status
  const { data: current, error: curErr } = await supabase
    .from('complaints')
    .select('status, student_id, assigned_to')
    .eq('id', complaintId)
    .single();

  if (curErr) throw curErr;

  const nextStatus = (current.status === 'Submitted' || current.status === 'Under Review') ? 'Assigned' : current.status;

  // Check if status changes
  const statusChanged = nextStatus !== current.status;

  // Update complaint
  const { data: updated, error } = await supabase
    .from('complaints')
    .update({ 
      assigned_to: departmentId,
      status: nextStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
    .select('*')
    .single();

  if (error) throw error;

  // Write log for assignment
  await supabase
    .from('complaint_logs')
    .insert([{
      complaint_id: complaintId,
      previous_status: current.status,
      new_status: nextStatus,
      changed_by: adminId,
      comment: `Assigned to department: ${dept.name}`
    }]);

  // Notify student
  await createNotification({
    ownerId: current.student_id,
    complaintId,
    type: 'assignment',
    title: 'Complaint Assigned',
    message: `Your complaint has been assigned to the ${dept.name} department.`
  });

  return updated;
}

async function updateComplaintStatus(complaintId, newStatus, comment, resolutionNote, adminId) {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error('Invalid status value');
  }

  // Fetch current complaint state
  const { data: complaint, error: curErr } = await supabase
    .from('complaints')
    .select('status, student_id')
    .eq('id', complaintId)
    .single();

  if (curErr || !complaint) throw new Error('Complaint not found');

  // Verify transition legitimacy on the server
  if (!isValidTransition(complaint.status, newStatus)) {
    throw new Error(`Invalid status transition from ${complaint.status} to ${newStatus}`);
  }

  const updateFields = { 
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  
  if (newStatus === 'Resolved' && resolutionNote) {
    updateFields.resolution_note = resolutionNote;
  }

  // Update
  const { data: updated, error } = await supabase
    .from('complaints')
    .update(updateFields)
    .eq('id', complaintId)
    .select('*')
    .single();

  if (error) throw error;

  // Log in audit trail
  await supabase
    .from('complaint_logs')
    .insert([{
      complaint_id: complaintId,
      previous_status: complaint.status,
      new_status: newStatus,
      changed_by: adminId,
      comment: comment || `Status updated to ${newStatus}`
    }]);

  // Notify student
  let notifMessage = `Your complaint status has changed from ${complaint.status} to ${newStatus}.`;
  if (comment) notifMessage += ` Message: "${comment}"`;

  await createNotification({
    ownerId: complaint.student_id,
    complaintId,
    type: 'status_change',
    title: `Status Changed: ${newStatus}`,
    message: notifMessage
  });

  return updated;
}

async function updateComplaintPriority(complaintId, newPriority, adminId) {
  const normalizedPriority = normalizePriority(newPriority);

  const { data: complaint, error: curErr } = await supabase
    .from('complaints')
    .select('priority, student_id')
    .eq('id', complaintId)
    .single();

  if (curErr) throw curErr;

  const { data: updated, error } = await supabase
    .from('complaints')
    .update({ 
      priority: normalizedPriority,
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
    .select('*')
    .single();

  if (error) throw error;

  await supabase
    .from('complaint_logs')
    .insert([{
      complaint_id: complaintId,
      previous_status: null,
      new_status: updated.status,
      changed_by: adminId,
      comment: `Priority upgraded to ${normalizedPriority} by Admin`
    }]);

  return updated;
}

async function updateComplaintCategory(complaintId, newCategory, adminId) {
  const normalizedCategory = normalizeCategory(newCategory);

  const { data: complaint, error: curErr } = await supabase
    .from('complaints')
    .select('category, student_id')
    .eq('id', complaintId)
    .single();

  if (curErr) throw curErr;

  const { data: updated, error } = await supabase
    .from('complaints')
    .update({
      category: normalizedCategory,
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
    .select('*')
    .single();

  if (error) throw error;

  await supabase
    .from('complaint_logs')
    .insert([{
      complaint_id: complaintId,
      previous_status: null,
      new_status: updated.status,
      changed_by: adminId,
      comment: `Category changed from ${complaint.category || 'Unknown'} to ${normalizedCategory} by Admin`
    }]);

  return updated;
}

async function rateComplaint(complaintId, rating, studentId) {
  // Fetch complaint
  const { data: complaint, error: curErr } = await supabase
    .from('complaints')
    .select('student_id, status')
    .eq('id', complaintId)
    .single();

  if (curErr || !complaint) throw new Error('Complaint not found');
  if (complaint.student_id !== studentId) {
    throw new Error('Only the student who submitted the complaint can rate it');
  }

  const { data: updated, error } = await supabase
    .from('complaints')
    .update({ rating })
    .eq('id', complaintId)
    .select('*')
    .single();

  if (error) throw error;

  // Log rating
  await supabase
    .from('complaint_logs')
    .insert([{
      complaint_id: complaintId,
      previous_status: null,
      new_status: complaint.status,
      changed_by: studentId,
      comment: `Student rated the resolution: ${rating} Stars`
    }]);

  return updated;
}

async function reopenComplaint(complaintId, comment, studentId) {
  const { data: complaint, error: curErr } = await supabase
    .from('complaints')
    .select('status, student_id')
    .eq('id', complaintId)
    .single();

  if (curErr || !complaint) throw new Error('Complaint not found');
  if (complaint.student_id !== studentId) {
    throw new Error('Only the student who submitted the complaint can reopen it');
  }

  if (!isValidTransition(complaint.status, 'Reopened')) {
    throw new Error(`Cannot reopen a complaint that is ${complaint.status}`);
  }

  const { data: updated, error } = await supabase
    .from('complaints')
    .update({ 
      status: 'Reopened',
      rating: null, // Clear rating if reopened
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
    .select('*')
    .single();

  if (error) throw error;

  // Log reopened audit trail
  await supabase
    .from('complaint_logs')
    .insert([{
      complaint_id: complaintId,
      previous_status: complaint.status,
      new_status: 'Reopened',
      changed_by: studentId,
      comment: comment || 'Student reopened the complaint.'
    }]);

  return updated;
}

function removeAttachmentFiles(attachments = []) {
  const uploadDir = path.join(__dirname, '../../uploads');
  for (const url of attachments) {
    if (!url || typeof url !== 'string') continue;
    const filename = path.basename(url);
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        /* ignore missing files */
      }
    }
  }
}

async function deleteComplaint(complaintId, { userId, role }) {
  const dbClient = supabase.admin || supabase;

  const { data: complaint, error: findErr } = await dbClient
    .from('complaints')
    .select('id, student_id, status, attachments')
    .eq('id', complaintId)
    .single();

  if (findErr || !complaint) {
    throw new Error('Complaint not found');
  }

  if (role === 'student') {
    if (complaint.student_id !== userId) {
      throw new Error('You can only delete your own complaints');
    }
    if (complaint.status !== 'Submitted') {
      throw new Error('Only complaints in Submitted status can be deleted');
    }
  } else if (role !== 'admin') {
    throw new Error('Access forbidden');
  }

  await dbClient.from('complaint_logs').delete().eq('complaint_id', complaintId);
  await dbClient.from('notifications').delete().eq('complaint_id', complaintId);

  const { error: deleteErr } = await dbClient
    .from('complaints')
    .delete()
    .eq('id', complaintId);

  if (deleteErr) throw deleteErr;

  removeAttachmentFiles(complaint.attachments || []);

  return { id: complaintId };
}

module.exports = {
  createComplaint,
  getStudentComplaints,
  getAdminComplaints,
  getComplaintDetails,
  assignComplaint,
  bulkAssignComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  updateComplaintCategory,
  rateComplaint,
  reopenComplaint,
  deleteComplaint
};
