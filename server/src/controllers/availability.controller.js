const Availability = require('../models/Availability.model');
const Appointment = require('../models/Appointment.model');
const redis = require('../config/redis');

/**
 * POST /api/availability
 * Set/update weekly availability for a doctor.
 */
const setAvailability = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const { weeklySlots, dailyCap } = req.validatedBody;

    const updateData = { weeklySlots };
    if (dailyCap !== undefined) {
      updateData.dailyCap = dailyCap;
    }

    const availability = await Availability.findOneAndUpdate(
      { doctorId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    // Invalidate Redis cache
    if (redis && redis.status === 'ready') {
      try {
        await redis.del(`avail:${doctorId}`);
      } catch (err) {
        console.warn('⚠️  Redis cache invalidation failed:', err.message);
      }
    }

    // Emit Socket.io event
    if (req.io) {
      req.io.to(`doctor:${doctorId}`).emit('availability_updated', {
        doctorId,
        weeklySlots: availability.weeklySlots,
        dailyCap: availability.dailyCap,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability saved.',
      data: { availability },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/availability/block
 * Block specific dates for a doctor.
 */
const blockDates = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const { dates } = req.validatedBody;

    let availability = await Availability.findOne({ doctorId });
    if (!availability) {
      availability = new Availability({ doctorId, weeklySlots: [], blockedDates: [] });
    }

    const existingDateStrs = new Set(
      (availability.blockedDates || []).map((d) => new Date(d).toISOString().slice(0, 10))
    );

    for (const d of dates) {
      const dStr = new Date(d).toISOString().slice(0, 10);
      if (!existingDateStrs.has(dStr)) {
        availability.blockedDates.push(new Date(d));
        existingDateStrs.add(dStr);
      }
    }

    await availability.save();

    // Invalidate Redis cache
    if (redis && redis.status === 'ready') {
      try {
        await redis.del(`avail:${doctorId}`);
      } catch (err) {
        console.warn('⚠️  Redis cache invalidation failed:', err.message);
      }
    }

    // Emit Socket.io event
    if (req.io) {
      req.io.to(`doctor:${doctorId}`).emit('availability_updated', {
        doctorId,
        blockedDates: availability.blockedDates,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dates blocked.',
      blockedDates: availability.blockedDates,
      data: { blockedDates: availability.blockedDates },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/availability/unblock
 * Unblock specific dates for a doctor.
 */
const unblockDates = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const { dates } = req.validatedBody;

    const availability = await Availability.findOne({ doctorId });
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'No availability record found.',
      });
    }

    const dateStrsToRemove = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
    availability.blockedDates = availability.blockedDates.filter((bd) => {
      const bdStr = new Date(bd).toISOString().slice(0, 10);
      return !dateStrsToRemove.has(bdStr);
    });

    await availability.save();

    // Invalidate Redis cache
    if (redis && redis.status === 'ready') {
      try {
        await redis.del(`avail:${doctorId}`);
      } catch (err) {
        console.warn('⚠️  Redis cache invalidation failed:', err.message);
      }
    }

    // Emit Socket.io event
    if (req.io) {
      req.io.to(`doctor:${doctorId}`).emit('availability_updated', {
        doctorId,
        blockedDates: availability.blockedDates,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dates unblocked.',
      blockedDates: availability.blockedDates,
      data: { blockedDates: availability.blockedDates },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/availability/:doctorId
 * Get full availability for a doctor (cached in Redis).
 */
const getAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    // Check Redis cache
    if (redis && redis.status === 'ready') {
      try {
        const cached = await redis.get(`avail:${doctorId}`);
        if (cached) {
          return res.status(200).json({
            success: true,
            data: JSON.parse(cached),
            cached: true,
          });
        }
      } catch (err) {
        console.warn('⚠️  Redis cache read failed:', err.message);
      }
    }

    const availability = await Availability.findOne({ doctorId });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'No availability found for this doctor.',
      });
    }

    // Cache in Redis with 5 min TTL
    if (redis && redis.status === 'ready') {
      try {
        await redis.set(
          `avail:${doctorId}`,
          JSON.stringify(availability),
          'EX',
          300
        );
      } catch (err) {
        console.warn('⚠️  Redis cache write failed:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      data: availability,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/availability/open-slots/:doctorId?date=2026-11-10
 * Get available 30-min slots for a doctor on a specific date.
 */
const getOpenSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "date" is required (YYYY-MM-DD).',
      });
    }

    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = targetDate.getUTCDay(); // 0=Sun, 6=Sat

    const availability = await Availability.findOne({ doctorId });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'No availability found for this doctor.',
      });
    }

    // Check if date is blocked
    const isBlocked = availability.blockedDates.some((blockedDate) => {
      const bd = new Date(blockedDate);
      const bdStr = bd.toISOString().slice(0, 10);
      return bdStr === date;
    });

    if (isBlocked) {
      return res.status(200).json({
        success: true,
        message: 'Doctor unavailable on this date.',
        slots: [],
        blocked: true,
        data: { slots: [], blocked: true },
      });
    }

    // Find matching weekly slots for this day
    const matchingSlots = availability.weeklySlots.filter(
      (slot) => slot.dayOfWeek === dayOfWeek
    );

    if (matchingSlots.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No slots available for this day.',
        slots: [],
        blocked: false,
        data: { slots: [], blocked: false, dailyCap: availability.dailyCap },
      });
    }

    // Generate 30-min interval slots
    const allSlots = [];

    for (const slot of matchingSlots) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + 30 <= endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        allSlots.push(timeStr);
        currentMinutes += 30;
      }
    }

    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: 'confirmed',
    }).select('time');
    const bookedTimes = new Set(bookedAppointments.map((appointment) => appointment.time));
    const remainingCapacity = Math.max(availability.dailyCap - bookedTimes.size, 0);
    const cappedSlots = allSlots.filter((time) => !bookedTimes.has(time)).slice(0, remainingCapacity);

    res.status(200).json({
      success: true,
      message: 'Slots retrieved successfully.',
      slots: cappedSlots,
      blocked: false,
      data: {
        slots: cappedSlots,
        blocked: false,
        dailyCap: availability.dailyCap,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setAvailability,
  blockDates,
  unblockDates,
  getAvailability,
  getOpenSlots,
};
