require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'recruiter-news';

async function fixExistingNews() {
    try {
        console.log('🔧 Fixing existing news item...');
        
        const existingNewsId = '8532ae91-3a53-49ac-b543-510a055c69b6';
        const recruiterId = 'afe9a0b5-63dc-46c3-9c70-4725b2d0fbb6'; // Your recruiter ID
        
        // Update the existing news item to add recruiterId
        const updateParams = {
            TableName: TABLE_NAME,
            Key: { recruiterNewsID: existingNewsId },
            UpdateExpression: 'SET recruiterId = :recruiterId, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':recruiterId': recruiterId,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        console.log('📝 Updating news item with recruiterId...');
        const result = await dynamodb.update(updateParams).promise();
        
        console.log('✅ Successfully updated news item!');
        console.log('📊 Updated item:');
        console.log('   recruiterNewsID:', result.Attributes.recruiterNewsID);
        console.log('   recruiterId:', result.Attributes.recruiterId);
        console.log('   recruiterName:', result.Attributes.recruiterName);
        console.log('   title:', result.Attributes.title);
        console.log('   company:', result.Attributes.company);
        
        // Verify the update
        console.log('\n🔍 Verifying update...');
        const getParams = {
            TableName: TABLE_NAME,
            Key: { recruiterNewsID: existingNewsId }
        };
        
        const getResult = await dynamodb.get(getParams).promise();
        if (getResult.Item && getResult.Item.recruiterId) {
            console.log('✅ Verification successful! recruiterId is now present.');
        } else {
            console.log('❌ Verification failed! recruiterId is still missing.');
        }
        
    } catch (error) {
        console.error('❌ Error fixing existing news:', error);
    }
}

fixExistingNews();