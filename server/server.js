import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query, initDb, mapCarRow, mapRequestRow, mapUserRow } from './db.js';
import { seedDatabase } from './seed.js';
import { requireAdmin, JWT_SECRET, JWT_EXPIRES_IN } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Relational Schema and Seed Data on Server Startup
(async () => {
  try {
    await initDb();
    await seedDatabase(false);
    console.log('[Server] Relational database initialized successfully.');
  } catch (err) {
    console.error('[Server Init Error]:', err);
  }
})();

// -------------------------------------------------------------
// PUBLIC CUSTOMER ROUTES (All Database reads/writes via server)
// -------------------------------------------------------------

/**
 * GET /api/cars
 * Public: Browse all vehicle models and current rates from relational database
 */
app.get('/api/cars', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM cars ORDER BY id ASC');
    res.json({
      success: true,
      cars: rows.map(mapCarRow)
    });
  } catch (error) {
    console.error('[Get Cars Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve vehicles from database' });
  }
});

/**
 * POST /api/requests
 * Public: Customer submits a rental booking request into relational database
 */
app.post('/api/requests', async (req, res) => {
  try {
    const {
      carId,
      carName,
      customerName,
      customerPhone,
      customerEmail,
      duration,
      expectedDurationNote,
      startDateTime,
      estimatedBasePrice,
      userId
    } = req.body;

    if (!carId || !customerName || !customerPhone || !startDateTime || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking fields (car, customer details, duration, start time).'
      });
    }

    const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveUserId = userId || 'user-default';

    const insertSql = `
      INSERT INTO requests (
        id, user_id, car_id, customer_name, customer_phone, customer_email,
        car_name, requested_duration, expected_duration_note, requested_start_time,
        estimated_base_price, status, admin_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const params = [
      requestId,
      effectiveUserId,
      carId,
      customerName.trim(),
      customerPhone.trim(),
      customerEmail ? customerEmail.trim() : '',
      carName || 'Requested Vehicle',
      duration,
      expectedDurationNote ? expectedDurationNote.trim() : '',
      startDateTime,
      Number(estimatedBasePrice) || 0,
      'Pending Confirmation',
      'Booking request received. Awaiting staff review.'
    ];

    const { rows } = await query(insertSql, params);

    res.status(201).json({
      success: true,
      request: mapRequestRow(rows[0])
    });
  } catch (error) {
    console.error('[Create Request Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to submit booking request' });
  }
});

/**
 * GET /api/requests
 * Customer: Get requests for a specific user from relational database
 */
app.get('/api/requests', async (req, res) => {
  try {
    const { userId } = req.query;

    let sql = 'SELECT * FROM requests';
    let params = [];

    if (userId) {
      sql += ' WHERE user_id = $1';
      params.push(userId);
    }

    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);

    res.json({
      success: true,
      requests: rows.map(mapRequestRow)
    });
  } catch (error) {
    console.error('[Get Requests Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch requests' });
  }
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION ROUTES (Verified via Relational Users Table)
// -------------------------------------------------------------

/**
 * POST /api/admin/login
 * Staff: Authenticate with username and password against PostgreSQL users table
 */
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both username and password.'
      });
    }

    const { rows } = await query(
      'SELECT * FROM users WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)) AND role = $2',
      [username.trim(), 'admin']
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid administrative credentials.'
      });
    }

    const user = rows[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid administrative credentials.'
      });
    }

    // Generate signed JWT token with role: 'admin'
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      admin: mapUserRow(user)
    });
  } catch (error) {
    console.error('[Admin Login Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
});

/**
 * GET /api/admin/me
 * Protected: Validate current admin token and return session data from database
 */
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

/**
 * POST /api/admin/logout
 * Protected: Logout confirmation
 */
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// ONE-TIME PASSWORD (OTP) RESET STORE & ENDPOINTS
// -------------------------------------------------------------

// In-memory OTP storage for secure password reset verification
// Key: normalized email, Value: { otp, userId, role, expiresAt }
const resetOtpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/auth/send-reset-otp
 * Public: Validate registered email and generate secure 6-digit OTP
 */
app.post('/api/auth/send-reset-otp', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid registered email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if account exists
    let sql = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    let params = [cleanEmail];
    if (role === 'admin') {
      sql = 'SELECT * FROM users WHERE (LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)) AND role = $2';
      params = [cleanEmail, 'admin'];
    }

    const { rows } = await query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: role === 'admin'
          ? 'No administrative account found with this email address.'
          : 'No account found with this email address.'
      });
    }

    const targetUser = rows[0];
    const targetEmail = (targetUser.email || cleanEmail).toLowerCase();

    // Generate secure 6-digit numeric OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    resetOtpStore.set(targetEmail, {
      otp,
      userId: targetUser.id,
      role: targetUser.role,
      expiresAt
    });

    console.log(`[Security OTP] Password reset OTP for ${targetEmail}: ${otp} (Valid for 10 minutes)`);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${targetEmail}.`,
      email: targetEmail,
      otpDebug: otp // Displayed for testing / demo convenience
    });
  } catch (err) {
    console.error('[Send Reset OTP Error]:', err);
    res.status(500).json({ success: false, error: 'Internal error generating verification code.' });
  }
});

