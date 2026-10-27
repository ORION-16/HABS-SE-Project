const Appointment = require('../models/Appointment.model');
const Availability = require('../models/Availability.model');
const User = require('../models/User.model');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const appointmentResponse = (appointment) => ({
  id: appointment._id,
  doctorId: appointment.doctorId?._id || appointment.doctorId,
  patientId: appointment.patientId?._id || appointment.patientId,
  date: appointment.date,
  time: appointment.time,
  status: appointment.status,
  doctor: appointment.doctorId?.name ? {
    id: appointment.doctorId._id,
    name: appointment.doctorId.name,
    specialization: appointment.doctorId.specialization,
  } : undefined,
  patient: appointment.patientId?.name ? {
    id: appointment.patientId._id,
    name: appointment.patientId.name,
    email: appointment.patientId.email,
    phone: appointment.patientId.phone,
  } : undefined,
});

const isSlotOpen = (availability, date, time) => {
  if (!availability) return false;
  if (availability.blockedDates.some((blockedDate) => new Date(blockedDate).toISOString().slice(0, 10) === date)) {
    return false;
  }

  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return availability.weeklySlots.some((slot) => {
    if (slot.dayOfWeek !== dayOfWeek) return false;
    const [hour, minute] = time.split(':').map(Number);
    const slotMinutes = hour * 60 + minute;
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    return slotMinutes >= startHour * 60 + startMinute && slotMinutes + 30 <= endHour * 60 + endMinute;
  });
};

/** POST /api/appointments — patient reserves an open slot. */
const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, time } = req.body;
    if (!doctorId || !DATE_PATTERN.test(date || '') || !TIME_PATTERN.test(time || '')) {
      return res.status(400).json({ success: false, message: 'doctorId, date (YYYY-MM-DD), and time (HH:mm) are required.' });
    }

    const [doctor, availability] = await Promise.all([
      User.findOne({ _id: doctorId, role: 'doctor', isApproved: true }),
      Availability.findOne({ doctorId }),
    ]);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    if (!isSlotOpen(availability, date, time)) {
      return res.status(409).json({ success: false, message: 'This slot is no longer available.' });
    }

    const bookedCount = await Appointment.countDocuments({ doctorId, date, status: 'confirmed' });
    if (bookedCount >= availability.dailyCap) {
      return res.status(409).json({ success: false, message: 'The doctor has reached the daily appointment limit.' });
    }

    let appointment;
    try {
      appointment = await Appointment.create({ doctorId, patientId: req.user.userId, date, time });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ success: false, message: 'This slot was just booked by another patient.' });
      }
      throw error;
    }

    const populated = await appointment.populate([
      { path: 'doctorId', select: 'name specialization' },
      { path: 'patientId', select: 'name email phone' },
    ]);
    const data = appointmentResponse(populated);
    // The room is also used by patients refreshing availability, so never
    // broadcast patient details here. The authenticated doctor re-fetches the
    // booking list after receiving this small invalidation event.
    req.io?.to(`doctor:${doctorId}`).emit('appointment_updated', { doctorId: String(doctorId), date });
    res.status(201).json({ success: true, message: 'Appointment confirmed.', data });
  } catch (error) {
    next(error);
  }
};

/** GET /api/appointments — patient sees their appointments; doctor sees their booked patients. */
const getAppointments = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (date && !DATE_PATTERN.test(date)) {
      return res.status(400).json({ success: false, message: 'date must use YYYY-MM-DD.' });
    }
    const filter = req.user.role === 'doctor'
      ? { doctorId: req.user.userId, status: 'confirmed' }
      : { patientId: req.user.userId, status: 'confirmed' };
    if (date) filter.date = date;

    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email phone')
      .sort({ date: 1, time: 1 });
    res.status(200).json({ success: true, data: appointments.map(appointmentResponse) });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAppointment, getAppointments };
