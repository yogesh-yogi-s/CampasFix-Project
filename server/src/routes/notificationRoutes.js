const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const supabase = require('../config/db');
const { getNotificationsByUser, markAsRead } = require('../services/notificationService');

const router = express.Router();

router.use(authMiddleware);

// Notification endpoints
router.get('/notifications', async (req, res) => {
  try {
    const data = await getNotificationsByUser(req.user.id);
    return res.status(200).json({ notifications: data });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await markAsRead(id, req.user.id);
    return res.status(200).json({
      message: 'Notification marked as read',
      notification: data
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Departments list endpoints
router.get('/departments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, description')
      .order('name', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ departments: data });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