/**
 * POST /api/admin/reset-password
 * Staff: Reset admin password by verifying registered email + 6-digit OTP
 */
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide registered email, 6-digit OTP code, and new password.'
      });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const storedOtpData = resetOtpStore.get(cleanEmail);

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        error: 'No active OTP verification session found. Please click "Send OTP" first.'
      });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      resetOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new OTP.'
      });
    }

    if (storedOtpData.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code. Please check and re-enter the 6-digit OTP.'
      });
    }

    // OTP verified! Retrieve user and update password
    const { rows } = await query(
      'SELECT * FROM users WHERE (LOWER(email) = LOWER($1) OR id = $2) AND role = $3',
      [cleanEmail, storedOtpData.userId || '', 'admin']
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Administrative account could not be found.'
      });
    }

    const user = rows[0];
    const newHash = bcrypt.hashSync(newPassword.trim(), 10);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, user.id]
    );

    // Invalidate OTP after single successful use
    resetOtpStore.delete(cleanEmail);

    res.json({
      success: true,
      message: 'Administrative password updated successfully. You can now log in.'
    });
  } catch (error) {
    console.error('[Admin Reset Password Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error while updating password.' });
  }
});

/**
 * POST /api/user/reset-password
 * Customer: Reset customer account password via registered email + 6-digit OTP
 */
app.post('/api/user/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide registered email, 6-digit OTP code, and new password.'
      });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const storedOtpData = resetOtpStore.get(cleanEmail);

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        error: 'No active OTP verification session found. Please click "Send OTP" first.'
      });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      resetOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new OTP.'
      });
    }

    if (storedOtpData.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code. Please check and re-enter the 6-digit OTP.'
      });
    }

    // OTP verified! Retrieve user and update password
    const { rows } = await query(
      'SELECT * FROM users WHERE (LOWER(email) = LOWER($1) OR id = $2)',
      [cleanEmail, storedOtpData.userId || '']
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address.'
      });
    }

    const user = rows[0];
    const newHash = bcrypt.hashSync(newPassword.trim(), 10);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, user.id]
    );

    // Invalidate OTP after single successful use
    resetOtpStore.delete(cleanEmail);

    res.json({
      success: true,
      message: 'Password updated successfully. You can now sign in.'
    });
  } catch (error) {
    console.error('[User Reset Password Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error while updating password.' });
  }
});

// -------------------------------------------------------------
// PROTECTED ADMIN MANAGEMENT ROUTES (All require requireAdmin)
// -------------------------------------------------------------

/**
 * GET /api/admin/dashboard
 * Protected: Summary metrics from relational tables
 */
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const carsCountRes = await query('SELECT COUNT(*) AS count FROM cars');
    const totalCars = Number(carsCountRes.rows[0]?.count || 0);

    const reqsRes = await query('SELECT status, COUNT(*) AS count FROM requests GROUP BY status');
    
    let pendingRequests = 0;
    let activeRentals = 0;
    let completedRentals = 0;

    for (const row of reqsRes.rows) {
      const count = Number(row.count || 0);
      if (row.status && row.status.includes('Pending')) {
        pendingRequests += count;
      } else if (row.status === 'Confirmed') {
        activeRentals += count;
      } else if (row.status === 'Completed') {
        completedRentals += count;
      }
    }

    res.json({
      success: true,
      metrics: {
        totalCars,
        pendingRequests,
        activeRentals,
        completedRentals
      }
    });
  } catch (error) {
    console.error('[Admin Dashboard Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard metrics' });
  }
});

/**
 * GET /api/admin/requests
 * Protected: Fetch all booking requests from relational database
 */
app.get('/api/admin/requests', requireAdmin, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM requests ORDER BY created_at DESC');
    res.json({
      success: true,
      requests: rows.map(mapRequestRow)
    });
  } catch (error) {
    console.error('[Admin Get Requests Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch requests' });
  }
});

