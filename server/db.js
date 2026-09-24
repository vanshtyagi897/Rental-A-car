import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');
const DATA_DIR = path.join(__dirname, 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'relational_db.json');

// Initial seed constants
export const INITIAL_CARS_DATA = [
  {
    id: 'car-1',
    name: 'Baleno',
    category: 'Premium Hatchback',
    image_url: '/assets/Baleno.jpg',
    price_12hr: 1400,
    price_24hr: 2400,
    overage_rate_per_hr: 150,
    transmission: 'Manual / Petrol',
    seating: '5 Seater'
  },
  {
    id: 'car-2',
    name: 'Bolero',
    category: 'Utility SUV',
    image_url: '/assets/bolero.jpg',
    price_12hr: 1800,
    price_24hr: 3000,
    overage_rate_per_hr: 200,
    transmission: 'Manual / Diesel',
    seating: '7 Seater'
  },
  {
    id: 'car-3',
    name: 'Brezza',
    category: 'Compact SUV',
    image_url: '/assets/Brezza.jpg',
    price_12hr: 1900,
    price_24hr: 3200,
    overage_rate_per_hr: 220,
    transmission: 'Automatic / Petrol',
    seating: '5 Seater'
  },
  {
    id: 'car-4',
    name: 'Creta',
    category: 'Premium SUV',
    image_url: '/assets/creta.jpg',
    price_12hr: 2400,
    price_24hr: 4000,
    overage_rate_per_hr: 280,
    transmission: 'Automatic / Diesel',
    seating: '5 Seater'
  },
  {
    id: 'car-5',
    name: 'Fronx',
    category: 'Compact Crossover',
    image_url: '/assets/fronx.jpg',
    price_12hr: 1800,
    price_24hr: 3100,
    overage_rate_per_hr: 200,
    transmission: 'Automatic / Petrol',
    seating: '5 Seater'
  },
  {
    id: 'car-6',
    name: 'Scorpio N',
    category: 'Full-Size SUV',
    image_url: '/assets/Scorpio_n.jpg',
    price_12hr: 3200,
    price_24hr: 5500,
    overage_rate_per_hr: 350,
    transmission: 'Automatic / Diesel 4x4',
    seating: '7 Seater'
  },
  {
    id: 'car-7',
    name: 'Scorpio S11',
    category: 'Classic SUV',
    image_url: '/assets/scorpio_s11.jpg',
    price_12hr: 2800,
    price_24hr: 4800,
    overage_rate_per_hr: 300,
    transmission: 'Manual / Diesel',
    seating: '7 Seater'
  },
  {
    id: 'car-8',
    name: 'Swift Dzire',
    category: 'Compact Sedan',
    image_url: '/assets/SwiftDzire.jpg',
    price_12hr: 1500,
    price_24hr: 2600,
    overage_rate_per_hr: 160,
    transmission: 'Manual / Petrol',
    seating: '5 Seater'
  },
  {
    id: 'car-9',
    name: 'Thar',
    category: '4x4 Offroader',
    image_url: '/assets/thar.jpg',
    price_12hr: 3500,
    price_24hr: 6000,
    overage_rate_per_hr: 400,
    transmission: 'Automatic / 4x4 Hardtop',
    seating: '4 Seater'
  },
  {
    id: 'car-10',
    name: 'Verna',
    category: 'Executive Sedan',
    image_url: '/assets/verna.jpg',
    price_12hr: 2500,
    price_24hr: 4200,
    overage_rate_per_hr: 280,
    transmission: 'Automatic / Turbo Petrol',
    seating: '5 Seater'
  }
];

export const INITIAL_REQUESTS_DATA = [];

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let pgPool = null;
let usePostgres = false;

// Check if PostgreSQL connection URL is configured
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
  try {
    const isHostedSsl = process.env.DATABASE_URL.includes('neon.tech') ||
      process.env.DATABASE_URL.includes('supabase') ||
      process.env.DATABASE_URL.includes('render.com') ||
      process.env.DATABASE_URL.includes('railway') ||
      process.env.DATABASE_URL.includes('sslmode=require');

    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL.trim(),
      ssl: isHostedSsl ? { rejectUnauthorized: false } : false
    });
    usePostgres = true;
    console.log('[Database] Configured PostgreSQL Client with Hosted Connection Pool.');
  } catch (err) {
    console.error('[Database] Failed to configure PostgreSQL pool:', err);
    usePostgres = false;
  }
} else {
  console.log('[Database] No DATABASE_URL provided. Using Relational Local Engine.');
}

