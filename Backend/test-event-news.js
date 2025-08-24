/**
 * Test script for Events & News functionality
 * Run this to test the DynamoDB operations
 */

const {
  createEventNews,
  getEventNewsByInstituteId,
  getEventNewsById,
  updateEventNews,
  deleteEventNews,
  getEventNewsByType
} = require('./models/instituteEventNewsModel');

async function testEventNewsOperations() {
  try {
    console.log('🧪 Testing Events & News Operations...\n');

    const testInstituteId = 'test-institute-123';

    // Test 1: Create an event
    console.log('1. Creating a test event...');
    const eventData = {
      title: 'Annual Tech Conference 2024',
      date: '2024-03-15',
      company: 'Tech Solutions Inc.',
      expectedParticipants: 150,
      details: 'Join us for our annual technology conference featuring industry leaders and cutting-edge innovations.',
      type: 'Event',
      verified: true,
      bannerImage: 'https://example.com/banner.jpg'
    };

    const createdEvent = await createEventNews(testInstituteId, eventData);
    console.log('✅ Event created:', createdEvent.eventNewsId);

    // Test 2: Create a news item
    console.log('\n2. Creating a test news item...');
    const newsData = {
      title: 'New Partnership with Google',
      date: '2024-02-20',
      company: 'Google Inc.',
      expectedParticipants: null,
      details: 'We are excited to announce our new partnership with Google for advanced AI training programs.',
      type: 'News',
      verified: true,
      bannerImage: null
    };

    const createdNews = await createEventNews(testInstituteId, newsData);
    console.log('✅ News created:', createdNews.eventNewsId);

    // Test 3: Get all events and news for institute
    console.log('\n3. Retrieving all events and news...');
    const allItems = await getEventNewsByInstituteId(testInstituteId);
    console.log('✅ Retrieved items:', allItems.length);

    // Test 4: Get events only
    console.log('\n4. Retrieving events only...');
    const events = await getEventNewsByType(testInstituteId, 'Event');
    console.log('✅ Retrieved events:', events.length);

    // Test 5: Get news only
    console.log('\n5. Retrieving news only...');
    const news = await getEventNewsByType(testInstituteId, 'News');
    console.log('✅ Retrieved news:', news.length);

    // Test 6: Get specific item
    console.log('\n6. Retrieving specific event...');
    const specificEvent = await getEventNewsById(testInstituteId, createdEvent.eventNewsId);
    console.log('✅ Retrieved specific event:', specificEvent ? specificEvent.title : 'Not found');

    // Test 7: Update an item
    console.log('\n7. Updating event...');
    const updateData = {
      title: 'Annual Tech Conference 2024 - Updated',
      expectedParticipants: 200
    };
    const updatedEvent = await updateEventNews(testInstituteId, createdEvent.eventNewsId, updateData);
    console.log('✅ Event updated:', updatedEvent.title);

    // Test 8: Delete items (cleanup)
    console.log('\n8. Cleaning up test data...');
    await deleteEventNews(testInstituteId, createdEvent.eventNewsId);
    await deleteEventNews(testInstituteId, createdNews.eventNewsId);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testEventNewsOperations();
}

module.exports = { testEventNewsOperations };