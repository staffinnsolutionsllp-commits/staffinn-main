require('dotenv').config();
const d = require('./services/dynamoService');
d.getItem('staffinn-hrms-companies', { companyId: 'COMP-2170E167' }).then(r => {
  console.log('API Key:', r.apiKey);
  console.log('Recruiter ID:', r.recruiterId);
}).catch(e => console.error(e.message));
