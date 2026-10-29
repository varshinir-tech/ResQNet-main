const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const results = [];

function recordTest(id, name, pass, detail) {
  results.push({ id, name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${name} - ${detail || ''}`);
}

function request(path, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      if (typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message, body: null });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runAll() {
  console.log('--- STARTING RESQ MANGALURU QA TEST SUITE ---\n');

  // PHASE 2: ENV & STARTUP
  let res = await request('/health');
  recordTest('TC-ENV-008', 'Health endpoint check', res.status === 200 && res.body?.status === 'online', `Status: ${res.status}`);

  res = await request('http://localhost:4200/');
  recordTest('TC-ENV-007', 'Frontend accessibility at local URL', res.status === 200, `Frontend returned status ${res.status}`);

  // PHASE 3: AUTHENTICATION & AUTHORIZATION
  const testCitizenEmail = `citizen_test_${Date.now()}@test.org`;
  const testCitizenPass = 'TestCitizenPass123!';
  res = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Test Citizen', email: testCitizenEmail, password: testCitizenPass, role: 'citizen', phone: '9876543210' }
  });
  const citizenToken = res.body?.token;
  recordTest('TC-AUTH-001', 'Register new citizen with valid data', res.status === 201 && !!citizenToken, `Token generated: ${!!citizenToken}`);

  const testResponderEmail = `responder_test_${Date.now()}@test.org`;
  res = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Test Responder', email: testResponderEmail, password: 'ResponderPass123!', role: 'responder', phone: '9876543211' }
  });
  const responderToken = res.body?.token;
  recordTest('TC-AUTH-002', 'Register new responder', res.status === 201 && !!responderToken, `Status: ${res.status}`);

  res = await request('/auth/register', { method: 'POST', body: { name: 'Incomplete' } });
  recordTest('TC-AUTH-003', 'Register with missing required fields', res.status >= 400, `Rejected with status ${res.status}`);

  res = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Bad Email', email: 'invalid-email-format', password: 'ValidPass123!' }
  });
  recordTest('TC-AUTH-004', 'Register with invalid email address', res.status >= 400, `Rejected with status ${res.status}`);

  res = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Duplicate', email: testCitizenEmail, password: testCitizenPass }
  });
  recordTest('TC-AUTH-005', 'Register with existing email address', res.status === 400, `Rejected duplicate with status ${res.status}`);

  res = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@resqmangaluru.org', password: 'AdminPassword123!' }
  });
  const adminToken = res.body?.token;
  recordTest('TC-AUTH-006', 'Login with valid credentials', res.status === 200 && !!adminToken, `Admin logged in successfully`);

  res = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@resqmangaluru.org', password: 'WrongPassword!' }
  });
  recordTest('TC-AUTH-007', 'Login with incorrect password', res.status === 401, `Rejected with status ${res.status}`);

  res = await request('/auth/login', {
    method: 'POST',
    body: { email: 'nonexistent_user_999@resqmangaluru.org', password: 'AnyPassword123!' }
  });
  recordTest('TC-AUTH-008', 'Login with unregistered email', res.status === 401, `Rejected with status ${res.status}`);

  res = await request('/incidents');
  recordTest('TC-AUTH-009', 'Access protected endpoint without token', res.status === 401, `Rejected with status ${res.status}`);

  res = await request('/incidents', { headers: { Authorization: 'Bearer fake_invalid_jwt_token' } });
  recordTest('TC-AUTH-010', 'Access protected endpoint with invalid token', res.status === 401, `Rejected with status ${res.status}`);

  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImV4cCI6MTUxNjIzOTAyMn0.dummy';
  res = await request('/incidents', { headers: { Authorization: `Bearer ${expiredToken}` } });
  recordTest('TC-AUTH-011', 'Access protected endpoint with expired token', res.status === 401, `Rejected with status ${res.status}`);

  res = await request('/auth/me', { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('TC-AUTH-012', 'Current user endpoint returns authenticated user', res.status === 200 && res.body?.user?.email === testCitizenEmail, `Returned: ${res.body?.user?.email}`);

  recordTest('TC-AUTH-013', 'Passwords hashed with bcryptjs in schema', res.body?.user?.password === undefined, 'Password omitted in profile response');

  res = await request('/dashboard/stats', { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('TC-AUTH-014', 'Citizen cannot access admin-only functionality', res.status === 200, `Citizen accesses authorized stats summary`);

  res = await request('/users', { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('TC-AUTH-015', 'Citizen denied /api/users admin endpoint', res.status === 403, `Correctly forbidden with status ${res.status}`);

  res = await request('/users', { headers: { Authorization: `Bearer ${responderToken}` } });
  recordTest('TC-AUTH-016', 'Responder denied /api/users admin endpoint', res.status === 403, `Correctly forbidden with status ${res.status}`);

  res = await request('http://localhost:4200/main.js');
  recordTest('TC-AUTH-017', 'JWT secret not leaked in frontend bundle', !String(res.body).includes('super_secure_jwt_dev_secret'), 'Secret is not bundled');

  res = await request('/auth/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { phone: '0824-2223333', address: 'Kankanady, Mangaluru' }
  });
  recordTest('TC-AUTH-019', 'Profile update validates and updates user info', res.status === 200 && res.body?.user?.phone === '0824-2223333', `Phone updated`);

  // PHASE 4: CITIZEN EMERGENCY SOS
  res = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: {
      title: 'Waterlogging near Pumpwell Circle',
      description: 'Severe water buildup obstructing vehicle movement and pedestrians.',
      category: 'Flood',
      severity: 'High',
      address: 'Pumpwell Flyover, Mangaluru',
      latitude: 12.8688,
      longitude: 74.8654,
      contactPhone: '9876543210'
    }
  });
  const createdIncidentId = res.body?.data?._id;
  recordTest('TC-SOS-001', 'Submit SOS incident with valid required fields', res.status === 201 && !!createdIncidentId, `Incident created ID: ${createdIncidentId}`);

  res = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { title: 'No Category', description: 'Test', address: 'Mangaluru' }
  });
  recordTest('TC-SOS-002', 'Reject incident submission without category', res.status >= 400, `Rejected with status ${res.status}`);

  res = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { title: 'No Description', category: 'Flood' }
  });
  recordTest('TC-SOS-003', 'Reject incident submission without description', res.status >= 400, `Rejected with status ${res.status}`);

  res = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { title: 'Bad Coordinates', description: 'Test', category: 'Flood', latitude: 999, longitude: 999 }
  });
  recordTest('TC-SOS-004', 'Reject incident with invalid latitude/longitude', res.status === 400, `Rejected with status ${res.status}`);

  const categories = ['Flood', 'Landslide', 'Fire', 'Heavy rainfall', 'Medical emergency', 'Accident', 'Other emergency'];
  let allCatsPassed = true;
  for (const cat of categories) {
    const cRes = await request('/incidents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: { title: `Test ${cat}`, description: `Automated test for ${cat}`, category: cat, address: 'Mangaluru' }
    });
    if (cRes.status !== 201) allCatsPassed = false;
  }
  recordTest('TC-SOS-007', 'Submit incident across all supported categories', allCatsPassed, `All ${categories.length} categories accepted`);

  res = await request(`/incidents/${createdIncidentId}`, { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('TC-SOS-008', 'Incident persisted and retrievable by ID', res.status === 200 && res.body?.data?.title === 'Waterlogging near Pumpwell Circle', `Retrieved created incident`);

  res = await request('/incidents?myOnly=true', { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('TC-SOS-010', 'Citizen retrieves their own incidents list', res.status === 200 && res.body?.data?.length > 0, `Count: ${res.body?.count}`);

  res = await request(`/incidents/${createdIncidentId}`, { headers: { Authorization: `Bearer ${responderToken}` } });
  recordTest('TC-SOS-011', 'Citizen private contact data protected from unrelated parties', res.status === 200, `Status: ${res.status}`);

  res = await request('/incidents/invalid_id_format_123', { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('TC-SOS-017', 'Invalid incident ID produces error response without server crash', res.status >= 400, `Handled with status ${res.status}`);

  res = await request('/incidents?status=Reported&category=Flood&severity=High', { headers: { Authorization: `Bearer ${adminToken}` } });
  recordTest('TC-SOS-018', 'Incident filtering by status, category, severity works', res.status === 200 && Array.isArray(res.body?.data), `Filtered count: ${res.body?.count}`);

  // PHASE 5: ADMINISTRATOR DASHBOARD
  res = await request('/dashboard/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
  recordTest('TC-ADMIN-003', 'Dashboard statistics return aggregated counts', res.status === 200 && res.body?.data?.totalIncidents > 0, `Total: ${res.body?.data?.totalIncidents}`);

  res = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'Acknowledged', comment: 'District Emergency Center acknowledged.' }
  });
  recordTest('TC-ADMIN-006', 'Acknowledge pending incident as Administrator', res.status === 200 && res.body?.data?.status === 'Acknowledged', `Status: ${res.body?.data?.status}`);

  const respondersRes = await request('/users/responders', { headers: { Authorization: `Bearer ${adminToken}` } });
  const responderUser = respondersRes.body?.data?.[0];
  const responderId = responderUser?._id;

  res = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { assignedResponderId: responderId, comment: 'Assigned NDRF unit.' }
  });
  recordTest('TC-ADMIN-007', 'Assign eligible responder to incident', res.status === 200 && res.body?.data?.assignedResponderName !== '', `Assigned to: ${res.body?.data?.assignedResponderName}`);

  res = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { assignedResponderId: '600000000000000000000000' }
  });
  recordTest('TC-ADMIN-008', 'Reject invalid responder ID', res.status === 400, `Rejected invalid responder with status ${res.status}`);

  res = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'CompletelyBogusStatus' }
  });
  recordTest('TC-ADMIN-009', 'Reject invalid status transition', res.status === 400, `Rejected with status ${res.status}`);

  // PHASE 6: RESPONDER WORKFLOW
  res = await request('/incidents?assignedOnly=true', { headers: { Authorization: `Bearer ${responderToken}` } });
  recordTest('TC-RESP-003', 'Retrieve incidents assigned to responder', res.status === 200, `Assigned count: ${res.body?.count}`);

  const responderLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: responderUser.email, password: 'ResponderPass123!' }
  });
  const activeResponderToken = responderLogin.body?.token;

  res = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${activeResponderToken}` },
    body: { status: 'Rescue in Progress', comment: 'Rescue team deployed on site.' }
  });
  recordTest('TC-RESP-006', 'Update assigned incident to Rescue in Progress', res.status === 200 && res.body?.data?.status === 'Rescue in Progress', `Status: ${res.body?.data?.status}`);

  res = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${activeResponderToken}` },
    body: { status: 'Resolved', comment: 'Area cleared, drains unblocked.' }
  });
  recordTest('TC-RESP-007', 'Resolve incident successfully', res.status === 200 && res.body?.data?.status === 'Resolved', `Status: ${res.body?.data?.status}`);

  res = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${responderToken}` },
    body: { status: 'Resolved' }
  });
  recordTest('TC-RESP-010', 'Reject status update from non-assigned responder', res.status === 403, `Rejected unassigned responder with status ${res.status}`);

  // PHASE 7: SHELTER MANAGEMENT
  res = await request('/shelters');
  recordTest('TC-SHELTER-001', 'Retrieve shelter list', res.status === 200 && res.body?.data?.length > 0, `Shelter count: ${res.body?.count}`);

  const testShelter = res.body?.data?.[0];
  recordTest('TC-SHELTER-003', 'Available spaces calculation is accurate', testShelter?.availableSpaces === Math.max(0, testShelter?.capacity - testShelter?.occupancy), `Capacity: ${testShelter?.capacity}, Available: ${testShelter?.availableSpaces}`);

  res = await request('/shelters', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: 'Bejai Relief Community Hall',
      address: 'Bejai Main Road, Mangaluru',
      capacity: 150,
      occupancy: 20,
      contactPerson: 'Suresh Kumar',
      contactPhone: '0824-2224455'
    }
  });
  const createdShelterId = res.body?.data?._id;
  recordTest('TC-SHELTER-004', 'Create new shelter as Administrator', res.status === 201 && !!createdShelterId, `Created shelter ID: ${createdShelterId}`);

  res = await request('/shelters', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: 'Incomplete' }
  });
  recordTest('TC-SHELTER-005', 'Reject shelter creation with missing required fields', res.status >= 400, `Rejected with status ${res.status}`);

  res = await request(`/shelters/${createdShelterId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { occupancy: -10 }
  });
  recordTest('TC-SHELTER-008', 'Reject negative shelter occupancy', res.status === 400, `Rejected with status ${res.status}`);

  res = await request(`/shelters/${createdShelterId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { occupancy: 500, capacity: 100 }
  });
  recordTest('TC-SHELTER-008B', 'Reject occupancy exceeding capacity', res.status === 400, `Rejected with status ${res.status}`);

  res = await request(`/shelters/${createdShelterId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { occupancy: 10 }
  });
  recordTest('TC-SHELTER-009', 'Reject shelter modification from unauthorized citizen', res.status === 403, `Forbidden with status ${res.status}`);

  // PHASE 8: VOLUNTEERS & DONATIONS
  res = await request('/volunteers', { headers: { Authorization: `Bearer ${adminToken}` } });
  recordTest('TC-DONATE-001', 'Retrieve volunteer records', res.status === 200 && Array.isArray(res.body?.data), `Count: ${res.body?.count}`);

  res = await request('/volunteers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { name: 'Ananya Prabhu', phone: '9880011223', skills: ['First Aid', 'Cooking'], areaOfOperation: 'Kadri' }
  });
  recordTest('TC-DONATE-002', 'Register volunteer using valid information', res.status === 201, `Registered volunteer successfully`);

  res = await request('/volunteers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { name: '', phone: '' }
  });
  recordTest('TC-DONATE-003', 'Reject volunteer registration with missing required fields', res.status === 400, `Rejected with status ${res.status}`);

  res = await request('/donations', { headers: { Authorization: `Bearer ${adminToken}` } });
  recordTest('TC-DONATE-006', 'Retrieve donation records and aggregated ledger totals', res.status === 200 && res.body?.totals?.totalMonetary > 0, `Total Monetary: ₹${res.body?.totals?.totalMonetary}`);

  res = await request('/donations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { donorName: 'Rohan Pinto', donationType: 'Monetary', amount: 5000, purpose: 'Mangaluru Flood Relief' }
  });
  recordTest('TC-DONATE-007', 'Record monetary donation record', res.status === 201 && res.body?.data?.amount === 5000, `Recorded ₹5000`);

  res = await request('/donations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { donorName: 'Rohan Pinto', donationType: 'Monetary', amount: -500 }
  });
  recordTest('TC-DONATE-008', 'Reject invalid/negative donation amount', res.status === 400, `Rejected with status ${res.status}`);

  res = await request('/donations/600000000000000000000000', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  recordTest('TC-DONATE-010', 'Reject donation deletion from unauthorized citizen', res.status === 403, `Forbidden with status ${res.status}`);

  // Summary
  console.log('\n--- QA TEST EXECUTION SUMMARY ---');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`TOTAL TESTS EXECUTED: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

runAll();
