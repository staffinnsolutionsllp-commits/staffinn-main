require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

console.log('AWS Config:', {
    region: 'ap-south-1',
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'recruiter-news';

async function debugRecruiterNews() {
    try {
        console.log('🔍 Checking recruiter-news table...');
        
        // Get all items from the table
        const params = {
            TableName: TABLE_NAME
        };
        
        const result = await dynamodb.scan(params).promise();
        console.log(`📊 Found ${result.Items.length} items in the table`);
        
        // Check each item for recruiterId
        result.Items.forEach((item, index) => {
            console.log(`\n📝 Item ${index + 1}:`);
            console.log(`   recruiterNewsID: ${item.recruiterNewsID}`);
            console.log(`   recruiterId: ${item.recruiterId || 'MISSING ❌'}`);
            console.log(`   recruiterName: ${item.recruiterName || 'MISSING ❌'}`);
            console.log(`   title: ${item.title}`);
            console.log(`   company: ${item.company}`);
            console.log(`   createdAt: ${item.createdAt}`);
            
            // Check if recruiterId is missing
            if (!item.recruiterId) {
                console.log(`   ⚠️  WARNING: recruiterId is missing for this item!`);
            }
        });
        
        // Check specific item by ID if provided
        const specificNewsId = '8532ae91-3a53-49ac-b543-510a055c69b6';
        console.log(`\n🔍 Checking specific news item: ${specificNewsId}`);
        
        const specificParams = {
            TableName: TABLE_NAME,
            Key: { recruiterNewsID: specificNewsId }
        };
        
        const specificResult = await dynamodb.get(specificParams).promise();
        if (specificResult.Item) {
            console.log('✅ Found specific item:');
            console.log('   All attributes:', Object.keys(specificResult.Item));
            console.log('   recruiterId:', specificResult.Item.recruiterId || 'MISSING ❌');
            console.log('   Full item:', JSON.stringify(specificResult.Item, null, 2));
        } else {
            console.log('❌ Specific item not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugRecruiterNews();