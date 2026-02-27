const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
    CreateTableCommand, 
    DescribeTableCommand,
    waitUntilTableExists 
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function createAttendanceTable() {
    const tableName = 'staffinn-hrms-attendance';

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
                { AttributeName: 'attendanceId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'attendanceId', AttributeType: 'S' },
                { AttributeName: 'employeeId', AttributeType: 'S' },
                { AttributeName: 'date', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'employeeId-date-index',
                    KeySchema: [
                        { AttributeName: 'employeeId', KeyType: 'HASH' },
                        { AttributeName: 'date', KeyType: 'RANGE' }
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
        console.log(`   - Partition Key: attendanceId (String)`);
        console.log(`   - GSI: employeeId-date-index`);

    } catch (error) {
        console.error(`❌ Error creating table:`, error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createAttendanceTable()
        .then(() => {
            console.log('✅ Setup complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { createAttendanceTable };
