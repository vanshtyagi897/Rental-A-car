// ============================================================================
// Comprehensive Pre-Deployment Verification Test Suite
// K&K Car Rentals — Fixed Slot Fleet Booking Platform
// ============================================================================

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess = null;
let passedCount = 0;
let failedCount = 0;
const results = [];

function recordResult(testName, passed, details = '') {
  if (passed) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
    results.push({ testName, status: 'PASS', details });
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    results.push({ testName, status: 'FAIL', details });
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`\n[Test Runner] Starting background test server on port ${PORT}...`);
    
    serverProcess = spawn('node', ['server/server.js'], {
      cwd: __dirname,
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let started = false;

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Backend API running') || msg.includes(`http://localhost:${PORT}`)) {
        if (!started) {
          started = true;
          resolve();
        }
      }
    });

    serverProcess.stderr.on('data', (data) => {
      // console.error('[Server Log]:', data.toString());
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });

    // Timeout safety fallback
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve();
      }
    }, 3000);
  });
}

function stopServer() {
  if (serverProcess) {
    console.log('\n[Test Runner] Stopping test server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// ----------------------------------------------------------------------------
// Test Execution
// ----------------------------------------------------------------------------

async function runAllTests() {
  console.log('================================================================');
  console.log('🚀 K&K CAR RENTALS — PRE-DEPLOYMENT VERIFICATION SUITE');
  console.log('================================================================');

  try {
    // ---------------------------------------------------------
    // TEST SUITE 1: Production Frontend Build & Dist Verification
    // ---------------------------------------------------------
    console.log('\n📦 [Suite 1/6] Production Build & Static Assets');
    const distIndexPath = path.join(__dirname, 'dist', 'index.html');
    const distAssetsPath = path.join(__dirname, 'dist', 'assets');

    recordResult(
      'dist/index.html is generated and readable',
      fs.existsSync(distIndexPath) && fs.statSync(distIndexPath).size > 100
    );

    recordResult(
      'dist/assets directory contains compiled JS/CSS bundles',
      fs.existsSync(distAssetsPath) && fs.readdirSync(distAssetsPath).length > 5
    );

    const indexHtmlContent = fs.existsSync(distIndexPath) ? fs.readFileSync(distIndexPath, 'utf-8') : '';
    recordResult(
      'dist/index.html contains valid HTML5 doctype & title tag',
      indexHtmlContent.includes('<!DOCTYPE html>') && indexHtmlContent.includes('K&amp;K Car Rentals')
    );

    // ---------------------------------------------------------
    // TEST SUITE 2: Server Startup, Health & SPA Static Serving
    // ---------------------------------------------------------
    await startServer();
    await wait(800);

    console.log('\n🌐 [Suite 2/6] Server Health & Static SPA Routing');

    // Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    recordResult(
      'GET /api/health returns 200 OK with healthy status',
      healthRes.status === 200 && healthData.status === 'healthy',
      `status: ${healthRes.status}`
    );

    // Static root route (SPA entrypoint)
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootHtml = await rootRes.text();
    recordResult(
      'GET / serves frontend index.html with 200 OK',
      rootRes.status === 200 && rootHtml.includes('<!DOCTYPE html>')
    );

    // SPA client-side deep route fallback
    const spaRes = await fetch(`${BASE_URL}/requests`);
    const spaHtml = await spaRes.text();
    recordResult(
      'GET /requests SPA client route properly falls back to index.html',
      spaRes.status === 200 && spaHtml.includes('<!DOCTYPE html>')
    );

    // ---------------------------------------------------------
    // TEST SUITE 3: Public Catalog & Booking Requests API
    // ---------------------------------------------------------
    console.log('\n🚗 [Suite 3/6] Public Catalog & Booking Submissions');

    const carsRes = await fetch(`${BASE_URL}/api/cars`);
    const carsData = await carsRes.json();
    recordResult(
      'GET /api/cars returns 200 OK and array of active vehicles',
      carsRes.status === 200 && Array.isArray(carsData.cars) && carsData.cars.length >= 10,
      `Vehicle count: ${carsData.cars?.length}`
    );

    const sampleCar = carsData.cars ? carsData.cars[0] : null;
    recordResult(
      'Car entity includes required pricing structure (12hr, 24hr, overage)',
      sampleCar &&
      typeof sampleCar.price12Hr === 'number' &&
      typeof sampleCar.price24Hr === 'number' &&
      typeof sampleCar.overageRatePerHr === 'number' &&
      sampleCar.price12Hr > 0 && sampleCar.price24Hr > sampleCar.price12Hr,
      `Sample car: ${sampleCar?.name} (12h: ₹${sampleCar?.price12Hr}, 24h: ₹${sampleCar?.price24Hr})`
    );

    // Request validation check (empty body)
    const invalidBookingRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    recordResult(
      'POST /api/requests validates mandatory fields and returns 400 Bad Request',
      invalidBookingRes.status === 400,
      `Returned status: ${invalidBookingRes.status}`
    );

    // Valid booking submission
    const testBookingPayload = {
      carId: sampleCar ? sampleCar.id : 'car-1',
      carName: sampleCar ? sampleCar.name : 'Baleno',
      customerName: 'Deployment Verification Agent',
      customerPhone: '+91 99988 77766',
      customerEmail: 'deploy.check@example.com',
      duration: '24 Hours',
      expectedDurationNote: 'Automated test booking',
      startDateTime: '2026-09-25T10:00',
      estimatedBasePrice: sampleCar ? sampleCar.price24Hr : 2400,
      userId: 'user-deploy-test'
    };

    const validBookingRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBookingPayload)
    });
    const validBookingData = await validBookingRes.json();
    const createdRequestId = validBookingData.request?.id;

    recordResult(
      'POST /api/requests creates booking with 201 Created and "Pending Confirmation" status',
      validBookingRes.status === 201 &&
      validBookingData.request &&
      validBookingData.request.status === 'Pending Confirmation',
      `Request ID: ${createdRequestId}`
    );

    // Customer request query
    const userReqsRes = await fetch(`${BASE_URL}/api/requests?userId=user-deploy-test`);
    const userReqsData = await userReqsRes.json();
    recordResult(
      'GET /api/requests?userId=... filters requests for authenticated customer',
      userReqsRes.status === 200 &&
      Array.isArray(userReqsData.requests) &&
      userReqsData.requests.some(r => r.id === createdRequestId),
      `Found user requests: ${userReqsData.requests?.length}`
    );

    // ---------------------------------------------------------
    // TEST SUITE 4: Security & Authentication Controls
    // ---------------------------------------------------------
    console.log('\n🔒 [Suite 4/6] Security & Administrative Authentication');

    const unauthMeRes = await fetch(`${BASE_URL}/api/admin/me`);
    recordResult(
      'GET /api/admin/me without Authorization header returns 401 Unauthorized',
      unauthMeRes.status === 401
    );

    const unauthDashRes = await fetch(`${BASE_URL}/api/admin/dashboard`);
    recordResult(
      'GET /api/admin/dashboard without Authorization header returns 401 Unauthorized',
      unauthDashRes.status === 401
    );

    const unauthAddCarRes = await fetch(`${BASE_URL}/api/admin/cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Car' })
    });
    recordResult(
      'POST /api/admin/cars without Authorization header returns 401 Unauthorized',
      unauthAddCarRes.status === 401
    );

    // Failed login test
    const badLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'incorrect_password_xyz' })
    });
    recordResult(
      'POST /api/admin/login with incorrect credentials returns 401 Unauthorized',
      badLoginRes.status === 401
    );

    // Successful admin login
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.token;

    recordResult(
      'POST /api/admin/login returns 200 OK, signed JWT token, and admin profile',
      loginRes.status === 200 &&
      !!adminToken &&
      loginData.admin?.role === 'admin',
      `Admin: ${loginData.admin?.name}`
    );

    // Test 1: Send OTP with invalid email (should return 404)
    const badEmailOtpRes = await fetch(`${BASE_URL}/api/auth/send-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent.user@randomdomain.xyz', role: 'admin' })
    });
    recordResult(
      'POST /api/auth/send-reset-otp rejects non-existent email with 404',
      badEmailOtpRes.status === 404
    );

    // Test 2: Send OTP with valid admin email
    const validOtpRes = await fetch(`${BASE_URL}/api/auth/send-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kkrentals.com', role: 'admin' })
    });
    const validOtpData = await validOtpRes.json();
    const testOtp = validOtpData.otpDebug;

    recordResult(
      'POST /api/auth/send-reset-otp generates 6-digit OTP for registered account',
      validOtpRes.status === 200 && !!testOtp && testOtp.length === 6,
      `Generated OTP: ${testOtp}`
    );

    // Test 3: Password reset with incorrect OTP (should return 400)
    const wrongOtpRes = await fetch(`${BASE_URL}/api/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@kkrentals.com',
        otp: '000000',
        newPassword: 'newAdminPassword123'
      })
    });
    recordResult(
      'POST /api/admin/reset-password rejects invalid OTP with 400 Bad Request',
      wrongOtpRes.status === 400
    );

    // Test 4: Password reset with valid OTP
    const resetAdminPassRes = await fetch(`${BASE_URL}/api/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@kkrentals.com',
        otp: testOtp,
        newPassword: 'newAdminPassword123'
      })
    });
    const resetAdminPassData = await resetAdminPassRes.json();
    recordResult(
      'POST /api/admin/reset-password updates admin password hash with valid OTP',
      resetAdminPassRes.status === 200 && resetAdminPassData.success === true
    );

    // Verify login with new password
    const newPassLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'newAdminPassword123' })
    });
    recordResult(
      'POST /api/admin/login succeeds with newly reset password',
      newPassLoginRes.status === 200
    );

    // Restore standard default password for next runs
    const restoreOtpRes = await fetch(`${BASE_URL}/api/auth/send-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kkrentals.com', role: 'admin' })
    });
    const restoreOtpData = await restoreOtpRes.json();
    if (restoreOtpData.otpDebug) {
      await fetch(`${BASE_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@kkrentals.com',
          otp: restoreOtpData.otpDebug,
          newPassword: 'admin123'
        })
      });
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // Verify session
    const meRes = await fetch(`${BASE_URL}/api/admin/me`, { headers: authHeaders });
    const meData = await meRes.json();
    recordResult(
      'GET /api/admin/me with Bearer token validates identity',
      meRes.status === 200 && meData.admin?.username === 'admin'
    );

    // ---------------------------------------------------------
    // TEST SUITE 5: Protected Admin Operations & Workflows
    // ---------------------------------------------------------
    console.log('\n⚙️  [Suite 5/6] Protected Admin Operations & Fleet Control');

    // Dashboard metrics
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: authHeaders });
    const dashData = await dashRes.json();
    recordResult(
      'GET /api/admin/dashboard returns operational metrics (totalCars, pendingRequests, activeRentals)',
      dashRes.status === 200 &&
      typeof dashData.metrics?.totalCars === 'number' &&
      typeof dashData.metrics?.pendingRequests === 'number',
      `Metrics: totalCars=${dashData.metrics?.totalCars}, pending=${dashData.metrics?.pendingRequests}`
    );

    // Update request status to Confirmed
    if (createdRequestId) {
      const updateStatusRes = await fetch(`${BASE_URL}/api/admin/requests/${createdRequestId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'Confirmed',
          adminNotes: 'Security deposit confirmed via UPI. Original Aadhaar checked at dispatch desk.'
        })
      });
      const updateStatusData = await updateStatusRes.json();
      recordResult(
        'PUT /api/admin/requests/:id/status updates status to "Confirmed" with staff notes',
        updateStatusRes.status === 200 &&
        updateStatusData.request?.status === 'Confirmed' &&
        updateStatusData.request?.adminNotes.includes('Original Aadhaar checked')
      );

      // Update staff notes only
      const updateNotesRes = await fetch(`${BASE_URL}/api/admin/requests/${createdRequestId}/notes`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          adminNotes: 'Customer requested 2-hour extension. Revised pickup confirmed.'
        })
      });
      const updateNotesData = await updateNotesRes.json();
      recordResult(
        'PUT /api/admin/requests/:id/notes updates internal dispatch notes',
        updateNotesRes.status === 200 &&
        updateNotesData.request?.adminNotes.includes('Revised pickup confirmed')
      );
    }

    // Add new car model
    const newCarPayload = {
      name: 'Hyundai Alcazar Signature',
      category: 'Premium 6/7 Seater',
      imageUrl: '/assets/creta.jpg',
      price12Hr: 2600,
      price24Hr: 4500,
      overageRatePerHr: 300,
      transmission: 'Automatic / Diesel',
      seating: '6 Seater'
    };

    const addCarRes = await fetch(`${BASE_URL}/api/admin/cars`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newCarPayload)
    });
    const addCarData = await addCarRes.json();
    const createdCarId = addCarData.car?.id;

    recordResult(
      'POST /api/admin/cars successfully creates a new vehicle in catalog',
      addCarRes.status === 201 &&
      addCarData.car?.name === newCarPayload.name &&
      addCarData.car?.price12Hr === 2600,
      `Created Car ID: ${createdCarId}`
    );

    // Update car rates
    if (createdCarId) {
      const updateCarRes = await fetch(`${BASE_URL}/api/admin/cars/${createdCarId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          price12Hr: 2750,
          price24Hr: 4800,
          overageRatePerHr: 320
        })
      });
      const updateCarData = await updateCarRes.json();
      recordResult(
        'PUT /api/admin/cars/:id updates vehicle rates in database immediately',
        updateCarRes.status === 200 &&
        updateCarData.car?.price12Hr === 2750 &&
        updateCarData.car?.price24Hr === 4800 &&
        updateCarData.car?.overageRatePerHr === 320
      );

      // Delete test car
      const deleteCarRes = await fetch(`${BASE_URL}/api/admin/cars/${createdCarId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      recordResult(
        'DELETE /api/admin/cars/:id removes vehicle from active database',
        deleteCarRes.status === 200
      );
    }

    // ---------------------------------------------------------
    // TEST SUITE 6: Database Persistence & Storage Integrity
    // ---------------------------------------------------------
    console.log('\n💾 [Suite 6/6] Storage Integrity & Persistence');
    const checkCarsRes = await fetch(`${BASE_URL}/api/cars`);
    const checkCarsData = await checkCarsRes.json();
    recordResult(
      'Public catalog accurately reflects current database state',
      checkCarsRes.status === 200 &&
      checkCarsData.cars.length >= 10 &&
      !checkCarsData.cars.some(c => c.id === createdCarId)
    );

    // ---------------------------------------------------------
    // Summary
    // ---------------------------------------------------------
    console.log('\n================================================================');
    console.log(`📊 TEST EXECUTION SUMMARY: Total: ${passedCount + failedCount} | Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log('================================================================');

    stopServer();

    if (failedCount > 0) {
      console.error('\n❌ One or more deployment readiness tests failed.');
      process.exit(1);
    } else {
      console.log('\n✨ ALL DEPLOYMENT READINESS TESTS PASSED! Project is ready for deployment.');
      process.exit(0);
    }
  } catch (err) {
    console.error('\n💥 Unexpected error during test run:', err);
    stopServer();
    process.exit(1);
  }
}

runAllTests();
