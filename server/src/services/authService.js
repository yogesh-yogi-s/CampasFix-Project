const jwt = require('jsonwebtoken');
const supabase = require('../config/db');
const { getEnv } = require('../config/env');
const { hashPassword, verifyPassword, isBcryptHash } = require('../utils/password');

const JWT_SECRET = getEnv('JWT_SECRET', 'supersecretkey');

async function registerStudent({ name, email, password }) {
  const dbClient = supabase.admin || supabase;

  const { data: existingUser } = await dbClient
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const hashedPassword = await hashPassword(password);

  const { data: newUser, error: createErr } = await dbClient
    .from('users')
    .insert([{
      name,
      email,
      password: hashedPassword,
      role: 'student',
      department_id: null
    }])
    .select('id, name, email, role, department_id, created_at')
    .single();

  if (createErr) {
    throw createErr;
  }

  return newUser;
}

async function loginUser({ email, password }) {
  const dbClient = supabase.admin || supabase;
  const { data: user, error: findErr } = await dbClient
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (findErr || !user) {
    throw new Error('Invalid email or password');
  }

  const passwordValid = await verifyPassword(password, user.password);
  if (!passwordValid) {
    throw new Error('Invalid email or password');
  }

  // Upgrade legacy plain-text passwords on successful login
  if (!isBcryptHash(user.password)) {
    const hashedPassword = await hashPassword(password);
    await dbClient
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  await dbClient
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  const cleanUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id
  };

  return { user: cleanUser, token };
}

async function getUserById(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, department_id, created_at, last_login')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  return user;
}

async function updateProfile(userId, { name }) {
  if (!name || !String(name).trim()) {
    throw new Error('Name is required');
  }

  const dbClient = supabase.admin || supabase;
  const { data: user, error } = await dbClient
    .from('users')
    .update({ name: String(name).trim() })
    .eq('id', userId)
    .select('id, name, email, role, department_id, created_at, last_login')
    .single();

  if (error) throw error;
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (!newPassword || String(newPassword).length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  const dbClient = supabase.admin || supabase;
  const { data: user, error: findErr } = await dbClient
    .from('users')
    .select('id, password')
    .eq('id', userId)
    .single();

  if (findErr || !user) {
    throw new Error('User not found');
  }

  const currentValid = await verifyPassword(currentPassword, user.password);
  if (!currentValid) {
    throw new Error('Current password is incorrect');
  }

  const hashedPassword = await hashPassword(newPassword);
  const { error } = await dbClient
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

module.exports = {
  registerStudent,
  loginUser,
  getUserById,
  updateProfile,
  changePassword
};