// -------------------------------------------------------------
// RELATIONAL STORAGE ENGINE (Local PostgreSQL emulator if offline)
// -------------------------------------------------------------
class RelationalStore {
  constructor() {
    this.tables = {
      cars: [],
      users: [],
      requests: []
    };
    this.load();
  }

  load() {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      try {
        const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
        this.tables = JSON.parse(raw);
      } catch (err) {
        console.error('[RelationalStore] Error loading local store:', err);
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(this.tables, null, 2), 'utf-8');
    } catch (err) {
      console.error('[RelationalStore] Error saving local store:', err);
    }
  }
}

const localStore = new RelationalStore();

/**
 * Execute parameterized SQL query against PostgreSQL or relational local store
 * @param {string} text - SQL Query
 * @param {Array} params - Parameter array ($1, $2, ...)
 */
export async function query(text, params = []) {
  if (usePostgres && pgPool) {
    try {
      const res = await pgPool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount };
    } catch (err) {
      console.error('[PostgreSQL Query Error]:', err.message, '\nQuery:', text, '\nParams:', params);
      throw err;
    }
  }

  // Local Relational Fallback Handler
  return executeLocalRelationalQuery(text, params);
}

/**
 * Parses and executes standard SQL commands for cars, users, and requests
 */
function executeLocalRelationalQuery(sql, params) {
  const normalized = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT ... FROM cars WHERE id = $1
  if (/SELECT .* FROM cars WHERE id = \$1/i.test(normalized)) {
    const car = localStore.tables.cars.find(c => c.id === params[0]);
    return { rows: car ? [car] : [], rowCount: car ? 1 : 0 };
  }

  // 2. SELECT ... FROM cars
  if (/SELECT .* FROM cars/i.test(normalized) && !/COUNT/i.test(normalized)) {
    return { rows: [...localStore.tables.cars], rowCount: localStore.tables.cars.length };
  }

  // 3. INSERT INTO cars (...) VALUES ($1, $2, ...) RETURNING *
  if (/^INSERT INTO cars/i.test(normalized)) {
    const newCar = {
      id: params[0],
      name: params[1],
      category: params[2],
      image_url: params[3],
      price_12hr: Number(params[4]),
      price_24hr: Number(params[5]),
      overage_rate_per_hr: Number(params[6]),
      transmission: params[7],
      seating: params[8],
      created_at: new Date().toISOString()
    };
    localStore.tables.cars.push(newCar);
    localStore.save();
    return { rows: [newCar], rowCount: 1 };
  }

  // 4. UPDATE cars SET ... WHERE id = $... RETURNING *
  if (/^UPDATE cars SET/i.test(normalized)) {
    const id = params[params.length - 1];
    const carIdx = localStore.tables.cars.findIndex(c => c.id === id);
    if (carIdx === -1) return { rows: [], rowCount: 0 };

    localStore.tables.cars[carIdx] = {
      ...localStore.tables.cars[carIdx],
      name: params[0],
      category: params[1],
      image_url: params[2],
      price_12hr: Number(params[3]),
      price_24hr: Number(params[4]),
      overage_rate_per_hr: Number(params[5]),
      transmission: params[6],
      seating: params[7]
    };
    localStore.save();
    return { rows: [localStore.tables.cars[carIdx]], rowCount: 1 };
  }

  // 5. DELETE FROM cars WHERE id = $1
  if (/^DELETE FROM cars WHERE id = \$1/i.test(normalized)) {
    const countBefore = localStore.tables.cars.length;
    localStore.tables.cars = localStore.tables.cars.filter(c => c.id !== params[0]);
    localStore.save();
    return { rows: [], rowCount: countBefore - localStore.tables.cars.length };
  }

  // 6. SELECT ... FROM users WHERE ...
  if (/SELECT .* FROM users WHERE/i.test(normalized)) {
    if (normalized.includes('id = $1') && !normalized.includes('OR')) {
      const user = localStore.tables.users.find(u => u.id === params[0] && (!params[1] || u.role === params[1]));
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    const param1 = params[0]?.toLowerCase();
    const param2 = params[1];
    const param3 = params[2];

    const user = localStore.tables.users.find(u => {
      const matchesEmailOrUserOrPhone =
        u.username?.toLowerCase() === param1 ||
        u.email?.toLowerCase() === param1 ||
        u.phone === param1;
      const matchesId = param2 && u.id === param2;
      const roleFilter = param3 || (param2 === 'admin' || param2 === 'user' ? param2 : null);
      const matchesRole = !roleFilter || u.role === roleFilter;

      return (matchesEmailOrUserOrPhone || matchesId) && matchesRole;
    });

    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 7. INSERT INTO users (...) VALUES (...)
  if (/^INSERT INTO users/i.test(normalized)) {
    const newUser = {
      id: params[0],
      name: params[1],
      username: params[2],
      email: params[3],
      phone: params[4],
      password_hash: params[5],
      role: params[6],
      created_at: new Date().toISOString()
    };
    localStore.tables.users.push(newUser);
    localStore.save();
    return { rows: [newUser], rowCount: 1 };
  }

  // 8. Metrics aggregates: COUNT(*) or status, COUNT(*)
  if (/COUNT/i.test(normalized)) {
    if (/FROM cars/i.test(normalized)) {
      return { rows: [{ count: localStore.tables.cars.length }], rowCount: 1 };
    }
    if (/FROM requests/i.test(normalized)) {
      const pending = localStore.tables.requests.filter(r => r.status.includes('Pending')).length;
      const confirmed = localStore.tables.requests.filter(r => r.status === 'Confirmed').length;
      const completed = localStore.tables.requests.filter(r => r.status === 'Completed').length;
      return {
        rows: [
          { status: 'Pending Confirmation', count: pending },
          { status: 'Confirmed', count: confirmed },
          { status: 'Completed', count: completed }
        ],
        rowCount: 3
      };
    }
  }

  // 9. SELECT ... FROM requests
  if (/SELECT .* FROM requests/i.test(normalized)) {
    let results = [...localStore.tables.requests];
    if (normalized.includes('WHERE user_id = $1')) {
      results = results.filter(r => r.user_id === params[0]);
    }
    // Sort desc by created_at
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: results, rowCount: results.length };
  }

  // 10. INSERT INTO requests (...) VALUES (...) RETURNING *
  if (/^INSERT INTO requests/i.test(normalized)) {
    const newReq = {
      id: params[0],
      user_id: params[1],
      car_id: params[2],
      customer_name: params[3],
      customer_phone: params[4],
      customer_email: params[5],
      car_name: params[6],
      requested_duration: params[7],
      expected_duration_note: params[8] || '',
      requested_start_time: params[9],
      estimated_base_price: Number(params[10]) || 0,
      status: params[11] || 'Pending Confirmation',
      admin_notes: params[12] || '',
      created_at: new Date().toISOString()
    };
    localStore.tables.requests.unshift(newReq);
    localStore.save();
    return { rows: [newReq], rowCount: 1 };
  }

  // 11. UPDATE requests SET status = $1, admin_notes = ... WHERE id = $... RETURNING *
  if (/^UPDATE requests SET status = \$1/i.test(normalized)) {
    const status = params[0];
    const adminNotes = params[1];
    const id = params[2];

    const idx = localStore.tables.requests.findIndex(r => r.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };

    localStore.tables.requests[idx].status = status;
    if (adminNotes !== undefined && adminNotes !== null) {
      localStore.tables.requests[idx].admin_notes = adminNotes;
    }
    localStore.save();
    return { rows: [localStore.tables.requests[idx]], rowCount: 1 };
  }

  // 12. UPDATE requests SET admin_notes = $1 WHERE id = $2 RETURNING *
  if (/^UPDATE requests SET admin_notes = \$1/i.test(normalized)) {
    const adminNotes = params[0];
    const id = params[1];

    const idx = localStore.tables.requests.findIndex(r => r.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };

    localStore.tables.requests[idx].admin_notes = adminNotes;
    localStore.save();
    return { rows: [localStore.tables.requests[idx]], rowCount: 1 };
  }

  // 13. UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *
  if (/^UPDATE users SET password_hash = \$1/i.test(normalized)) {
    const passwordHash = params[0];
    const id = params[1];

    const idx = localStore.tables.users.findIndex(u => u.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };

    localStore.tables.users[idx].password_hash = passwordHash;
    localStore.save();
    return { rows: [localStore.tables.users[idx]], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

/**
 * Initialize Relational Database Schema and Initial Data
 */
export async function initDb() {
  console.log('[Database] Initializing relational database schema...');

  if (usePostgres && pgPool) {
    try {
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
      await pgPool.query(schemaSql);
      console.log('[PostgreSQL] Database tables verified/created successfully.');
    } catch (err) {
      console.error('[PostgreSQL Schema Init Error]:', err);
    }
  }

  // Verify and seed initial data if cars table is empty
  const carsCheck = await query('SELECT * FROM cars');
  if (carsCheck.rowCount === 0) {
    console.log('[Database] Seeding initial fleet into relational cars table...');
    for (const car of INITIAL_CARS_DATA) {
      await query(
        `INSERT INTO cars (id, name, category, image_url, price_12hr, price_24hr, overage_rate_per_hr, transmission, seating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          car.id,
          car.name,
          car.category,
          car.image_url,
          car.price_12hr,
          car.price_24hr,
          car.overage_rate_per_hr,
          car.transmission,
          car.seating
        ]
      );
    }
  }

  // Verify and seed initial requests if requests table is empty
  const reqCheck = await query('SELECT * FROM requests');
  if (reqCheck.rowCount === 0) {
    console.log('[Database] Seeding initial requests into relational requests table...');
    for (const req of INITIAL_REQUESTS_DATA) {
      await query(
        `INSERT INTO requests (id, user_id, car_id, customer_name, customer_phone, customer_email, car_name, requested_duration, expected_duration_note, requested_start_time, estimated_base_price, status, admin_notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          req.id,
          req.user_id,
          req.car_id,
          req.customer_name,
          req.customer_phone,
          req.customer_email,
          req.car_name,
          req.requested_duration,
          req.expected_duration_note,
          req.requested_start_time,
          req.estimated_base_price,
          req.status,
          req.admin_notes,
          req.created_at
        ]
      );
    }
  }
}

// -------------------------------------------------------------
// Row Mapping Helpers (snake_case DB -> API DTO)
// -------------------------------------------------------------
export function mapCarRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    imageUrl: row.image_url,
    image_url: row.image_url,
    price12Hr: Number(row.price_12hr),
    price_12hr: Number(row.price_12hr),
    price24Hr: Number(row.price_24hr),
    price_24hr: Number(row.price_24hr),
    overageRatePerHr: Number(row.overage_rate_per_hr),
    overage_rate_per_hr: Number(row.overage_rate_per_hr),
    transmission: row.transmission,
    seating: row.seating,
    createdAt: row.created_at,
    created_at: row.created_at
  };
}

export function mapRequestRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    carId: row.car_id,
    car_id: row.car_id,
    customerName: row.customer_name,
    customer_name: row.customer_name,
    customerPhone: row.customer_phone,
    customer_phone: row.customer_phone,
    customerEmail: row.customer_email,
    customer_email: row.customer_email,
    carName: row.car_name,
    car_name: row.car_name,
    duration: row.requested_duration,
    requested_duration: row.requested_duration,
    expectedDurationNote: row.expected_duration_note,
    expected_duration_note: row.expected_duration_note,
    startDateTime: row.requested_start_time,
    requested_start_time: row.requested_start_time,
    estimatedBasePrice: Number(row.estimated_base_price),
    estimated_base_price: Number(row.estimated_base_price),
    status: row.status,
    adminNotes: row.admin_notes,
    admin_notes: row.admin_notes,
    createdAt: row.created_at,
    created_at: row.created_at
  };
}

export function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
    created_at: row.created_at
  };
}
