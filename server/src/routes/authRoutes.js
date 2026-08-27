const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

const profileRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
];

const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

router.post('/register', registerRules, authController.handleRegister);
router.post('/login', loginRules, authController.handleLogin);
router.get('/me', authMiddleware, authController.handleMe);
router.put('/profile', authMiddleware, profileRules, authController.handleUpdateProfile);
router.put('/password', authMiddleware, passwordRules, authController.handleChangePassword);

module.exports = router;
