const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const complaintController = require('../controllers/complaintController');

const router = express.Router();

const postRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required')
];

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['student']),
  upload.single('attachment'),
  postRules,
  complaintController.handleCreate
);

router.get(
  '/mine',
  authMiddleware,
  roleMiddleware(['student']),
  complaintController.handleGetMine
);

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['student', 'admin']),
  complaintController.handleGetById
);

router.post(
  '/:id/reopen',
  authMiddleware,
  roleMiddleware(['student']),
  body('comment').optional().trim(),
  complaintController.handleReopen
);

router.post(
  '/:id/rate',
  authMiddleware,
  roleMiddleware(['student']),
  body('rating').isInt({ min: 1, max: 5 }),
  complaintController.handleRate
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['student']),
  complaintController.handleDelete
);

module.exports = router;
