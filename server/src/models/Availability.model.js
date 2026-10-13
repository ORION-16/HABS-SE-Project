const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  dayOfWeek:  { type: Number, min: 0, max: 6, required: true }, // 0=Sun, 6=Sat
  startTime:  { type: String, required: true },   // "HH:mm" e.g. "09:00"
  endTime:    { type: String, required: true },    // "HH:mm" e.g. "17:00"
});

const AvailabilitySchema = new mongoose.Schema({
  doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weeklySlots:  [SlotSchema],
  blockedDates: [{ type: Date }],
  dailyCap:     { type: Number, default: 20 },
}, { timestamps: true });

AvailabilitySchema.index({ doctorId: 1 }, { unique: true });

module.exports = mongoose.model('Availability', AvailabilitySchema);