/**
 * PUT /api/admin/requests/:id/status
 * Protected: Update request status and internal notes in relational database
 */
app.put('/api/admin/requests/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['Pending Confirmation', 'Confirmed', 'Completed', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateSql = `
      UPDATE requests
      SET status = $1,
          admin_notes = COALESCE($2, admin_notes)
      WHERE id = $3
      RETURNING *
    `;

    const { rows, rowCount } = await query(updateSql, [status, adminNotes, id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.json({
      success: true,
      request: mapRequestRow(rows[0])
    });
  } catch (error) {
    console.error('[Update Request Status Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to update request' });
  }
});

/**
 * PUT /api/admin/requests/:id/notes
 * Protected: Update internal notes only in relational database
 */
app.put('/api/admin/requests/:id/notes', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const updateSql = `
      UPDATE requests
      SET admin_notes = $1
      WHERE id = $2
      RETURNING *
    `;

    const { rows, rowCount } = await query(updateSql, [adminNotes || '', id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.json({
      success: true,
      request: mapRequestRow(rows[0])
    });
  } catch (error) {
    console.error('[Update Notes Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to update notes' });
  }
});

/**
 * POST /api/admin/cars
 * Protected: Add a new vehicle to fleet in relational database
 */
app.post('/api/admin/cars', requireAdmin, async (req, res) => {
  try {
    const { name, category, imageUrl, price12Hr, price24Hr, overageRatePerHr, transmission, seating } = req.body;

    if (!name || price12Hr === undefined || price24Hr === undefined) {
      return res.status(400).json({ success: false, error: 'Car name and prices are required' });
    }

    const carId = `car-${Date.now()}`;
    const insertSql = `
      INSERT INTO cars (
        id, name, category, image_url, price_12hr, price_24hr, overage_rate_per_hr, transmission, seating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      carId,
      name.trim(),
      category || 'Standard Vehicle',
      imageUrl?.trim() || '#',
      Number(price12Hr) || 0,
      Number(price24Hr) || 0,
      Number(overageRatePerHr) || 0,
      transmission || 'Manual / Petrol',
      seating || '5 Seater'
    ];

    const { rows } = await query(insertSql, params);

    res.status(201).json({
      success: true,
      car: mapCarRow(rows[0])
    });
  } catch (error) {
    console.error('[Add Car Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to add vehicle' });
  }
});

/**
 * PUT /api/admin/cars/:id
 * Protected: Edit vehicle details and 12h, 24h, and overage rates in relational database
 */
app.put('/api/admin/cars/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, imageUrl, price12Hr, price24Hr, overageRatePerHr, transmission, seating } = req.body;

    const existingRes = await query('SELECT * FROM cars WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    const current = existingRes.rows[0];

    const updateSql = `
      UPDATE cars
      SET name = $1,
          category = $2,
          image_url = $3,
          price_12hr = $4,
          price_24hr = $5,
          overage_rate_per_hr = $6,
          transmission = $7,
          seating = $8
      WHERE id = $9
      RETURNING *
    `;

    const params = [
      name !== undefined ? name.trim() : current.name,
      category !== undefined ? category : current.category,
      imageUrl !== undefined ? imageUrl.trim() : current.image_url,
      price12Hr !== undefined ? Number(price12Hr) : current.price_12hr,
      price24Hr !== undefined ? Number(price24Hr) : current.price_24hr,
      overageRatePerHr !== undefined ? Number(overageRatePerHr) : current.overage_rate_per_hr,
      transmission !== undefined ? transmission : current.transmission,
      seating !== undefined ? seating : current.seating,
      id
    ];

    const { rows } = await query(updateSql, params);

    res.json({
      success: true,
      car: mapCarRow(rows[0])
    });
  } catch (error) {
    console.error('[Update Car Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to update vehicle' });
  }
});

/**
 * DELETE /api/admin/cars/:id
 * Protected: Remove vehicle from relational database
 */
app.delete('/api/admin/cars/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await query('DELETE FROM cars WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    res.json({ success: true, message: 'Vehicle removed successfully' });
  } catch (error) {
    console.error('[Delete Car Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to delete vehicle' });
  }
});

// Health check endpoint for cloud monitoring & deployment probes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'postgresql' : 'relational-local'
  });
});

// Serve frontend static build if present (for single-service fullstack deployment)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA Fallback handler for client-side routing (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start listening
app.listen(PORT, () => {
  console.log(`[K&K Fleet Server] Backend API running at http://localhost:${PORT}`);
});
