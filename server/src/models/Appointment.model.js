const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // A date-only value prevents an appointment moving to a different day when
  // users and the server are in different time zones.
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
}, { timestamps: true });

// The database, rather than the browser, is the authority that prevents a
// second patient from booking the same consultation window.
AppointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true });
AppointmentSchema.index({ patientId: 1, date: 1, time: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
