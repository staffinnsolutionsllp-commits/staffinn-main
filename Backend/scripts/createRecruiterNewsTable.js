const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
});

const dynamodb = new AWS.DynamoDB();

const createRecruiterNewsTable = async () => {
    const params = {
        TableName: 'recruiter-news',
        KeySchema: [
            {
                AttributeName: 'recruiterNewsID',
                KeyType: 'HASH' // Partition key
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: 'recruiterNewsID',
                AttributeType: 'S'
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        console.log('Creating recruiter-news table...');
        const result = await dynamodb.createTable(params).promise();
        console.log('Table created successfully:', result.TableDescription.TableName);
        console.log('Table ARN:', result.TableDescription.TableArn);
        
        // Wait for table to be active
        console.log('Waiting for table to be active...');
        await dynamodb.waitFor('tableExists', { TableName: 'recruiter-news' }).promise();
        console.log('Table is now active and ready to use!');
        
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log('Table already exists');
        } else {
            console.error('Error creating table:', error);
        }
    }
};

// Run the script
if (require.main === module) {
    createRecruiterNewsTable()
        .then(() => {
            console.log('Script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = createRecruiterNewsTable;