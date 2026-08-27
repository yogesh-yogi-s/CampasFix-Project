const complaintService = require('../services/complaintService');
const supabase = require('../config/db');

async function handleGetAllComplaints(req, res) {
  const { status, category, priority, department, search, dateFrom, dateTo } = req.query;
  try {
    const complaints = await complaintService.getAdminComplaints({
      status,
      category,
      priority,
      department,
      search,
      dateFrom,
      dateTo
    });
    return res.status(200).json({ complaints });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleAssign(req, res) {
  const { id } = req.params;
  const { departmentId } = req.body;
  const adminId = req.user.id;

  if (!departmentId) {
    return res.status(400).json({ error: 'Department ID is required' });
  }

  try {
    const updated = await complaintService.assignComplaint(id, departmentId, adminId);
    return res.status(200).json({
      message: 'Complaint assigned successfully',
      complaint: updated
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleBulkAssign(req, res) {
  const { complaintIds, departmentId } = req.body;
  const adminId = req.user.id;

  if (!departmentId) {
    return res.status(400).json({ error: 'Department ID is required' });
  }
  if (!Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({ error: 'complaintIds must be a non-empty array' });
  }

  try {
    const complaints = await complaintService.bulkAssignComplaints(complaintIds, departmentId, adminId);
    return res.status(200).json({
      message: `${complaints.length} complaint(s) assigned successfully`,
      complaints
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleUpdateStatus(req, res) {
  const { id } = req.params;
  const { status, comment, resolutionNote } = req.body;
  const adminId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const updated = await complaintService.updateComplaintStatus(id, status, comment, resolutionNote, adminId);
    return res.status(200).json({
      message: 'Complaint status updated successfully',
      complaint: updated
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleUpdatePriority(req, res) {
  const { id } = req.params;
  const { priority } = req.body;
  const adminId = req.user.id;

  if (!priority) {
    return res.status(400).json({ error: 'Priority is required' });
  }

  try {
    const updated = await complaintService.updateComplaintPriority(id, priority, adminId);
    return res.status(200).json({
      message: 'Complaint priority updated successfully',
      complaint: updated
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleUpdateCategory(req, res) {
  const { id } = req.params;
  const { category } = req.body;
  const adminId = req.user.id;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const updated = await complaintService.updateComplaintCategory(id, category, adminId);
    return res.status(200).json({
      message: 'Complaint category updated successfully',
      complaint: updated
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleGetStats(req, res) {
  try {
    // Fetch all complaints to compute stats in memory
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('id, status, category, priority, assigned_to, created_at, updated_at');

    if (error) throw error;

    const total = complaints.length;
    const statusCounts = {};
    const categoryCounts = {};
    const priorityCounts = {};
    const departmentCounts = {};
    
    let resolvedCount = 0;
    let totalResolutionTimeMs = 0;

    complaints.forEach(item => {
      // Status
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      
      // Category
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      
      // Priority
      priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;

      // Department
      if (item.assigned_to) {
        departmentCounts[item.assigned_to] = (departmentCounts[item.assigned_to] || 0) + 1;
      }

      // Resolution average
      if (item.status === 'Resolved' || item.status === 'Closed') {
        resolvedCount++;
        const duration = new Date(item.updated_at) - new Date(item.created_at);
        if (duration > 0) {
          totalResolutionTimeMs += duration;
        }
      }
    });

    const averageResolutionTimeHours = resolvedCount > 0
      ? parseFloat((totalResolutionTimeMs / (1000 * 60 * 60 * resolvedCount)).toFixed(2))
      : 0;

    return res.status(200).json({
      stats: {
        total,
        statusCounts,
        categoryCounts,
        priorityCounts,
        departmentCounts,
        averageResolutionTimeHours
      }
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleDelete(req, res) {
  const { id } = req.params;

  try {
    await complaintService.deleteComplaint(id, { userId: req.user.id, role: 'admin' });
    return res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
}

module.exports = {
  handleGetAllComplaints,
  handleAssign,
  handleBulkAssign,
  handleUpdateStatus,
  handleUpdatePriority,
  handleUpdateCategory,
  handleGetStats,
  handleDelete
};
