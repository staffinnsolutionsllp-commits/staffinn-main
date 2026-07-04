const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'ap-south-1' });

async function createAttendanceTable() {
    const params = {
        TableName: 'staffinn-attendance',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'employeeId', AttributeType: 'S' },
            { AttributeName: 'date', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'EmployeeDateIndex',
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

    try {
        await client.send(new CreateTableCommand(params));
        console.log('✅ Attendance table created successfully');
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log('⚠️ Table already exists');
        } else {
            console.error('❌ Error:', error);
        }
    }
}

createAttendanceTable();
