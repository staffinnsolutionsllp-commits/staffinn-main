require('dotenv').config();
const d = require('./services/dynamoService');
d.scanItems('staffinn-hrms-attendance', {
  FilterExpression: 'recruiterId = :r',
  ExpressionAttributeValues: { ':r': 'aa8d18ff-e106-4416-a6d1-438dee067a2c' }
}).then(r => {
  const recent = r.filter(a => a.date >= '2026-07-14').sort((a, b) => b.date.localeCompare(a.date));
  console.log('Total records since Jul 14:', recent.length);
  console.log('Latest 10:');
  recent.slice(0, 10).forEach(x => console.log(' ', x.date, x.employeeId, x.checkIn || x.checkInTime, x.status));
}).catch(e => console.error(e.message));
