const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
    CreateTableCommand, 
    DescribeTableCommand,
    waitUntilTableExists 
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function createEmployeeDeviceMappingTable() {
    const tableName = 'staffinn-hrms-employee-device-mappings';

    try {
        // Check if table exists
        try {
            await client.send(new DescribeTableCommand({ TableName: tableName }));
            console.log(`✅ Table ${tableName} already exists`);
            return;
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                throw error;
            }
        }

        // Create table
        const params = {
            TableName: tableName,
            KeySchema: [
                { AttributeName: 'mappingId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'mappingId', AttributeType: 'S' },
                { AttributeName: 'employeeId', AttributeType: 'S' },
                { AttributeName: 'deviceUserId', AttributeType: 'S' },
                { AttributeName: 'recruiterId', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'employeeId-index',
                    KeySchema: [
                        { AttributeName: 'employeeId', KeyType: 'HASH' }
                    ],
                    Projection: { ProjectionType: 'ALL' },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                },
                {
                    IndexName: 'deviceUserId-index',
                    KeySchema: [
                        { AttributeName: 'deviceUserId', KeyType: 'HASH' }
                    ],
                    Projection: { ProjectionType: 'ALL' },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                },
                {
                    IndexName: 'recruiterId-index',
                    KeySchema: [
                        { AttributeName: 'recruiterId', KeyType: 'HASH' }
                    ],
                    Projection: { ProjectionType: 'ALL' },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        };

        console.log(`Creating table ${tableName}...`);
        await client.send(new CreateTableCommand(params));

        // Wait for table to be active
        await waitUntilTableExists(
            { client, maxWaitTime: 60 },
            { TableName: tableName }
        );

        console.log(`✅ Table ${tableName} created successfully!`);
        console.log(`   - Partition Key: mappingId (String)`);
        console.log(`   - GSI: employeeId-index`);
        console.log(`   - GSI: deviceUserId-index`);
        console.log(`   - GSI: recruiterId-index`);

    } catch (error) {
        console.error(`❌ Error creating table:`, error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createEmployeeDeviceMappingTable()
        .then(() => {
            console.log('✅ Setup complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { createEmployeeDeviceMappingTable };
