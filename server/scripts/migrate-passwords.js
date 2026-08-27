/**
 * One-time migration: hash any plain-text passwords in the users table.
 * Run: node scripts/migrate-passwords.js
 */
const db = require('../src/config/db');
const { hashPassword, isBcryptHash } = require('../src/utils/password');

const supabase = db.admin || db;

async function migrate() {
  console.log('Starting password migration (bcrypt cost 12)...');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, password');

  if (error) throw error;

  let migrated = 0;
  let skipped = 0;

  for (const user of users || []) {
    if (!user.password || isBcryptHash(user.password)) {
      skipped++;
      continue;
    }

    const hashed = await hashPassword(user.password);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: hashed })
      .eq('id', user.id);

    if (updateErr) {
      console.error(`Failed to migrate ${user.email}:`, updateErr.message);
      continue;
    }

    console.log(`Migrated: ${user.email}`);
    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}, already hashed/skipped: ${skipped}`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
