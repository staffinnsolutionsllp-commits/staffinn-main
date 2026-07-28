require('dotenv').config();
const d = require('./services/dynamoService');

async function check() {
  const records = await d.scanItems('staffinn-hrms-attendance', {
    FilterExpression: 'recruiterId = :r',
    ExpressionAttributeValues: { ':r': 'aa8d18ff-e106-4416-a6d1-438dee067a2c' }
  });
  
  console.log('Total attendance records:', records.length);
  
  const recent = records.filter(a => a.date >= '2026-07-14').sort((a, b) => b.date.localeCompare(a.date));
  console.log('Records since Jul 14:', recent.length);
  
  if (recent.length > 0) {
    console.log('Latest 3:');
    recent.slice(0, 3).forEach(r => console.log('  ' + r.date + ' | ' + r.employeeId + ' | ' + r.checkIn + ' | ' + r.status));
  } else {
    console.log('NO RECORDS since Jul 14');
    const all = records.sort((a, b) => b.date.localeCompare(a.date));
    if (all.length > 0) {
      console.log('Last known record:', all[0].date, all[0].employeeId);
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
