require('dotenv').config();
const bcrypt = require('bcrypt');
const connectDB = require('./src/config/db');
const User = require('./src/models/User.model');
const Availability = require('./src/models/Availability.model');

async function seed() {
  console.log('🌱 Seeding HABS database with demo accounts...');
  await connectDB();

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // 1. Patient
  const patient = await User.findOneAndUpdate(
    { email: 'patient@habs.com' },
    {
      name: 'John Doe',
      email: 'patient@habs.com',
      phone: '9876543210',
      passwordHash,
      role: 'patient',
      dateOfBirth: new Date('1995-06-15'),
      isVerified: true,
      failedLogins: 0,
      lockUntil: null,
    },
    { upsert: true, new: true }
  );
  console.log('  ✅ Patient created: patient@habs.com / Password@123');

  // 2. Doctor
  const doctor = await User.findOneAndUpdate(
    { email: 'doctor@habs.com' },
    {
      name: 'Dr. Sarah Connor',
      email: 'doctor@habs.com',
      phone: '9876543211',
      passwordHash,
      role: 'doctor',
      specialization: 'Cardiology',
      licenseNumber: 'MH-12345',
      isVerified: true,
      isApproved: true,
      failedLogins: 0,
      lockUntil: null,
    },
    { upsert: true, new: true }
  );
  console.log(`  ✅ Doctor created: doctor@habs.com / Password@123 (ID: ${doctor._id})`);

  // 3. Admin
  await User.findOneAndUpdate(
    { email: 'admin@habs.com' },
    {
      name: 'Admin User',
      email: 'admin@habs.com',
      phone: '9876543212',
      passwordHash,
      role: 'admin',
      isVerified: true,
      failedLogins: 0,
      lockUntil: null,
    },
    { upsert: true, new: true }
  );
  console.log('  ✅ Admin created: admin@habs.com / Password@123');

  // 4. Default Availability for Doctor
  await Availability.findOneAndUpdate(
    { doctorId: doctor._id },
    {
      doctorId: doctor._id,
      weeklySlots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' }, // Mon
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tue
        { dayOfWeek: 3, startTime: '10:00', endTime: '15:00' }, // Wed
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thu
        { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' }, // Fri
      ],
      blockedDates: [
        new Date('2026-12-25'), // Christmas
      ],
      dailyCap: 20,
    },
    { upsert: true, new: true }
  );
  console.log('  ✅ Doctor weekly availability & blocked dates configured');

  console.log('\n🎉 Seed complete! You can now log in immediately.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
