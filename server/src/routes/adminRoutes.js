const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/complaints', adminController.handleGetAllComplaints);
router.put('/complaints/bulk-assign', adminController.handleBulkAssign);
router.put('/complaints/:id/assign', adminController.handleAssign);
router.put('/complaints/:id/status', adminController.handleUpdateStatus);
router.put('/complaints/:id/priority', adminController.handleUpdatePriority);
router.put('/complaints/:id/category', adminController.handleUpdateCategory);
router.delete('/complaints/:id', adminController.handleDelete);
router.get('/stats', adminController.handleGetStats);

module.exports = router;
