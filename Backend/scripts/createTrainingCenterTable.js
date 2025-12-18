const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function createTrainingCenterTable() {
    const params = {
        TableName: 'MisTrainingCenterForm',
        KeySchema: [
            { AttributeName: 'TrainingCenterFormId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'TrainingCenterFormId', AttributeType: 'S' },
            { AttributeName: 'instituteId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'instituteId-index',
                KeySchema: [
                    { AttributeName: 'instituteId', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL'
                },
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
        const command = new CreateTableCommand(params);
        await client.send(command);
        console.log('✅ MisTrainingCenterForm table created successfully');
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log('ℹ️  Table already exists');
        } else {
            console.error('❌ Error creating table:', error);
            throw error;
        }
    }
}

createTrainingCenterTable();
