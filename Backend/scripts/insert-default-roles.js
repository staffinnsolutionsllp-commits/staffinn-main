const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const insertDefaultRoles = async () => {
  const defaultRoles = [
    {
      roleId: 'ROLE_EMPLOYEE',
      roleName: 'Employee',
      companyId: 'DEFAULT',
      permissions: ['view_profile', 'edit_profile', 'mark_attendance', 'apply_leave', 'view_payslip'],
      createdAt: new Date().toISOString()
    },
    {
      roleId: 'ROLE_MANAGER',
      roleName: 'Manager',
      companyId: 'DEFAULT',
      permissions: ['view_profile', 'edit_profile', 'mark_attendance', 'apply_leave', 'view_payslip', 'approve_leave', 'view_team'],
      createdAt: new Date().toISOString()
    }
  ];

  try {
    for (const role of defaultRoles) {
      await docClient.send(new PutCommand({
        TableName: 'staffinn-hrms-roles',
        Item: role
      }));
      console.log(`✅ Inserted role: ${role.roleName}`);
    }
    console.log('✅ All default roles inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting roles:', error.message);
  }
};

insertDefaultRoles();
