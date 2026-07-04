const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
    CreateTableCommand, 
    DescribeTableCommand,
    waitUntilTableExists 
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function createDevicesTable() {
    const tableName = 'staffinn-hrms-devices';

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
                { AttributeName: 'deviceId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'deviceId', AttributeType: 'S' },
                { AttributeName: 'recruiterId', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [
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
        console.log(`   - Partition Key: deviceId (String)`);
        console.log(`   - GSI: recruiterId-index`);

    } catch (error) {
        console.error(`❌ Error creating table:`, error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createDevicesTable()
        .then(() => {
            console.log('✅ Setup complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { createDevicesTable };
