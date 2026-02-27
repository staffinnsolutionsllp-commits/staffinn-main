const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function createAttendanceTable() {
    const params = {
        TableName: 'staffinn-attendance',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        const result = await client.send(new CreateTableCommand(params));
        console.log('✅ Attendance table created:', result.TableDescription.TableName);
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log('✅ Attendance table already exists');
        } else {
            console.error('❌ Error creating table:', error);
        }
    }
}

createAttendanceTable();