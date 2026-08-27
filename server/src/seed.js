const db = require('./config/db');
const { hashPassword, isBcryptHash } = require('./utils/password');
const supabase = db.admin || db; // Use admin client if available

const DEPARTMENTS = [
  { name: 'Hostel Maintenance & Cleanliness', description: 'Handles hostel rooms, bathrooms, corridors, and general cleanliness.' },
  { name: 'Academic Block Infrastructure', description: 'Handles classroom benches, projector issues, laboratory equipment issues.' },
  { name: 'IT & Wi-Fi Services', description: 'Handles campus Wi-Fi connectivity, computer labs, server downs.' },
  { name: 'Campus Transportation', description: 'Handles college buses, routes, shuttle services.' },
  { name: 'General Facilities & Utilities', description: 'Handles campus gardens, sports area, drinking water, electricity.' }
];

async function seed() {
  console.log('Starting Database Seeding...');

  try {
    // 1. Seed Departments
    const seededDepartments = [];
    for (const dept of DEPARTMENTS) {
      // Check if department exists
      const { data: existing, error: findErr } = await supabase
        .from('departments')
        .select('*')
        .eq('name', dept.name)
        .single();

      if (findErr && findErr.code !== 'PGRST116') { // PGRST116 is code for "no rows returned"
        throw findErr;
      }

      if (existing) {
        console.log(`Department already exists: ${dept.name}`);
        seededDepartments.push(existing);
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('departments')
          .insert([dept])
          .select()
          .single();

        if (insertErr) throw insertErr;
        console.log(`Seeded Department: ${dept.name}`);
        seededDepartments.push(created);
      }
    }

    // 2. Seed Admin User
    const adminEmail = 'admin@campusfix.edu';
    const { data: existingAdmin, error: findAdminErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (findAdminErr && findAdminErr.code !== 'PGRST116') {
      throw findAdminErr;
    }

    if (existingAdmin) {
      console.log(`Admin user already exists: ${adminEmail}`);
      if (!isBcryptHash(existingAdmin.password)) {
        const hashedPassword = await hashPassword('adminpassword123');
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', existingAdmin.id);
        console.log(`Upgraded admin password to bcrypt hash`);
      }
    } else {
      const hashedPassword = await hashPassword('adminpassword123');
      const adminUser = {
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        department_id: null
      };

      const { error: insertAdminErr } = await supabase
        .from('users')
        .insert([adminUser]);

      if (insertAdminErr) throw insertAdminErr;
      console.log(`Seeded Admin User: ${adminEmail} / password: adminpassword123`);
    }

    console.log('Database Seeding Completed Successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
