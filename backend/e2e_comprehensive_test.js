const http = require('http');
const { io } = require('../frontend/node_modules/socket.io-client');

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

async function runComprehensiveTests() {
  console.log('=== STARTING EXTENDED E2E, SECURITY, REALTIME & INTEGRITY TESTS ===\n');

  // Login Administrator
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@resqmangaluru.org', password: 'AdminPassword123!' }
  });
  const adminToken = adminLogin.body?.token;

  // 1. COMPLETE EMERGENCY WORKFLOW (Stages 1-12)
  console.log('>> Step 1: Register citizen');
  const uniqueId = Date.now();
  const citizenEmail = `workflow_citizen_${uniqueId}@mangaluru.org`;
  const citizenReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Srinivas Acharya', email: citizenEmail, password: 'CitizenPassword123!', role: 'citizen', phone: '9448100111' }
  });
  const citizenToken = citizenReg.body?.token;
  const citizenId = citizenReg.body?.user?.id;
  recordTest('E2E-WF-001', 'Register Citizen for E2E workflow', citizenReg.status === 201 && !!citizenToken, `Citizen ID: ${citizenId}`);

  console.log('>> Step 2: Submit SOS incident');
  const sosSubmit = await request('/incidents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: {
      title: `Severe Monsoon Inundation at Jeppu Market #${uniqueId}`,
      description: 'Water level rising above 3 feet. Ground floor residential units submerged.',
      category: 'Flood',
      severity: 'Critical',
      address: 'Jeppu Market Road, Mangaluru',
      latitude: 12.8530,
      longitude: 74.8465,
      contactPhone: '9448100111'
    }
  });
  const incidentId = sosSubmit.body?.data?._id;
  recordTest('E2E-WF-002', 'Submit SOS incident with coordinates', sosSubmit.status === 201 && !!incidentId, `Incident ID: ${incidentId}`);

  console.log('>> Step 3: Verify incident saved in database');
  const verifySaved = await request(`/incidents/${incidentId}`, { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('E2E-WF-003', 'Verify incident saved with Reported status', verifySaved.status === 200 && verifySaved.body?.data?.status === 'Reported', `Status: ${verifySaved.body?.data?.status}`);

  console.log('>> Step 4 & 5: Admin retrieves and acknowledges incident');
  const adminAck = await request(`/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'Acknowledged', comment: 'District Disaster Management Center logged and acknowledged distress call.' }
  });
  recordTest('E2E-WF-005', 'Admin acknowledges incident', adminAck.status === 200 && adminAck.body?.data?.status === 'Acknowledged', `Status: ${adminAck.body?.data?.status}`);

  console.log('>> Step 6: Admin assigns responder');
  const respondersRes = await request('/users/responders', { headers: { Authorization: `Bearer ${adminToken}` } });
  const responderUser = respondersRes.body?.data?.[0];
  const adminAssign = await request(`/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { assignedResponderId: responderUser._id, comment: `Assigned unit ${responderUser.name}` }
  });
  recordTest('E2E-WF-006', 'Admin assigns valid responder', adminAssign.status === 200 && adminAssign.body?.data?.assignedResponderName === responderUser.name, `Assigned to: ${adminAssign.body?.data?.assignedResponderName}`);

  console.log('>> Step 7 & 8: Responder logs in and sees assignment');
  const responderLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: responderUser.email, password: 'ResponderPass123!' }
  });
  const responderToken = responderLogin.body?.token;
  const responderAssignments = await request('/incidents?assignedOnly=true', { headers: { Authorization: `Bearer ${responderToken}` } });
  const hasIncident = responderAssignments.body?.data?.some(i => i._id === incidentId);
  recordTest('E2E-WF-008', 'Assigned responder sees assignment', responderAssignments.status === 200 && hasIncident, `Incident present in assigned list: ${hasIncident}`);

  console.log('>> Step 9: Responder updates status to Rescue in Progress');
  const respInProgress = await request(`/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${responderToken}` },
    body: { status: 'Rescue in Progress', comment: 'NDRF Inflatable boat unit arrived at Jeppu. Evacuation started.' }
  });
  recordTest('E2E-WF-009', 'Responder updates status to Rescue in Progress', respInProgress.status === 200 && respInProgress.body?.data?.status === 'Rescue in Progress', `Status: ${respInProgress.body?.data?.status}`);

  console.log('>> Step 10: Responder resolves incident with note');
  const respResolve = await request(`/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${responderToken}` },
    body: { status: 'Resolved', comment: '14 residents evacuated safely to Kadri Community Relief Hall. Water receding.' }
  });
  recordTest('E2E-WF-010', 'Responder resolves incident with resolution note', respResolve.status === 200 && respResolve.body?.data?.status === 'Resolved', `Status: ${respResolve.body?.data?.status}`);

  console.log('>> Step 11: Audit history verification');
  const incidentHistory = respResolve.body?.data?.statusHistory;
  const historyStatuses = incidentHistory?.map(h => h.status);
  const auditValid = historyStatuses?.includes('Reported') && historyStatuses?.includes('Acknowledged') && historyStatuses?.includes('Responder Assigned') && historyStatuses?.includes('Rescue in Progress') && historyStatuses?.includes('Resolved');
  recordTest('E2E-WF-011', 'Complete audit trail matches workflow lifecycle', auditValid, `Lifecycle stages recorded: ${historyStatuses?.length}`);

  console.log('>> Step 12: Citizen and Admin see updated status');
  const citizenCheck = await request(`/incidents/${incidentId}`, { headers: { Authorization: `Bearer ${citizenToken}` } });
  const adminCheck = await request(`/incidents/${incidentId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  recordTest('E2E-WF-012', 'Citizen and Admin see synchronized Resolved state', citizenCheck.body?.data?.status === 'Resolved' && adminCheck.body?.data?.status === 'Resolved', 'Both see Resolved');

  // 2. ADDITIONAL SECURITY TESTS
  console.log('\n--- ADDITIONAL SECURITY TESTS ---');

  // Citizen cannot assign responders
  const citizenAssign = await request(`/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { assignedResponderId: responderUser._id }
  });
  recordTest('SEC-001', 'Citizen cannot assign responder (403 Forbidden)', citizenAssign.status === 403, `Status: ${citizenAssign.status}`);

  // Responder cannot modify incident of another responder
  const secondResponderRes = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Second Responder', email: `sec_resp_${uniqueId}@mangaluru.org`, password: 'ResponderPass123!', role: 'responder', phone: '9448100222' }
  });
  const secRespToken = secondResponderRes.body?.token;
  const unauthorizedRespUpdate = await request(`/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${secRespToken}` },
    body: { status: 'Reported', comment: 'Tamper attempt' }
  });
  recordTest('SEC-002', 'Responder cannot modify incident assigned to another responder', unauthorizedRespUpdate.status === 403, `Status: ${unauthorizedRespUpdate.status}`);

  // User cannot escalate own role to admin via profile update
  const escalateProfile = await request('/auth/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: { role: 'admin' }
  });
  const citizenProfile = await request('/auth/me', { headers: { Authorization: `Bearer ${citizenToken}` } });
  recordTest('SEC-003', 'User cannot escalate role to admin via profile update', citizenProfile.body?.user?.role === 'citizen', `Role remained: ${citizenProfile.body?.user?.role}`);

  // Sensitive data exposure check
  recordTest('SEC-004', 'Password hash never exposed in user responses', citizenProfile.body?.user?.password === undefined, 'No password field');

  // 3. SHELTER CAPACITY & DATA INTEGRITY
  console.log('\n--- SHELTER CAPACITY & INTEGRITY TESTS ---');
  const shelterCreate = await request('/shelters', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: `Integrity Test Shelter #${uniqueId}`,
      address: 'Kudroli, Mangaluru',
      capacity: 100,
      occupancy: 20,
      contactPerson: 'Mohan Das',
      contactPhone: '0824-2227788'
    }
  });
  const shelterId = shelterCreate.body?.data?._id;

  // Occupancy cannot exceed capacity
  const overCapacityUpdate = await request(`/shelters/${shelterId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { occupancy: 120 }
  });
  recordTest('INT-001', 'Occupancy cannot exceed capacity (rejected with 400)', overCapacityUpdate.status === 400, `Status: ${overCapacityUpdate.status}`);

  // Occupancy cannot be negative
  const negativeOccupancy = await request(`/shelters/${shelterId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { occupancy: -5 }
  });
  recordTest('INT-002', 'Occupancy cannot be negative (rejected with 400)', negativeOccupancy.status === 400, `Status: ${negativeOccupancy.status}`);

  // Simultaneous concurrent updates to shelter
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(request(`/shelters/${shelterId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { occupancy: 30 + i }
    }));
  }
  const concurrentResults = await Promise.all(promises);
  const allConcurrentValid = concurrentResults.every(r => r.status === 200);
  const shelterFinal = await request(`/shelters/${shelterId}`);
  const finalOccupancy = shelterFinal.body?.data?.occupancy;
  recordTest('INT-003', 'Concurrent shelter updates handled consistently', allConcurrentValid && finalOccupancy <= 100, `Final occupancy: ${finalOccupancy}`);

  // 4. REAL-TIME SOCKET.IO NOTIFICATIONS
  console.log('\n--- REAL-TIME SOCKET.IO NOTIFICATION TESTS ---');
  await new Promise((resolve) => {
    let clientAdminReceived = false;
    let clientResponderReceived = false;

    const socketAdmin = io('http://localhost:5000', { transports: ['websocket'] });
    const socketResponder = io('http://localhost:5000', { transports: ['websocket'] });

    socketAdmin.on('connect', () => {
      socketAdmin.emit('join_role_room', 'admin');
    });

    socketResponder.on('connect', () => {
      socketResponder.emit('join_role_room', 'responder');
    });

    socketAdmin.on('incident_created', (data) => {
      if (data?.incident?._id) {
        clientAdminReceived = true;
      }
    });

    socketResponder.on('incident_created', (data) => {
      if (data?.incident?._id) {
        clientResponderReceived = true;
      }
    });

    setTimeout(async () => {
      // Create synthetic incident to trigger real-time event
      await request('/incidents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${citizenToken}` },
        body: {
          title: `Realtime SOS Alert #${uniqueId}`,
          description: 'Testing live notification delivery to connected admin and responders.',
          category: 'Flood',
          address: 'Car Street, Mangaluru'
        }
      });

      // Wait 1 second for socket delivery
      setTimeout(() => {
        socketAdmin.disconnect();
        socketResponder.disconnect();
        recordTest('SOCK-001', 'Admin receives real-time incident_created event', clientAdminReceived, `Delivered: ${clientAdminReceived}`);
        recordTest('SOCK-002', 'Responder receives real-time incident_created event', clientResponderReceived, `Delivered: ${clientResponderReceived}`);
        resolve();
      }, 1200);
    }, 800);
  });

  // SUMMARY
  console.log('\n======================================================');
  console.log('       ALL EXTENDED QA & E2E TESTS COMPLETED          ');
  console.log('======================================================');
  const passCount = results.filter(r => r.pass).length;
  const failCount = results.filter(r => !r.pass).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

runComprehensiveTests();
