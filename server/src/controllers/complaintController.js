const { validationResult } = require('express-validator');
const complaintService = require('../services/complaintService');

async function handleCreate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, location, category, priority } = req.body;
  const studentId = req.user.id;

  try {
    let attachments = [];
    if (req.file) {
      // Form url for frontend retrieval
      const fileUrl = `/uploads/${req.file.filename}`;
      attachments.push(fileUrl);
    }

    const result = await complaintService.createComplaint({
      studentId,
      title,
      description,
      location,
      category,
      priority,
      attachments
    });

    return res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: result.complaint,
      aiAnalysis: result.aiAnalysis
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleGetMine(req, res) {
  try {
    const studentId = req.user.id;
    const complaints = await complaintService.getStudentComplaints(studentId);
    return res.status(200).json({ complaints });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleGetById(req, res) {
  const { id } = req.params;
  try {
    const { complaint, logs } = await complaintService.getComplaintDetails(id);
    
    // Authorization check: students can only see their own complaints
    if (req.user.role === 'student' && complaint.student_id.id !== req.user.id) {
      return res.status(403).json({ error: 'Access forbidden' });
    }

    return res.status(200).json({ complaint, logs });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleReopen(req, res) {
  const { id } = req.params;
  const { comment } = req.body;
  const studentId = req.user.id;

  try {
    const updated = await complaintService.reopenComplaint(id, comment, studentId);
    return res.status(200).json({
      message: 'Complaint reopened successfully',
      complaint: updated
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleRate(req, res) {
  const { id } = req.params;
  const { rating } = req.body;
  const studentId = req.user.id;

  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const updated = await complaintService.rateComplaint(id, parseInt(rating), studentId);
    return res.status(200).json({
      message: 'Complaint rated successfully',
      complaint: updated
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleDelete(req, res) {
  const { id } = req.params;

  try {
    await complaintService.deleteComplaint(id, { userId: req.user.id, role: req.user.role });
    return res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    const status = error.message.includes('not found') ? 404
      : error.message.includes('forbidden') || error.message.includes('own') ? 403
      : 400;
    return res.status(status).json({ error: error.message });
  }
}

module.exports = {
  handleCreate,
  handleGetMine,
  handleGetById,
  handleReopen,
  handleRate,
  handleDelete
};
