/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiWithLoading from '../../services/apiWithLoading';
import apiService from '../../services/api';
import NewsDisplayAPI from '../../services/newsDisplayApi';
import io from 'socket.io-client';
import { Toaster } from 'sonner';

// Import new components
import NewsHero from '../news/NewsHero';
import TrendingSection from '../news/TrendingSection';
import ExpertInsights from '../news/ExpertInsights';
import PostedNews from '../news/PostedNews';
import RecruiterNews from '../news/RecruiterNews';
import InstituteNews from '../news/InstituteNews';
import ReaderModal from '../news/ReaderModal';
import NewsletterFooter from '../news/NewsletterFooter';
import Footer from '../Footer/Footer';

const NewsPage = ({ isLoggedIn, onShowLogin }) => {
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
      
      const response = await apiService.getTodaysJobs(5); // silent — no loading overlay
      
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Toaster position="top-right" richColors />

      {/* Hero Section */}
      {featuredHeroSection && (
        <NewsHero
          hero={{
            id: featuredHeroSection.newsherosection,
            category: featuredHeroSection.category || 'Featured Today',
            title: featuredHeroSection.title,
            description: featuredHeroSection.content,
            excerpt: featuredHeroSection.excerpt || featuredHeroSection.content,
            author: featuredHeroSection.author || 'Staffinn Editorial',
            authorAvatar: featuredHeroSection.authorAvatar,
            date: new Date(featuredHeroSection.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
            readTime: featuredHeroSection.readTime || '5 min read',
            image: featuredHeroSection.bannerImageUrl,
            bannerImage: featuredHeroSection.bannerImageUrl,
            tags: featuredHeroSection.tags
          }}
          onReadMore={(item) => {
            setModalContent(item);
            setShowModal(true);
          }}
        />
      )}

      {/* Trending Topics */}
      {realTimeTrendingTopics.length > 0 && (
        <TrendingSection
          topics={realTimeTrendingTopics.map(topic => ({
            id: topic.newstrendingtopics,
            title: topic.title,
            description: topic.description,
            image: topic.imageUrl,
            tags: topic.tags || '#Trending'
          }))}
          onTopicClick={(topic) => {
            setModalContent({
              title: topic.title,
              description: topic.description,
              content: topic.description,
              image: topic.image,
              bannerImage: topic.image,
              tags: topic.tags
            });
            setShowModal(true);
          }}
        />
      )}

      {/* Expert Insights */}
      {realTimeExpertInsights.length > 0 && (
        <ExpertInsights
          insights={realTimeExpertInsights.map(insight => ({
            id: insight.newsexpertinsights,
            expertName: insight.expertName,
            designation: insight.designation,
            company: insight.company,
            avatar: insight.avatarUrl,
            title: insight.title,
            videoUrl: insight.youtubeUrl || insight.videoUrl,
            youtubeUrl: insight.youtubeUrl,
            thumbnail: insight.thumbnailUrl,
            duration: insight.duration,
            views: insight.views
          }))}
        />
      )}

      {/* Posted News */}
      {postedNews.length > 0 && (
        <PostedNews
          news={postedNews.map(news => ({
            id: news.staffinnpostednews,
            title: news.title,
            excerpt: news.excerpt || news.description,
            content: news.content || news.description,
            category: news.category || 'Editorial',
            author: news.author,
            date: new Date(news.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
            readTime: news.readTime || '3 min read',
            image: news.bannerImageUrl,
            bannerImage: news.bannerImageUrl
          }))}
          onReadMore={(item) => {
            if (!isLoggedIn) {
              onShowLogin();
              return;
            }
            setModalContent(item);
            setShowModal(true);
          }}
        />
      )}

      {/* Recruiter News */}
      {newsArticles.filter(n => n.category === 'recruiter').length > 0 && (
        <RecruiterNews
          news={newsArticles
            .filter(n => n.category === 'recruiter')
            .map(news => ({
              id: news.id || news.recruiternews,
              companyName: news.company || news.source,
              companyLogo: news.companyLogo,
              title: news.title,
              description: news.description || news.details,
              eventType: news.eventType || 'Company Update',
              location: news.location,
              date: news.date || new Date(news.createdAt).toLocaleDateString(),
              bannerImage: news.bannerImage || news.image,
              expectedHires: news.expectedHires
            }))}
        />
      )}

      {/* Institute News */}
      {newsArticles.filter(n => n.category === 'institute').length > 0 && (
        <InstituteNews
          news={newsArticles
            .filter(n => n.category === 'institute')
            .map(news => ({
              id: news.id || news.eventNewsId,
              instituteName: news.company || news.source || 'Institute',
              instituteLogo: news.instituteLogo,
              title: news.title,
              description: news.description || news.details,
              type: news.type || 'Event',
              date: news.date || new Date(news.createdAt).toLocaleDateString(),
              venue: news.venue,
              bannerImage: news.bannerImage || news.image
            }))}
          onReadMore={(item) => {
            setModalContent({
              title: item.title,
              description: item.description,
              content: item.description,
              bannerImage: item.bannerImage,
              author: item.instituteName,
              date: item.date,
              category: item.type
            });
            setShowModal(true);
          }}
        />
      )}

      {/* Footer */}
      <Footer />

      {/* Reader Modal */}
      {showModal && modalContent && (
        <ReaderModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          article={modalContent}
          newsItem={modalContent}
        />
      )}
    </div>
  );
};

export default NewsPage;