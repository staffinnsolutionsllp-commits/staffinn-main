const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const createRolesTable = async () => {
  const params = {
    TableName: 'staffinn-hrms-roles',
    KeySchema: [
      { AttributeName: 'roleId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'roleId', AttributeType: 'S' },
      { AttributeName: 'companyId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'companyId-index',
        KeySchema: [{ AttributeName: 'companyId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log('✅ Roles table created successfully');
    
    // Wait for table to be active
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Insert default roles
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

    for (const role of defaultRoles) {
      await docClient.send(new PutCommand({
        TableName: 'staffinn-hrms-roles',
        Item: role
      }));
    }
    console.log('✅ Default roles inserted');
    
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️ Roles table already exists');
    } else {
      throw error;
    }
  }
};

createRolesTable().catch(console.error);
