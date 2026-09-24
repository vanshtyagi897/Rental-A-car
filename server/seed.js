import bcrypt from 'bcryptjs';
import { query, initDb, INITIAL_CARS_DATA, INITIAL_REQUESTS_DATA } from './db.js';

export async function seedDatabase(force = false) {
  console.log('[Seed] Initializing and seeding relational database...');

  // Ensure tables exist
  await initDb();

  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const customerPasswordHash = bcrypt.hashSync('password123', salt);

  // Check if admin user exists
  const adminCheck = await query('SELECT * FROM users WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)) AND role = $2', ['admin', 'admin']);

  if (adminCheck.rowCount === 0 || force) {
    console.log('[Seed] Inserting initial Admin account (admin / admin123)...');
    await query(
      `INSERT INTO users (id, name, username, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'admin-1',
        'Fleet Operations Manager',
        'admin',
        'admin@kkrentals.com',
        '+91 99977 84944',
        adminPasswordHash,
        'admin'
      ]
    );

    console.log('[Seed] Inserting sample customer account...');
    await query(
      `INSERT INTO users (id, name, username, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'user-default',
        'Customer User',
        'customer',
        'customer@kkrentals.com',
        '+91 98765 00000',
        customerPasswordHash,
        'customer'
      ]
    );
  } else {
    console.log('[Seed] Admin account already present.');
  }

  console.log('[Seed] Relational database seeding complete.');
  return true;
}

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(true).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  });
}
