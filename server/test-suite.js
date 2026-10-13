/**
 * End-to-end Automated Test Suite for HABS Module 1 & 2
 */
const http = require('http');
const { io: ioClient } = require('socket.io-client');
const createApp = require('./src/app');
const connectDB = require('./src/config/db');
const redis = require('./src/config/redis');
const User = require('./src/models/User.model');
const Availability = require('./src/models/Availability.model');

async function runTests() {
  console.log('🧪 Starting HABS Automated Acceptance Test Suite...\n');

  // 1. Connect to DB and Redis
  await connectDB();
  if (redis && redis.status !== 'ready') {
    try {
      await redis.connect();
    } catch (e) {
      console.warn('Redis connection note:', e.message);
    }
  }

  // Clean test data
  await User.deleteMany({ email: /test.*@habs\.test/ });
  await Availability.deleteMany({});

  // 2. Start Test Server with Socket.io
  const { Server } = require('socket.io');
  const httpServer = http.createServer();
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join_doctor_room', (doctorId) => {
      socket.join(`doctor:${doctorId}`);
    });
  });

  const app = createApp(io);
  httpServer.on('request', app);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const PORT = httpServer.address().port;
  console.log(`🚀 Test server running on http://127.0.0.1:${PORT}\n`);

  const BASE_URL = `http://127.0.0.1:${PORT}/api`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ─── TEST 1: Health Check ───
    console.log('--- Test 1: API Health Check ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, 'GET /api/health returns 200');

    // ─── TEST 2: Registration Validation ───
    console.log('\n--- Test 2: Registration Validation ---');
    const badReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Short', email: 'not-an-email', role: 'patient' }),
    });
    const badRegData = await badReg.json();
    assert(badReg.status === 400 && !badRegData.success, 'Invalid registration payload rejected with 400');

    // ─── TEST 3: Register Patient & Doctor ───
    console.log('\n--- Test 3: Register Patient & Doctor ---');
    const patientPayload = {
      name: 'John Patient',
      email: 'testpatient@habs.test',
      phone: '9876543210',
      password: 'StrongPass@123',
      role: 'patient',
      dateOfBirth: '1990-01-01',
    };
    const regPatientRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientPayload),
    });
    const regPatientData = await regPatientRes.json();
    assert(regPatientRes.status === 201 && regPatientData.success, 'Patient registered with 201');

    const doctorPayload = {
      name: 'Dr. Jane Smith',
      email: 'testdoctor@habs.test',
      phone: '9876543211',
      password: 'StrongPass@123',
      role: 'doctor',
      specialization: 'Cardiology',
      licenseNumber: 'MH-998877',
    };
    const regDoctorRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorPayload),
    });
    const regDoctorData = await regDoctorRes.json();
    assert(regDoctorRes.status === 201 && regDoctorData.success, 'Doctor registered with 201');

    // Duplicate email rejected
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientPayload),
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409');

    // ─── TEST 4: Email Verification ───
    console.log('\n--- Test 4: Email Verification ---');
    // Verify patient
    const patientUser = await User.findOne({ email: patientPayload.email });
    assert(patientUser && !patientUser.isVerified, 'Patient in DB is initially unverified');

    const { signVerificationToken } = require('./src/utils/jwt');
    const patientToken = signVerificationToken({
      userId: patientUser._id,
      email: patientUser.email,
      purpose: 'email-verification',
    });

    const verifyRes = await fetch(`${BASE_URL}/auth/verify-email?token=${patientToken}`);
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200 && verifyData.success, 'Patient email verified via token');

    // Also verify and approve doctor
    const doctorUser = await User.findOne({ email: doctorPayload.email });
    doctorUser.isVerified = true;
    doctorUser.isApproved = true;
    await doctorUser.save();
    assert(doctorUser.isApproved, 'Doctor approved for testing');

    // ─── TEST 5: Failed Login & Account Lockout ───
    console.log('\n--- Test 5: Failed Login & Account Lockout (5 attempts) ---');
    for (let i = 1; i <= 4; i++) {
      const failRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: patientPayload.email, password: 'WrongPassword!' }),
      });
      assert(failRes.status === 401, `Failed login attempt ${i} returns 401`);
    }

    // 5th attempt triggers lockout
    const lockRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: patientPayload.email, password: 'WrongPassword!' }),
    });
    assert(lockRes.status === 423, '5th failed attempt triggers 423 Account Locked');

    // Unlock patient for subsequent tests
    patientUser.failedLogins = 0;
    patientUser.lockUntil = null;
    await patientUser.save();

    // ─── TEST 6: Successful Login & JWT Token ───
    console.log('\n--- Test 6: Successful Login & JWT Token ---');
    const loginPatientRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: patientPayload.email, password: patientPayload.password }),
    });
    const loginPatientData = await loginPatientRes.json();
    assert(loginPatientRes.status === 200 && loginPatientData.data.token, 'Patient login returns JWT');
    const patientJwt = loginPatientData.data.token;

    const loginDoctorRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: doctorPayload.email, password: doctorPayload.password }),
    });
    const loginDoctorData = await loginDoctorRes.json();
    assert(loginDoctorRes.status === 200 && loginDoctorData.data.token, 'Doctor login returns JWT');
    const doctorJwt = loginDoctorData.data.token;
    const doctorId = loginDoctorData.data.user.id;

    // ─── TEST 7: GET /api/auth/me ───
    console.log('\n--- Test 7: Protected GET /api/auth/me ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${doctorJwt}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data.role === 'doctor', 'GET /api/auth/me returns doctor profile');

    // ─── TEST 8: Role Authorization (RBAC) ───
    console.log('\n--- Test 8: Role Authorization RBAC ---');
    // Patient attempts to set availability -> 403 Forbidden
    const patientTrySet = await fetch(`${BASE_URL}/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientJwt}`,
      },
      body: JSON.stringify({
        weeklySlots: [{ dayOfWeek: 2, startTime: '09:00', endTime: '12:00' }],
      }),
    });
    assert(patientTrySet.status === 403, 'Patient forbidden (403) from setting availability');

    // ─── TEST 9: Doctor Sets Availability & Socket.io Event ───
    console.log('\n--- Test 9: Doctor Sets Availability & Socket.io Confirmation ---');
    let socketReceived = false;
    const clientSocket = ioClient(`http://127.0.0.1:${PORT}`, {
      transports: ['websocket'],
    });

    await new Promise((resolve) => {
      clientSocket.on('connect', () => {
        clientSocket.emit('join_doctor_room', doctorId);
        clientSocket.on('availability_updated', (data) => {
          socketReceived = true;
        });
        setTimeout(resolve, 200);
      });
    });

    const setAvailRes = await fetch(`${BASE_URL}/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorJwt}`,
      },
      body: JSON.stringify({
        weeklySlots: [
          { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' }, // Tuesday 9am - 12pm (6 slots)
          { dayOfWeek: 4, startTime: '14:00', endTime: '16:00' }, // Thursday 2pm - 4pm (4 slots)
        ],
        dailyCap: 15,
      }),
    });
    const setAvailData = await setAvailRes.json();
    assert(setAvailRes.status === 200 && setAvailData.success, 'Doctor sets availability with 200');

    // Allow socket event propagation
    await new Promise((r) => setTimeout(r, 300));
    assert(socketReceived, 'Socket.io received availability_updated event in real-time');
    clientSocket.disconnect();

    // ─── TEST 10: Redis Caching on GET /api/availability/:doctorId ───
    console.log('\n--- Test 10: Redis Caching on Availability Fetch ---');
    const getAvail1 = await fetch(`${BASE_URL}/availability/${doctorId}`, {
      headers: { Authorization: `Bearer ${patientJwt}` },
    });
    const data1 = await getAvail1.json();
    assert(getAvail1.status === 200 && data1.cached === false, 'First fetch is cache miss (cached: false)');

    const getAvail2 = await fetch(`${BASE_URL}/availability/${doctorId}`, {
      headers: { Authorization: `Bearer ${patientJwt}` },
    });
    const data2 = await getAvail2.json();
    assert(getAvail2.status === 200 && data2.cached === true, 'Second fetch is cache HIT (cached: true)');

    // ─── TEST 11: GET Open Slots (30-min intervals) ───
    console.log('\n--- Test 11: Open Slots Calculation (2026-11-10 is a Tuesday) ---');
    const openSlotsRes = await fetch(`${BASE_URL}/availability/open-slots/${doctorId}?date=2026-11-10`, {
      headers: { Authorization: `Bearer ${patientJwt}` },
    });
    const openSlotsData = await openSlotsRes.json();
    const expectedSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    const returnedSlots = openSlotsData.data?.slots || openSlotsData.slots;
    assert(
      JSON.stringify(returnedSlots) === JSON.stringify(expectedSlots),
      `Open slots return exactly 30-min intervals: ${returnedSlots.join(', ')}`
    );

    // ─── TEST 12: Block Date & Verify Open Slots ───
    console.log('\n--- Test 12: Block Date & Verify Open Slots ---');
    const blockRes = await fetch(`${BASE_URL}/availability/block`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorJwt}`,
      },
      body: JSON.stringify({ dates: ['2026-11-10'] }),
    });
    assert(blockRes.status === 200, 'Doctor blocks date 2026-11-10');

    const blockedOpenRes = await fetch(`${BASE_URL}/availability/open-slots/${doctorId}?date=2026-11-10`, {
      headers: { Authorization: `Bearer ${patientJwt}` },
    });
    const blockedOpenData = await blockedOpenRes.json();
    const isBlocked = blockedOpenData.data?.blocked ?? blockedOpenData.blocked;
    const blockedSlots = blockedOpenData.data?.slots ?? blockedOpenData.slots;
    assert(isBlocked === true && blockedSlots.length === 0, 'Blocked date returns blocked: true and slots: []');

    // ─── TEST 13: Unblock Date ───
    console.log('\n--- Test 13: Unblock Date & Restore Slots ---');
    const unblockRes = await fetch(`${BASE_URL}/availability/unblock`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorJwt}`,
      },
      body: JSON.stringify({ dates: ['2026-11-10'] }),
    });
    assert(unblockRes.status === 200, 'Doctor unblocks date 2026-11-10');

    const restoredOpenRes = await fetch(`${BASE_URL}/availability/open-slots/${doctorId}?date=2026-11-10`, {
      headers: { Authorization: `Bearer ${patientJwt}` },
    });
    const restoredOpenData = await restoredOpenRes.json();
    const restoredSlots = restoredOpenData.data?.slots ?? restoredOpenData.slots;
    assert(restoredSlots.length === 6, 'Unblocking date restores all 6 available slots');

    // ─── TEST 14: Logout & Token Blacklist in Redis ───
    console.log('\n--- Test 14: Logout & Redis Token Blacklist ---');
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientJwt}` },
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout succeeds');

    // Request with blacklisted token should fail
    const revokedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${patientJwt}` },
    });
    assert(revokedRes.status === 401, 'Request with logged-out token rejected with 401 (revoked)');

    console.log('\n=======================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=======================================\n');

  } catch (err) {
    console.error('💥 Test suite encountered unexpected error:', err);
    failed++;
  } finally {
    httpServer.close();
    if (redis && redis.status === 'ready') {
      redis.disconnect();
    }
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
