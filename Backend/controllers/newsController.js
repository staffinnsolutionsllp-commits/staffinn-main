const instituteEventNewsModel = require('../models/instituteEventNewsModel');
const recruiterNewsModel = require('../models/recruiterNewsModel');
const { PostedNewsModel } = require('../models/newsAdminModel');

const newsController = {
  // Get all news (institute events/news) for public news page
  getAllNews: async (req, res) => {
    try {
      console.log('Getting all news for public news page...');
      
      // Get all institute events and news
      const instituteNewsResponse = await instituteEventNewsModel.getAllPublic();
      const instituteNews = instituteNewsResponse.success ? instituteNewsResponse.data : [];
      
      // Get all recruiter news
      const recruiterNewsResponse = await recruiterNewsModel.getAllPublic();
      const recruiterNews = recruiterNewsResponse.success ? recruiterNewsResponse.data : [];
      
      // Get all posted news from News Admin Panel
      const postedNews = await PostedNewsModel.getVisible();
      
      // Transform institute news to match news page format
      const transformedInstituteNews = instituteNews.map(item => ({
        id: `institute_${item.eventNewsId}`,
        title: item.title,
        description: item.details,
        image: item.bannerImage || "/api/placeholder/300/200",
        bannerImage: item.bannerImage || "/api/placeholder/300/200",
        category: "institute",
        date: new Date(item.date).toLocaleDateString(),
        source: item.company || "Institute News",
        likes: Math.floor(Math.random() * 500) + 50, // Random likes for demo
        comments: Math.floor(Math.random() * 100) + 10, // Random comments for demo
        saved: false,
        type: item.type,
        venue: item.venue,
        expectedParticipants: item.expectedParticipants,
        verified: item.verified || false,
        originalData: item
      }));
      
      // Transform recruiter news to match news page format
      const transformedRecruiterNews = recruiterNews.map(item => ({
        id: `recruiter_${item.recruiterNewsID}`,
        title: item.title,
        description: item.details,
        image: item.bannerImage || "/api/placeholder/300/200",
        bannerImage: item.bannerImage || "/api/placeholder/300/200",
        category: "recruiter",
        date: new Date(item.date).toLocaleDateString(),
        source: item.company || item.recruiterName || "Recruiter News",
        likes: Math.floor(Math.random() * 500) + 50, // Random likes for demo
        comments: Math.floor(Math.random() * 100) + 10, // Random comments for demo
        saved: false,
        type: item.type,
        venue: item.venue,
        expectedParticipants: item.expectedParticipants,
        verified: item.verified || false,
        originalData: item
      }));
      
      // Transform posted news to match news page format
      const transformedPostedNews = postedNews.map(item => ({
        id: `staff_${item.staffinnpostednews}`,
        title: item.title,
        description: item.description,
        image: item.bannerImageUrl || "/api/placeholder/300/200",
        bannerImage: item.bannerImageUrl || "/api/placeholder/300/200",
        category: "staff",
        date: new Date(item.createdAt).toLocaleDateString(),
        source: "Staffinn",
        likes: Math.floor(Math.random() * 500) + 50, // Random likes for demo
        comments: Math.floor(Math.random() * 100) + 10, // Random comments for demo
        saved: false,
        verified: true,
        staffinnpostednews: item.staffinnpostednews,
        createdAt: item.createdAt,
        originalData: item
      }));
      
      // Combine all news and sort by date (newest first)
      const allNews = [...transformedInstituteNews, ...transformedRecruiterNews, ...transformedPostedNews];
      allNews.sort((a, b) => new Date(b.originalData.date || b.originalData.createdAt) - new Date(a.originalData.date || a.originalData.createdAt));
      
      console.log(`Found ${instituteNews.length} institute news, ${recruiterNews.length} recruiter news, ${postedNews.length} posted news`);
      
      res.json({
        success: true,
        data: {
          all: allNews,
          institute: transformedInstituteNews,
          recruiter: transformedRecruiterNews,
          staff: transformedPostedNews
        },
        message: 'News retrieved successfully'
      });
    } catch (error) {
      console.error('Get all news error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get news',
        error: error.message
      });
    }
  },

  // Get news by category
  getNewsByCategory: async (req, res) => {
    const { category } = req.params;
    try {
      console.log(`Getting news for category: ${category}`);
      
      let newsData = [];
      
      if (category === 'staff') {
        const postedNews = await PostedNewsModel.getVisible();
        newsData = postedNews.map(item => ({
          id: `staff_${item.staffinnpostednews}`,
          title: item.title,
          description: item.description,
          image: item.bannerImageUrl || "/api/placeholder/300/200",
          bannerImage: item.bannerImageUrl || "/api/placeholder/300/200",
          category: "staff",
          date: new Date(item.createdAt).toLocaleDateString(),
          source: "Staffinn",
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 10,
          saved: false,
          verified: true,
          staffinnpostednews: item.staffinnpostednews,
          createdAt: item.createdAt,
          originalData: item
        }));
      } else if (category === 'institute') {
        const response = await instituteEventNewsModel.getAllPublic();
        if (response.success) {
          newsData = response.data.map(item => ({
            id: `institute_${item.eventNewsId}`,
            title: item.title,
            description: item.details,
            image: item.bannerImage || "/api/placeholder/300/200",
            bannerImage: item.bannerImage || "/api/placeholder/300/200",
            category: "institute",
            date: new Date(item.date).toLocaleDateString(),
            source: item.company || "Institute News",
            likes: Math.floor(Math.random() * 500) + 50,
            comments: Math.floor(Math.random() * 100) + 10,
            saved: false,
            verified: item.verified || false,
            originalData: item
          }));
        }
      } else if (category === 'recruiter') {
        const response = await recruiterNewsModel.getAllPublic();
        if (response.success) {
          newsData = response.data.map(item => ({
            id: `recruiter_${item.recruiterNewsID}`,
            title: item.title,
            description: item.details,
            image: item.bannerImage || "/api/placeholder/300/200",
            bannerImage: item.bannerImage || "/api/placeholder/300/200",
            category: "recruiter",
            date: new Date(item.date).toLocaleDateString(),
            source: item.company || item.recruiterName || "Recruiter News",
            likes: Math.floor(Math.random() * 500) + 50,
            comments: Math.floor(Math.random() * 100) + 10,
            saved: false,
            verified: item.verified || false,
            originalData: item
          }));
        }
      }
      
      // Sort by date (newest first)
      newsData.sort((a, b) => new Date(b.originalData.date || b.originalData.createdAt) - new Date(a.originalData.date || a.originalData.createdAt));
      
      res.json({
        success: true,
        data: newsData,
        message: `${category} news retrieved successfully`
      });
    } catch (error) {
      console.error(`Get ${category} news error:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to get ${category} news`,
        error: error.message
      });
    }
  }
};

module.exports = newsController;