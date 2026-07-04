/**
 * Campus Slot Booking Model
 * Manages date/time-slot locking for campus drives.
 *
 * Table: campus-slot-bookings
 * PK:    bookingId  (UUID)
 * GSI:   InstituteIdIndex  on  instituteId
 *
 * A booking record is created/updated whenever a recruiter
 * confirms (or later declines/cancels) a campus drive.
 * Only status === 'Confirmed' locks a slot.
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE = process.env.CAMPUS_SLOT_BOOKINGS_TABLE || 'campus-slot-bookings';

// ── helpers ──────────────────────────────────────────────────────
const slotKey = (date, slot) => `${date}::${slot}`;

/**
 * Upsert a booking record tied to a campus request.
 * Called from campusRequestModel.saveRecruiterResponse().
 */
const upsertBooking = async ({
  campusreqId,
  instituteId,
  recruiterId,
  driveDate,
  timeSlot,
  bookingStatus,   // 'Confirmed' | 'Tentative' | 'Declined' | 'Cancelled'
}) => {
  const timestamp = new Date().toISOString();

  // Find existing booking for this request
  const all = await dynamoService.scanItems(TABLE, {
    FilterExpression: 'campusreqId = :r',
    ExpressionAttributeValues: { ':r': campusreqId }
  });

  const existing = all[0] || null;
  const bookingId = existing ? existing.bookingId : uuidv4();

  const item = {
    bookingId,
    campusreqId,
    instituteId,
    recruiterId,
    driveDate,
    timeSlot,
    slotKey: slotKey(driveDate, timeSlot),
    bookingStatus,
    confirmedAt: bookingStatus === 'Confirmed' ? timestamp : (existing?.confirmedAt || null),
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp
  };

  await dynamoService.putItem(TABLE, item);
  return item;
};

/**
 * Get all bookings for an institute.
 * Returns every record regardless of status so the UI can show
 * Tentative as yellow and Confirmed as red.
 */
const getBookingsByInstitute = async (instituteId) => {
  const items = await dynamoService.scanItems(TABLE, {
    FilterExpression: 'instituteId = :i',
    ExpressionAttributeValues: { ':i': instituteId }
  });
  return items;
};

/**
 * Build a slot-availability map for a given institute.
 *
 * Returns:
 * {
 *   "2026-06-15::10:00 AM – 1:00 PM": { status: "Confirmed", recruiterId, recruiterName },
 *   "2026-06-15::2:00 PM – 5:00 PM":  { status: "Tentative", recruiterId, recruiterName },
 *   ...
 * }
 *
 * Only Confirmed and Tentative bookings are included.
 * Declined / Cancelled bookings are excluded (slot is free again).
 */
const getSlotAvailabilityMap = async (instituteId) => {
  const bookings = await getBookingsByInstitute(instituteId);
  const map = {};

  for (const b of bookings) {
    if (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Tentative') {
      const key = b.slotKey || slotKey(b.driveDate, b.timeSlot);
      // If multiple bookings exist for same slot, Confirmed wins over Tentative
      if (!map[key] || b.bookingStatus === 'Confirmed') {
        map[key] = {
          status: b.bookingStatus,
          recruiterId: b.recruiterId,
          bookingId: b.bookingId,
          campusreqId: b.campusreqId,
          driveDate: b.driveDate,
          timeSlot: b.timeSlot,
          confirmedAt: b.confirmedAt
        };
      }
    }
  }

  return map;
};

/**
 * Release a booking (set to Cancelled) when a recruiter declines
 * or when a confirmed drive is cancelled.
 */
const releaseBooking = async (campusreqId) => {
  const all = await dynamoService.scanItems(TABLE, {
    FilterExpression: 'campusreqId = :r',
    ExpressionAttributeValues: { ':r': campusreqId }
  });

  if (!all.length) return null;

  const existing = all[0];
  const updated = {
    ...existing,
    bookingStatus: 'Cancelled',
    updatedAt: new Date().toISOString()
  };

  await dynamoService.putItem(TABLE, updated);
  return updated;
};

module.exports = {
  upsertBooking,
  getBookingsByInstitute,
  getSlotAvailabilityMap,
  releaseBooking,
  slotKey
};
