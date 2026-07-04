/**
 * HRMS Holiday Controller
 * Manages company-declared holidays (recruiter-scoped)
 * 2 compulsory national holidays: 26-Jan, 15-Aug
 */
const { dynamoClient, HRMS_HOLIDAYS_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

/** Seed national holidays if not present */
const NATIONAL_HOLIDAYS = [
  { name: 'Republic Day', date: `${new Date().getFullYear()}-01-26`, type: 'National', mandatory: true },
  { name: 'Independence Day', date: `${new Date().getFullYear()}-08-15`, type: 'National', mandatory: true }
];

const getHolidays = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID required'));

    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_HOLIDAYS_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': recruiterId }
    }));

    const holidays = (result.Items || []).sort((a, b) => a.date.localeCompare(b.date));
    return res.json(successResponse(holidays, 'Holidays retrieved'));
  } catch (e) { handleError(e, res); }
};

const createHoliday = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID required'));

    const { date, name, type, description } = req.body;
    if (!date || !name) return res.status(400).json(errorResponse('date and name are required'));

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json(errorResponse('date must be YYYY-MM-DD'));
    }

    // Check duplicate
    const existing = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_HOLIDAYS_TABLE,
      FilterExpression: 'recruiterId = :rid AND #date = :date',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':rid': recruiterId, ':date': date }
    }));
    if (existing.Items && existing.Items.length > 0) {
      return res.status(400).json(errorResponse(`A holiday already exists on ${date}`));
    }

    const holidayId = generateId();
    const holiday = {
      holidayId,
      recruiterId,
      date,
      name,
      type: type || 'Declared',
      description: description || '',
      mandatory: false,
      createdAt: getCurrentTimestamp(),
      createdBy: req.user?.email || 'system'
    };

    await dynamoClient.send(new PutCommand({ TableName: HRMS_HOLIDAYS_TABLE, Item: holiday }));
    return res.status(201).json(successResponse(holiday, 'Holiday created'));
  } catch (e) { handleError(e, res); }
};

const updateHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const recruiterId = req.user?.recruiterId;

    const scan = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_HOLIDAYS_TABLE,
      FilterExpression: 'holidayId = :hid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':hid': holidayId, ':rid': recruiterId }
    }));
    const existing = scan.Items?.[0];
    if (!existing) return res.status(404).json(errorResponse('Holiday not found'));
    if (existing.mandatory) return res.status(400).json(errorResponse('Cannot modify mandatory national holiday'));

    const updated = { ...existing, ...req.body, holidayId, recruiterId, updatedAt: getCurrentTimestamp() };
    await dynamoClient.send(new PutCommand({ TableName: HRMS_HOLIDAYS_TABLE, Item: updated }));
    return res.json(successResponse(updated, 'Holiday updated'));
  } catch (e) { handleError(e, res); }
};

const deleteHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const recruiterId = req.user?.recruiterId;

    const scan = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_HOLIDAYS_TABLE,
      FilterExpression: 'holidayId = :hid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':hid': holidayId, ':rid': recruiterId }
    }));
    const existing = scan.Items?.[0];
    if (!existing) return res.status(404).json(errorResponse('Holiday not found'));
    if (existing.mandatory) return res.status(400).json(errorResponse('Cannot delete mandatory national holiday'));

    await dynamoClient.send(new DeleteCommand({ TableName: HRMS_HOLIDAYS_TABLE, Key: { holidayId } }));
    return res.json(successResponse(null, 'Holiday deleted'));
  } catch (e) { handleError(e, res); }
};

/** Seed national holidays for a recruiter if not already present */
const seedNationalHolidays = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID required'));

    const created = [];
    for (const nh of NATIONAL_HOLIDAYS) {
      const existing = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_HOLIDAYS_TABLE,
        FilterExpression: 'recruiterId = :rid AND #date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: { ':rid': recruiterId, ':date': nh.date }
      }));
      if (!existing.Items || existing.Items.length === 0) {
        const item = { holidayId: generateId(), recruiterId, ...nh, createdAt: getCurrentTimestamp() };
        await dynamoClient.send(new PutCommand({ TableName: HRMS_HOLIDAYS_TABLE, Item: item }));
        created.push(item);
      }
    }
    return res.json(successResponse(created, `Seeded ${created.length} national holidays`));
  } catch (e) { handleError(e, res); }
};

module.exports = { getHolidays, createHoliday, updateHoliday, deleteHoliday, seedNationalHolidays };
