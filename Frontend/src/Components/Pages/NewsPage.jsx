/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiWithLoading from '../../services/apiWithLoading';
import NewsDisplayAPI from '../../services/newsDisplayApi';
import io from 'socket.io-client';
import './NewsPage.css';

import { 
  FaPlay, 
  FaBookmark, 
  FaRegBookmark, 
  FaShareAlt, 
  FaThumbsUp, 
  FaComment, 
  FaBell, 
  FaClock, 
  FaExternalLinkAlt, 
  FaChevronLeft, 
  FaChevronRight, 
  FaPodcast, 
  FaVideo,
  FaChevronDown,
  FaUsers,
  FaUniversity,
  FaBuilding
} from 'react-icons/fa';

const NewsPage = () => {
  const location = useLocation();
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeNewsCategory, setActiveNewsCategory] = useState('all');
  
  // News Admin Panel data states
  const [featuredHeroSection, setFeaturedHeroSection] = useState(null);
  const [realTimeTrendingTopics, setRealTimeTrendingTopics] = useState([]);
  const [realTimeExpertInsights, setRealTimeExpertInsights] = useState([]);
  const [postedNews, setPostedNews] = useState([]);
  const [socket, setSocket] = useState(null);
  
  // Check if we have a specific news item to display
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const newsId = urlParams.get('id');
    const newsTitle = urlParams.get('title');
    
    if (newsId && newsTitle) {
      // In a real implementation, you would fetch the news item by ID
      // For now, we'll create a placeholder with the title
      setSelectedNewsItem({
        eventNewsId: newsId,
        title: decodeURIComponent(newsTitle),
        type: 'News',
        date: new Date().toISOString(),
        company: 'Institute News',
        details: 'This news item was selected from an institute page. Full details would be loaded from the database.',
        verified: true,
        bannerImage: null
      });
    }
  }, [location]);
  
  // News categories for the top section
  const newsCategories = [
    { 
      id: 'staff', 
      name: 'Staff', 
      icon: FaUsers, 
      description: 'News and updates related to staff members, career opportunities, and professional development.',
      color: '#3b82f6'
    },
    { 
      id: 'institute', 
      name: 'Institute', 
      icon: FaUniversity, 
      description: 'Institute announcements, events, academic updates, and institutional news.',
      color: '#10b981'
    },
    { 
      id: 'recruiter', 
      name: 'Recruiter', 
      icon: FaBuilding, 
      description: 'Recruiter announcements, job openings, company news, and hiring updates.',
      color: '#f59e0b'
    },

  ];

  // Featured news - use real-time hero section or selected news item only
  const featuredNews = featuredHeroSection ? {
    id: featuredHeroSection.newsherosection,
    title: featuredHeroSection.title,
    description: featuredHeroSection.content,
    image: featuredHeroSection.bannerImageUrl || "/api/placeholder/1200/600",
    date: new Date(featuredHeroSection.createdAt).toLocaleDateString(),
    source: "Staffinn News",
    category: "staff",
    tags: featuredHeroSection.tags
  } : selectedNewsItem;
  
  // Use real-time trending topics only
  const trendingTopics = realTimeTrendingTopics.length > 0 ? 
    realTimeTrendingTopics.map(topic => ({
      id: topic.newstrendingtopics,
      title: topic.title,
      image: topic.imageUrl || "/api/placeholder/300/200",
      description: topic.description
    })) : [];
  
  const breakingNews = [
    "TCS Announces Plan to Hire 40,000 Freshers in 2025",
    "Government Increases Stipend Amount for Apprenticeship Programs",
    "Amazon Opens New Tech Hub in Hyderabad, Creating 5,000 Jobs",
    "Study Shows 60% Increase in Demand for Data Scientists",
    "New Labor Law Changes to Impact Contractual Employment"
  ];
  

  
  // Real news data from API
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  
  // Use real-time expert insights only
  const expertInsights = realTimeExpertInsights.length > 0 ? 
    realTimeExpertInsights.map(insight => ({
      id: insight.newsexpertinsights,
      expertName: insight.expertName,
      title: insight.designation,
      topic: insight.title,
      image: insight.thumbnailUrl || "/api/placeholder/150/150",
      videoUrl: insight.videoUrl || "#"
    })) : [];
  

  

  
  // Real-time job alerts state
  const [jobAlerts, setJobAlerts] = useState([]);
  const [jobAlertsLoading, setJobAlertsLoading] = useState(true);

  // State management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsFilter, setNewsFilter] = useState("all");
  const [saveStates, setSaveStates] = useState({});

  const [showNotification, setShowNotification] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  
  // Popular Tags state
  const [popularTags, setPopularTags] = useState([]);
  const [searchKeywords, setSearchKeywords] = useState([]);

  // Toggle save state for articles
  const toggleSave = (articleId) => {
    setSaveStates(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };
  
  // Extract keywords from text
  const extractKeywords = (text) => {
    if (!text) return [];
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 10);
  };
  
  // Generate popular tags from news articles
  const generatePopularTags = () => {
    const keywordCount = {};
    
    // Extract keywords from all news articles
    newsArticles.forEach(article => {
      const titleKeywords = extractKeywords(article.title);
      const descriptionKeywords = extractKeywords(article.description || article.details);
      const allKeywords = [...titleKeywords, ...descriptionKeywords];
      
      allKeywords.forEach(keyword => {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      });
    });
    
    // Add search keywords with higher weight
    searchKeywords.forEach(keyword => {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 3;
    });
    
    // Sort by frequency and get top 15
    const sortedTags = Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([keyword, count]) => ({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        count
      }));
    
    setPopularTags(sortedTags);
  };
  
  // Handle tag click for filtering
  const handleTagClick = (tagName) => {
    // Add to search keywords for future popularity
    setSearchKeywords(prev => {
      const updated = [tagName.toLowerCase(), ...prev.slice(0, 19)];
      return [...new Set(updated)];
    });
    
    // Filter news by tag
    const filtered = newsArticles.filter(article => {
      const searchText = `${article.title} ${article.description || article.details}`.toLowerCase();
      return searchText.includes(tagName.toLowerCase());
    });
    
    if (filtered.length > 0) {
      // Scroll to news feed and highlight matching articles
      document.querySelector('.news-feed')?.scrollIntoView({ behavior: 'smooth' });
    }
  };







  // Get category statistics
  const getCategoryStats = () => {
    const stats = {
      all: newsArticles.length,
      staff: newsArticles.filter(article => 
        article.category === 'staff' || 
        (article.source && article.source.toLowerCase().includes('staff')) ||
        article.staffinnpostednews ||
        (article.source && article.source === 'Staffinn') ||
        (article.bannerImage && article.bannerImage.includes('staffinn-posted-news-photos'))
      ).length,
      institute: newsArticles.filter(article => 
        article.category === 'institute' || 
        (article.source && article.source.toLowerCase().includes('institute'))
      ).length,
      recruiter: newsArticles.filter(article => 
        article.category === 'recruiter' || 
        (article.source && article.source.toLowerCase().includes('recruiter'))
      ).length
    };
    return stats;
  };

  const categoryStats = getCategoryStats();

  // Filter articles based on selected category
  const filteredArticles = newsArticles.filter(article => {
    if (newsFilter === 'all') return true;
    if (newsFilter === 'staff') {
      console.log('Checking article for staff filter:', article);
      const isStaff = article.category === 'staff' || 
                     (article.source && article.source.toLowerCase().includes('staff')) ||
                     article.staffinnpostednews ||
                     (article.source && article.source === 'Staffinn') ||
                     (article.bannerImage && article.bannerImage.includes('staffinn-posted-news-photos'));
      console.log('Is staff:', isStaff);
      return isStaff;
    }
    if (newsFilter === 'institute') {
      return article.category === 'institute' || 
             (article.source && article.source.toLowerCase().includes('institute'));
    }
    if (newsFilter === 'recruiter') {
      return article.category === 'recruiter' || 
             (article.source && article.source.toLowerCase().includes('recruiter'));
    }
    return true;
  });

  // Generate popular tags when news articles change
  useEffect(() => {
    if (newsArticles.length > 0) {
      generatePopularTags();
    }
  }, [newsArticles, searchKeywords]);
  
  // Load news data and initialize real-time updates on component mount
  useEffect(() => {
    loadAllNews();
    loadNewsAdminData();
    loadJobAlerts();
    setNewsFilter('all');
    
    // Initialize socket connection for real-time updates
    const socketConnection = io('http://localhost:5000', {
      auth: {
        token: null // No authentication required for news updates
      }
    });
    
    setSocket(socketConnection);
    
    // Listen for real-time news admin updates
    socketConnection.on('heroSectionCreated', (data) => {
      console.log('New hero section created:', data);
      if (data.isActive) {
        setFeaturedHeroSection(data);
      }
    });
    
    socketConnection.on('heroSectionUpdated', (data) => {
      console.log('Hero section updated:', data);
      if (data.isActive) {
        setFeaturedHeroSection(data);
      }
    });
    
    socketConnection.on('heroSectionVisibilityToggled', (data) => {
      console.log('Hero section visibility toggled:', data);
      if (data.isActive) {
        setFeaturedHeroSection(data);
      } else {
        // If current featured section was hidden, clear it
        if (featuredHeroSection && featuredHeroSection.newsherosection === data.newsherosection) {
          setFeaturedHeroSection(null);
          // Reload to get next active hero section
          loadNewsAdminData();
        }
      }
    });
    
    socketConnection.on('trendingTopicCreated', (data) => {
      console.log('New trending topic created:', data);
      setRealTimeTrendingTopics(prev => [data, ...prev.slice(0, 14)]); // Keep max 15
    });
    
    socketConnection.on('trendingTopicUpdated', (data) => {
      console.log('Trending topic updated:', data);
      setRealTimeTrendingTopics(prev => 
        prev.map(topic => topic.newstrendingtopics === data.newstrendingtopics ? data : topic)
      );
    });
    
    socketConnection.on('trendingTopicVisibilityToggled', (data) => {
      console.log('Trending topic visibility toggled:', data);
      if (data.isVisible) {
        setRealTimeTrendingTopics(prev => {
          const exists = prev.find(topic => topic.newstrendingtopics === data.newstrendingtopics);
          if (!exists) {
            return [data, ...prev.slice(0, 14)];
          }
          return prev.map(topic => topic.newstrendingtopics === data.newstrendingtopics ? data : topic);
        });
      } else {
        setRealTimeTrendingTopics(prev => 
          prev.filter(topic => topic.newstrendingtopics !== data.newstrendingtopics)
        );
      }
    });
    
    socketConnection.on('trendingTopicDeleted', (data) => {
      console.log('Trending topic deleted:', data);
      setRealTimeTrendingTopics(prev => 
        prev.filter(topic => topic.newstrendingtopics !== data.topicId)
      );
    });
    
    socketConnection.on('expertInsightCreated', (data) => {
      console.log('New expert insight created:', data);
      setRealTimeExpertInsights(prev => [data, ...prev]);
    });
    
    socketConnection.on('expertInsightUpdated', (data) => {
      console.log('Expert insight updated:', data);
      setRealTimeExpertInsights(prev => 
        prev.map(insight => insight.newsexpertinsights === data.newsexpertinsights ? data : insight)
      );
    });
    
    socketConnection.on('expertInsightVisibilityToggled', (data) => {
      console.log('Expert insight visibility toggled:', data);
      if (data.isVisible) {
        setRealTimeExpertInsights(prev => {
          const exists = prev.find(insight => insight.newsexpertinsights === data.newsexpertinsights);
          if (!exists) {
            return [data, ...prev];
          }
          return prev.map(insight => insight.newsexpertinsights === data.newsexpertinsights ? data : insight);
        });
      } else {
        setRealTimeExpertInsights(prev => 
          prev.filter(insight => insight.newsexpertinsights !== data.newsexpertinsights)
        );
      }
    });
    
    socketConnection.on('expertInsightDeleted', (data) => {
      console.log('Expert insight deleted:', data);
      setRealTimeExpertInsights(prev => 
        prev.filter(insight => insight.newsexpertinsights !== data.insightId)
      );
    });
    
    // Listen for posted news updates
    socketConnection.on('postedNewsCreated', (data) => {
      console.log('New posted news created:', data);
      if (data.isVisible) {
        setPostedNews(prev => [data, ...prev]);
        // Manually trigger a page reload to refresh news
        window.location.reload();
      }
    });
    
    socketConnection.on('postedNewsUpdated', (data) => {
      console.log('Posted news updated:', data);
      if (data.isVisible) {
        setPostedNews(prev => prev.map(item => 
          item.staffinnpostednews === data.staffinnpostednews ? data : item
        ));
      }
    });
    
    socketConnection.on('postedNewsVisibilityToggled', (data) => {
      console.log('Posted news visibility toggled:', data);
      window.location.reload();
    });
    
    socketConnection.on('postedNewsDeleted', (data) => {
      console.log('Posted news deleted:', data);
      window.location.reload();
    });
    
    // Set up periodic refresh to catch new news and job alerts
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing news and job alerts...');
      loadAllNews();
      loadJobAlerts();
    }, 30000); // Refresh every 30 seconds
    
    // Listen for custom news update events
    const handleNewsUpdate = () => {
      console.log('News update event received, refreshing...');
      loadAllNews();
    };
    
    window.addEventListener('newsUpdated', handleNewsUpdate);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('newsUpdated', handleNewsUpdate);
      socketConnection.disconnect();
    };
  }, []);
  
  // Load News Admin Panel data
  const loadNewsAdminData = async () => {
    try {
      console.log('Loading News Admin Panel data...');
      
      // Load latest hero section
      const heroResponse = await NewsDisplayAPI.getLatestHeroSection();
      if (heroResponse.success && heroResponse.data) {
        console.log('Loaded hero section:', heroResponse.data);
        setFeaturedHeroSection(heroResponse.data);
      }
      
      // Load visible trending topics
      const topicsResponse = await NewsDisplayAPI.getVisibleTrendingTopics();
      if (topicsResponse.success && topicsResponse.data) {
        console.log('Loaded trending topics:', topicsResponse.data);
        setRealTimeTrendingTopics(topicsResponse.data);
      }
      
      // Load visible expert insights
      const insightsResponse = await NewsDisplayAPI.getVisibleExpertInsights();
      if (insightsResponse.success && insightsResponse.data) {
        console.log('Loaded expert insights:', insightsResponse.data);
        setRealTimeExpertInsights(insightsResponse.data);
      }
      
      // Load visible posted news
      const postedResponse = await NewsDisplayAPI.getVisiblePostedNews();
      if (postedResponse.success && postedResponse.data) {
        console.log('Loaded posted news:', postedResponse.data);
        setPostedNews(postedResponse.data);
      }
    } catch (error) {
      console.error('Error loading News Admin Panel data:', error);
    }
  };
  
  // Load today's jobs for Job Alerts
  const loadJobAlerts = async () => {
    try {
      setJobAlertsLoading(true);
      console.log('Loading today\'s jobs for Job Alerts...');
      
      const response = await apiWithLoading.getTodaysJobs(5); // Limit to 5 jobs
      
      if (response.success && response.data) {
        const formattedJobs = response.data.map(job => ({
          id: job.jobId,
          company: job.recruiterInfo?.companyName || 'Company',
          role: job.title,
          location: job.location,
          posted: formatJobPostedTime(job.postedDate),
          recruiterId: job.recruiterId,
          jobId: job.jobId,
          salary: job.salary,
          experience: job.experience,
          jobType: job.jobType
        }));
        
        console.log('Formatted job alerts:', formattedJobs);
        setJobAlerts(formattedJobs);
      } else {
        console.log('No job alerts found or API failed');
        setJobAlerts([]);
      }
    } catch (error) {
      console.error('Error loading job alerts:', error);
      setJobAlerts([]);
    } finally {
      setJobAlertsLoading(false);
    }
  };
  
  // Format job posted time
  const formatJobPostedTime = (postedDate) => {
    const now = new Date();
    const posted = new Date(postedDate);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just posted';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Today';
    }
  };
  
  // Handle View Job button click
  const handleViewJob = (job) => {
    // Navigate to recruiter page with job focus
    window.open(`/recruiter/${job.recruiterId}#job-${job.jobId}`, '_blank');
  };

  // Load all news from API
  const loadAllNews = async () => {
    try {
      setNewsLoading(true);
      console.log('Loading all news for NewsPage...');
      
      // Load posted news first
      try {
        console.log('Attempting to load posted news...');
        const postedResponse = await NewsDisplayAPI.getVisiblePostedNews();
        console.log('Posted news API response:', postedResponse);
        if (postedResponse.success && postedResponse.data) {
          const formattedPostedNews = postedResponse.data.map(news => ({
            ...news,
            id: news.staffinnpostednews,
            category: 'staff',
            source: 'Staffinn',
            bannerImage: news.bannerImageUrl,
            details: news.description,
            date: news.createdAt
          }));
          setPostedNews(postedResponse.data);
          console.log('Loaded posted news:', formattedPostedNews);
        } else {
          console.log('No posted news found or API failed');
        }
      } catch (postedError) {
        console.error('Error loading posted news:', postedError);
      }
      
      // Try to get all news from the combined endpoint
      let response = await apiWithLoading.getAllNews();
      console.log('getAllNews response:', response);
      
      let allNews = [];
      
      if (response.success && response.data) {
        // Handle different response structures
        if (response.data.all) {
          allNews = response.data.all;
        } else if (Array.isArray(response.data)) {
          allNews = response.data;
        } else {
          // Combine different news types if they exist separately
          const instituteNews = response.data.institute || [];
          const recruiterNews = response.data.recruiter || [];
          const staffNews = response.data.staff || [];
          allNews = [...instituteNews, ...recruiterNews, ...staffNews];
        }
      } else {
        // If getAllNews fails, try to load from individual endpoints
        console.log('getAllNews failed, trying individual endpoints...');
        
        try {

          
          // Load institute news
          const instituteResponse = await apiWithLoading.getNewsByCategory('institute');
          console.log('Institute news response:', instituteResponse);
          if (instituteResponse.success && instituteResponse.data) {
            const instituteNews = Array.isArray(instituteResponse.data) ? instituteResponse.data : [];
            instituteNews.forEach(news => {
              news.category = 'institute';
              news.source = news.company || 'Institute';
            });
            allNews = [...allNews, ...instituteNews];
          }
          
          // Load staff news
          const staffResponse = await apiWithLoading.getNewsByCategory('staff');
          console.log('Staff news response:', staffResponse);
          if (staffResponse.success && staffResponse.data) {
            const staffNews = Array.isArray(staffResponse.data) ? staffResponse.data : [];
            staffNews.forEach(news => {
              news.category = 'staff';
              news.source = news.company || 'Staffinn';
            });
            allNews = [...allNews, ...staffNews];
          }
          
          // Load recruiter news
          const recruiterResponse = await apiWithLoading.getNewsByCategory('recruiter');
          console.log('Recruiter news response:', recruiterResponse);
          if (recruiterResponse.success && recruiterResponse.data) {
            const recruiterNews = Array.isArray(recruiterResponse.data) ? recruiterResponse.data : [];
            recruiterNews.forEach(news => {
              news.category = 'recruiter';
              news.source = news.company || news.source || 'Recruiter';
            });
            allNews = [...allNews, ...recruiterNews];
          }
          
      
      // Add posted news to all news
      try {
        console.log('Loading posted news for main feed...');
        const currentPostedResponse = await NewsDisplayAPI.getVisiblePostedNews();
        console.log('Posted news response for main feed:', currentPostedResponse);
        if (currentPostedResponse.success && currentPostedResponse.data && currentPostedResponse.data.length > 0) {
          const formattedPostedNews = currentPostedResponse.data.map(news => ({
            ...news,
            id: news.staffinnpostednews,
            category: 'staff',
            source: 'Staffinn',
            bannerImage: news.bannerImageUrl,
            details: news.description,
            date: news.createdAt
          }));
          console.log('Adding formatted posted news to allNews:', formattedPostedNews);
          allNews = [...allNews, ...formattedPostedNews];
        } else {
          console.log('No posted news to add to main feed');
        }
      } catch (postedError) {
        console.error('Error loading posted news in main load:', postedError);
      }
        } catch (individualError) {
          console.error('Error loading individual news categories:', individualError);
        }
      }
      
      // Sort news by date (newest first)
      allNews.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });
      
      // Debug: Log news by category
      const newsByCategory = {
        all: allNews.length,
        institute: allNews.filter(n => n.category === 'institute' || (n.source && n.source.toLowerCase().includes('institute'))).length,
        staff: allNews.filter(n => n.category === 'staff' || (n.source && n.source.toLowerCase().includes('staff')) || n.staffinnpostednews).length,
        recruiter: allNews.filter(n => n.category === 'recruiter' || (n.source && n.source.toLowerCase().includes('recruiter'))).length
      };
      console.log('News by category:', newsByCategory);
      console.log('Final news articles:', allNews);
      console.log('Posted news in final array:', allNews.filter(n => n.staffinnpostednews));
      setNewsArticles(allNews);
    } catch (error) {
      console.error('Error loading news:', error);
      setNewsArticles([]);
    } finally {
      setNewsLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % trendingTopics.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + trendingTopics.length) % trendingTopics.length);
  };

  return (
    <div className="news-page">

      {/* Top Section: Featured & Trending News */}
      <section className="top-news-section">
        {/* Featured News Banner */}
        <div className="featured-news">
          {selectedNewsItem ? (
            <>
              <div className="featured-news-image">
                <img 
                  src={selectedNewsItem.bannerImage || selectedNewsItem.originalData?.bannerImage || "/api/placeholder/1200/600"} 
                  alt={selectedNewsItem.title}
                  onError={(e) => {
                    e.target.src = "/api/placeholder/1200/600";
                  }}
                />
              </div>
              <div className="featured-news-content">
                <div className="featured-tag">
                  {selectedNewsItem.verified ? 'Verified News' : 'News Update'}
                </div>
                <h1>{selectedNewsItem.title}</h1>
                <p>{selectedNewsItem.details}</p>
                <div className="featured-news-meta">
                  <span className="meta-date">
                    <FaClock /> {new Date(selectedNewsItem.date).toLocaleDateString()}
                  </span>
                  <span className="meta-source">{selectedNewsItem.company}</span>
                  <span className="meta-category">{selectedNewsItem.type}</span>
                  {selectedNewsItem.expectedParticipants && (
                    <span className="meta-participants">
                      Expected Participants: {selectedNewsItem.expectedParticipants}
                    </span>
                  )}
                </div>
                <div className="news-actions">
                  <button className="back-btn" onClick={() => window.history.back()}>
                    ← Back to Institute
                  </button>
                  <button className="share-btn">
                    <FaShareAlt /> Share News
                  </button>
                </div>
              </div>
            </>
          ) : featuredNews ? (
            <>
              <div className="featured-news-image">
                <img src={featuredNews.image} alt={featuredNews.title} />
              </div>
              <div className="featured-news-content">
                <div className="featured-tag">Top News of the Day</div>
                <h1>{featuredNews.title}</h1>
                <p>{featuredNews.description && featuredNews.description.length > 200 ? 
                  `${featuredNews.description.substring(0, 200)}...` : 
                  featuredNews.description
                }</p>
                <div className="featured-news-meta">
                  <span className="meta-date"><FaClock /> {featuredNews.date}</span>
                  <span className="meta-source">{featuredNews.source}</span>
                  <span className="meta-category">{featuredNews.category}</span>
                  {featuredNews.tags && (
                    <div className="featured-tags">
                      {featuredNews.tags.split(',').map((tag, index) => (
                        <span key={index} className="featured-tag">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  className="read-more-btn"
                  onClick={() => {
                    setModalContent(featuredNews);
                    setShowModal(true);
                  }}
                >
                  Read Full Article
                </button>
              </div>
            </>
          ) : null}
        </div>
        
        {/* Trending Topics Carousel */}
        {trendingTopics.length > 0 && (
          <div className="trending-topics">
            <h2>Trending Topics</h2>
            <div className="topics-carousel">
              <button className="carousel-nav prev" onClick={prevSlide}><FaChevronLeft /></button>
              <div className="carousel-container">
                <div 
                  className="carousel-track" 
                  style={{ transform: `translateX(-${currentSlide * 33.33}%)` }}
                >
                  {trendingTopics.map((topic, index) => (
                    <div 
                      key={topic.id} 
                      className={`carousel-item ${index === currentSlide ? 'active' : ''}`}
                    >
                      <div 
                        className="topic-card"
                        onClick={() => {
                          setModalContent({
                            title: topic.title,
                            description: topic.description,
                            image: topic.image,
                            date: new Date().toLocaleDateString(),
                            source: "Trending Topics",
                            category: "Trending"
                          });
                          setShowModal(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src={topic.image} alt={topic.title} />
                        <h3>{topic.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="carousel-nav next" onClick={nextSlide}><FaChevronRight /></button>
            </div>
            <div className="carousel-indicators">
              {trendingTopics.map((_, index) => (
                <span 
                  key={index} 
                  className={`indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                ></span>
              ))}
            </div>
          </div>
        )}
      </section>



      {/* Popular Tags Section - Above News Feed */}
      {popularTags.length > 0 && (
        <section className="popular-tags-main">
          <h2>Popular Tags</h2>
          <div className="tags-cloud-main">
            {popularTags.slice(0, 10).map((tag, index) => (
              <button 
                key={index} 
                className="tag-main"
                onClick={() => handleTagClick(tag.name)}
                title={`${tag.count} mentions`}
              >
                {tag.name}
                <span className="tag-count-main">{tag.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="content-container">
        {/* Main Column */}
        <div className="main-column">


          {/* Main News Feed */}
          <section className="news-feed">
            <div className="section-header">
              <h2>News & Updates</h2>
              <div className="news-controls">
                <div className="news-filters">
                  <button 
                    className={`filter-btn ${newsFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setNewsFilter('all')}
                  >
                    All News ({categoryStats.all})
                  </button>
                  <button 
                    className={`filter-btn ${newsFilter === 'staff' ? 'active' : ''}`}
                    onClick={() => setNewsFilter('staff')}
                  >
                    Staffinn News ({categoryStats.staff})
                  </button>
                  <button 
                    className={`filter-btn ${newsFilter === 'institute' ? 'active' : ''}`}
                    onClick={() => setNewsFilter('institute')}
                  >
                    Institute News ({categoryStats.institute})
                  </button>
                  <button 
                    className={`filter-btn ${newsFilter === 'recruiter' ? 'active' : ''}`}
                    onClick={() => setNewsFilter('recruiter')}
                  >
                    Recruiter News ({categoryStats.recruiter || 0})
                  </button>

                </div>
                <button 
                  className="refresh-btn"
                  onClick={loadAllNews}
                  disabled={newsLoading}
                  style={{
                    marginLeft: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: newsLoading ? 'not-allowed' : 'pointer',
                    opacity: newsLoading ? 0.6 : 1
                  }}
                >
                  {newsLoading ? 'Refreshing...' : 'Refresh News'}
                </button>
              </div>
            </div>
            
            <div className="articles-list">
              {newsLoading ? (
                <div className="loading-articles">
                  <p>Loading news...</p>
                  <div style={{marginTop: '10px', fontSize: '0.9rem', color: '#6b7280'}}>
                    Fetching latest updates from all sources...
                  </div>
                </div>
              ) : (() => {
                console.log('Filtered articles:', filteredArticles);
                console.log('Filtered articles length:', filteredArticles.length);
                return filteredArticles.length > 0;
              })() ? (
                filteredArticles.map(article => (
                  <div key={article.id || article.eventNewsId || article.newsId} className="article-card">
                    <div className="article-image">
                      <img 
                        src={article.bannerImage || article.image || article.originalData?.bannerImage || "/api/placeholder/300/200"} 
                        alt={article.title}
                        onError={(e) => {
                          e.target.src = "/api/placeholder/300/200";
                        }}
                      />
                      <div className="article-category">{article.category || article.type || 'News'}</div>
                    </div>
                    <div className="article-content">
                      <h3>{article.title}</h3>
                      <p>{(article.description || article.details) && (article.description || article.details).length > 150 ? 
                        `${(article.description || article.details).substring(0, 150)}...` : 
                        (article.description || article.details)
                      }</p>
                      <div className="article-meta">
                        <span className="meta-date">
                          <FaClock /> {article.date || new Date(article.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                        <span className="meta-source">{article.source || article.company || 'Staffinn'}</span>
                        {(article.verified || article.status === 'verified') && (
                          <span className="meta-verified" style={{color: '#10b981', fontWeight: 'bold'}}>
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div className="article-actions">
                        <button className="action-btn">
                          <FaThumbsUp /> <span>{article.likes || 0}</span>
                        </button>
                        <button className="action-btn">
                          <FaComment /> <span>{article.comments || 0}</span>
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => toggleSave(article.id || article.eventNewsId || article.newsId)}
                        >
                          {saveStates[article.id || article.eventNewsId || article.newsId] || article.saved ? 
                            <FaBookmark className="saved" /> : 
                            <FaRegBookmark />
                          }
                        </button>
                        <button className="action-btn">
                          <FaShareAlt />
                        </button>
                        <button 
                          className="read-more-btn"
                          onClick={() => {
                            setModalContent({
                              title: article.title,
                              description: article.description || article.details,
                              image: article.bannerImage || article.image || article.originalData?.bannerImage,
                              date: article.date || new Date(article.createdAt || Date.now()).toLocaleDateString(),
                              source: article.source || article.company || 'Staffinn',
                              category: article.category || article.type || 'News'
                            });
                            setShowModal(true);
                          }}
                        >
                          Read More
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-articles">
                  No articles found in this category.
                  <div style={{fontSize: '12px', marginTop: '10px', color: '#666'}}>
                    Debug: Total articles: {newsArticles.length}, Filtered: {filteredArticles.length}, Filter: {newsFilter}
                  </div>
                </div>
              )}
            </div>

            <div className="load-more">
              <button className="load-more-btn">Load More <FaChevronDown /></button>
            </div>
          </section>

          {/* Featured Interviews & Expert Insights */}
          {expertInsights.length > 0 && (
            <section className="expert-insights">
              <div className="section-header">
                <h2>Expert Insights & Interviews</h2>
                <a href="#" className="view-all">View All</a>
              </div>
              
              <div className="insights-grid">
                {expertInsights.map(insight => (
                  <div key={insight.id} className="insight-card">
                    <div className="expert-image">
                      {playingVideo === insight.id && insight.videoUrl && insight.videoUrl !== "#" ? (
                        <video 
                          controls 
                          autoPlay 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onEnded={() => setPlayingVideo(null)}
                        >
                          <source src={insight.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <>
                          <img src={insight.image} alt={insight.expertName} />
                          {insight.videoUrl && insight.videoUrl !== "#" && (
                            <div 
                              className="play-button" 
                              onClick={() => setPlayingVideo(insight.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <FaPlay />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="expert-info">
                      <h3>{insight.topic}</h3>
                      <div className="expert-name">{insight.expertName}</div>
                      <div className="expert-title">{insight.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}




        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Job Alerts Section */}
          <section className="job-alerts">
            <div className="section-header">
              <h2>Job Alerts</h2>
              <button className="notification-btn" onClick={() => setShowNotification(!showNotification)}>
                <FaBell /> 
                {showNotification ? 'Notifications On' : 'Get Alerts'}
              </button>
            </div>
            
            <div className="alerts-list">
              {jobAlertsLoading ? (
                <div className="loading-job-alerts">
                  <p>Loading today's job alerts...</p>
                </div>
              ) : jobAlerts.length > 0 ? (
                jobAlerts.map(job => (
                  <div key={job.id} className="job-alert-card">
                    <h3>{job.role}</h3>
                    <div className="job-company">{job.company}</div>
                    <div className="job-meta">
                      <span className="job-location">📍 {job.location}</span>
                      <span className="job-time">🕒 {job.posted}</span>
                    </div>
                    {job.salary && (
                      <div className="job-salary">💰 {job.salary}</div>
                    )}
                    {job.experience && (
                      <div className="job-experience">⏱ {job.experience}</div>
                    )}
                    <button 
                      className="view-job-btn"
                      onClick={() => handleViewJob(job)}
                    >
                      View Job <FaExternalLinkAlt />
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-job-alerts">
                  <p>No new jobs posted today.</p>
                  <p style={{fontSize: '0.9rem', color: '#666', marginTop: '5px'}}>
                    Check back later for fresh opportunities!
                  </p>
                </div>
              )}
            </div>
            {jobAlerts.length > 0 && (
              <button 
                className="more-jobs-btn"
                onClick={() => window.open('/recruiter', '_blank')}
              >
                View All Jobs
              </button>
            )}
          </section>





          {/* Popular Tags */}
          <section className="popular-tags">
            <h2>Popular Tags</h2>
            <div className="tags-cloud">
              {popularTags.length > 0 ? (
                popularTags.map((tag, index) => (
                  <button 
                    key={index} 
                    className="tag"
                    onClick={() => handleTagClick(tag.name)}
                    title={`${tag.count} mentions`}
                  >
                    {tag.name}
                    <span className="tag-count">{tag.count}</span>
                  </button>
                ))
              ) : (
                <div className="no-tags">
                  <p>Loading popular tags...</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Modal for full article */}
      {showModal && modalContent && (
        <div className="news-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal-header">
              <h2>{modalContent.title}</h2>
              <button 
                className="news-modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="news-modal-body">
              {modalContent.image && (
                <img 
                  src={modalContent.image} 
                  alt={modalContent.title}
                  className="news-modal-image"
                />
              )}
              <div className="news-modal-meta">
                <span className="meta-date">
                  <FaClock /> {modalContent.date}
                </span>
                <span className="meta-source">{modalContent.source}</span>
                <span className="meta-category">{modalContent.category}</span>
              </div>
              <div className="news-modal-content-text">
                <p>{modalContent.description || modalContent.content}</p>
              </div>
              {modalContent.tags && (
                <div className="news-modal-tags">
                  {modalContent.tags.split(',').map((tag, index) => (
                    <span key={index} className="news-modal-tag">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;