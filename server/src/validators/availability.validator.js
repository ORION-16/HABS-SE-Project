const { z } = require('zod');
const { validate } = require('./auth.validator');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const slotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  endTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'startTime must be before endTime', path: ['startTime'] }
);

const setAvailabilitySchema = z.object({
  weeklySlots: z.array(slotSchema).min(1, 'At least one slot is required'),
  dailyCap: z.number().int().min(1).max(100).optional(),
});

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const blockDatesSchema = z.object({
  dates: z.array(
    z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format')
  ).min(1, 'At least one date is required'),
});

const unblockDatesSchema = z.object({
  dates: z.array(
    z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format')
  ).min(1, 'At least one date is required'),
});

module.exports = {
  setAvailabilitySchema,
  blockDatesSchema,
  unblockDatesSchema,
  validate,
};
