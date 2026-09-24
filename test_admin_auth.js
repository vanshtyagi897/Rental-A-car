// Automated verification script for Admin Authentication and Protected API endpoints

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('=== Starting Admin Authentication & Protected Route Verification ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Unauthenticated access to protected route should fail (401)
    console.log('--- Test 1: Protected route access without token ---');
    const unauthRes = await fetch(`${BASE_URL}/api/admin/me`);
    assert(unauthRes.status === 401, 'GET /api/admin/me without token returns 401 Unauthorized');

    // 2. Login with invalid password
    console.log('\n--- Test 2: Admin login with incorrect password ---');
    const badLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'POST /api/admin/login with wrong password returns 401');

    // 3. Login with valid seed credentials
    console.log('\n--- Test 3: Admin login with valid seeded credentials ---');
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/admin/login with valid credentials returns 200 OK');
    assert(!!loginData.token, 'Response contains signed JWT token');
    assert(loginData.admin && loginData.admin.role === 'admin', 'Response returns admin object with role: admin');

    const adminToken = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // 4. Validate session via /api/admin/me
    console.log('\n--- Test 4: Verify session with Bearer token ---');
    const meRes = await fetch(`${BASE_URL}/api/admin/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/admin/me returns 200 OK with valid token');
    assert(meData.admin && meData.admin.username === 'admin', 'Returned user matches authenticated admin');

    // 5. Access protected dashboard
    console.log('\n--- Test 5: Fetch protected dashboard metrics ---');
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: authHeaders });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'GET /api/admin/dashboard returns 200 OK');
    assert(dashData.metrics && typeof dashData.metrics.totalCars === 'number', 'Metrics contain totalCars count');

    // 6. Access protected requests
    console.log('\n--- Test 6: Fetch all requests ---');
    const reqsRes = await fetch(`${BASE_URL}/api/admin/requests`, { headers: authHeaders });
    const reqsData = await reqsRes.json();
    assert(reqsRes.status === 200, 'GET /api/admin/requests returns 200 OK');
    assert(Array.isArray(reqsData.requests), 'Returns requests array');

    // 7. Update request status and internal notes
    console.log('\n--- Test 7: Update request status and staff notes ---');
    const targetReq = reqsData.requests[0];
    if (targetReq) {
      const updateReqRes = await fetch(`${BASE_URL}/api/admin/requests/${targetReq.id}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'Confirmed',
          adminNotes: 'Security deposit confirmed. Aadhaar verified in person.'
        })
      });
      const updateReqData = await updateReqRes.json();
      assert(updateReqRes.status === 200, `PUT /api/admin/requests/${targetReq.id}/status returns 200 OK`);
      assert(updateReqData.request.status === 'Confirmed', 'Request status updated to Confirmed');
      assert(updateReqData.request.adminNotes.includes('Aadhaar verified'), 'Internal note updated correctly');
    }

    // 8. Edit car rates (12h, 24h, overage rate)
    console.log('\n--- Test 8: Edit vehicle 12-hr, 24-hr, and overage rates ---');
    const carsRes = await fetch(`${BASE_URL}/api/cars`);
    const carsData = await carsRes.json();
    const testCar = carsData.cars[0];
    if (testCar) {
      const updatedRates = {
        price12Hr: 1650,
        price24Hr: 2750,
        overageRatePerHr: 190
      };
      const updateCarRes = await fetch(`${BASE_URL}/api/admin/cars/${testCar.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updatedRates)
      });
      const updateCarData = await updateCarRes.json();
      assert(updateCarRes.status === 200, `PUT /api/admin/cars/${testCar.id} returns 200 OK`);
      assert(updateCarData.car.price12Hr === 1650, '12-Hr price updated to ₹1650');
      assert(updateCarData.car.price24Hr === 2750, '24-Hr price updated to ₹2750');
      assert(updateCarData.car.overageRatePerHr === 190, 'Overage rate updated to ₹190/hr');
    }

    // 9. Add new vehicle model to fleet
    console.log('\n--- Test 9: Add new vehicle model to fleet ---');
    const newCarPayload = {
      name: 'Mahindra XUV700 AX7',
      category: 'Luxury SUV',
      imageUrl: '/assets/thar.jpg',
      price12Hr: 3600,
      price24Hr: 6200,
      overageRatePerHr: 420,
      transmission: 'Automatic / Diesel AWD',
      seating: '7 Seater'
    };
    const addCarRes = await fetch(`${BASE_URL}/api/admin/cars`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newCarPayload)
    });
    const addCarData = await addCarRes.json();
    assert(addCarRes.status === 201, 'POST /api/admin/cars returns 201 Created');
    assert(addCarData.car && addCarData.car.name === newCarPayload.name, 'New car added successfully');

    // 10. Delete vehicle from fleet
    console.log('\n--- Test 10: Delete vehicle from fleet ---');
    if (addCarData.car && addCarData.car.id) {
      const delCarRes = await fetch(`${BASE_URL}/api/admin/cars/${addCarData.car.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      assert(delCarRes.status === 200, `DELETE /api/admin/cars/${addCarData.car.id} returns 200 OK`);
    }

    // 11. Public booking request submission
    console.log('\n--- Test 11: Customer public booking request ---');
    const customerReqPayload = {
      carId: 'car-1',
      carName: 'Baleno',
      customerName: 'Aakash Verma',
      customerPhone: '+91 99887 76655',
      customerEmail: 'aakash@example.com',
      duration: '12 Hours',
      startDateTime: '2026-09-25T10:00',
      estimatedBasePrice: 1650
    };
    const pubReqRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerReqPayload)
    });
    const pubReqData = await pubReqRes.json();
    assert(pubReqRes.status === 201, 'POST /api/requests creates customer booking with 201 Created');
    assert(pubReqData.request.status === 'Pending Confirmation', 'New request starts in "Pending Confirmation" status');

    console.log(`\n========================================`);
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
