const { validationResult } = require('express-validator');
const authService = require('../services/authService');

async function handleRegister(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const user = await authService.registerStudent({ name, email, password });
    return res.status(201).json({
      message: 'Student registration successful',
      user
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await authService.loginUser({ email, password });
    return res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleMe(req, res) {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleUpdateProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await authService.updateProfile(req.user.id, { name: req.body.name });
    return res.status(200).json({ message: 'Profile updated', user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handleChangePassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    await authService.changePassword(req.user.id, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    });
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  handleRegister,
  handleLogin,
  handleMe,
  handleUpdateProfile,
  handleChangePassword
};
