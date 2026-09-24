import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'kk_car_rentals_jwt_secret_token_2026';
export const JWT_EXPIRES_IN = '7d';

/**
 * Server-side Admin Role Verification Middleware
 * Validates the JWT bearer token and verifies the user in the relational database with role === 'admin'.
 */
export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or malformed authorization token',
        code: 'AUTH_REQUIRED'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid session token',
        code: 'TOKEN_INVALID'
      });
    }

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Administrative role required',
        code: 'FORBIDDEN'
      });
    }

    // Verify user exists with role: 'admin' in relational database
    const userRes = await query('SELECT id, name, username, email, phone, role FROM users WHERE id = $1 AND role = $2', [decoded.id, 'admin']);
    
    if (userRes.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: 'Admin user not found or account disabled',
        code: 'USER_NOT_FOUND'
      });
    }

    const adminUser = userRes.rows[0];

    // Attach admin info to request
    req.admin = {
      id: adminUser.id,
      username: adminUser.username,
      name: adminUser.name,
      email: adminUser.email,
      phone: adminUser.phone,
      role: adminUser.role
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication verification'
    });
  }
}
