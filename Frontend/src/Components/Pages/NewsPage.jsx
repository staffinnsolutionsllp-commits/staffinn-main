/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiService from '../../services/api';
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

  // Featured news - use selected news item or default
  const featuredNews = selectedNewsItem || {
    id: 1,
    title: "Tech Industry Set to Create 100,000 New Jobs by 2026",
    description: "A new report reveals that the technology sector is poised for massive growth with projections of 100,000 new jobs in AI, cloud computing, and cybersecurity over the next 12 months.",
    image: "https://via.placeholder.com/1200x600?text=Tech+Industry+Jobs",
    date: "September 15, 2023",
    source: "Tech Career Insights",
    category: "staff"
  };
  
  const trendingTopics = [
    { id: 1, title: "Government Launches New Job Scheme for Fresh Graduates", image: "https://via.placeholder.com/300x200?text=Job+Scheme" },
    { id: 2, title: "Top IT Companies Hiring in 2025 - Skills in Demand", image: "https://via.placeholder.com/300x200?text=IT+Hiring" },
    { id: 3, title: "Remote Work Policies: Companies Shifting to Hybrid Models", image: "https://via.placeholder.com/300x200?text=Remote+Work" },
    { id: 4, title: "AI Skills Become Essential - How to Prepare for the Future", image: "https://via.placeholder.com/300x200?text=AI+Skills" },
    { id: 5, title: "Salary Insights: Which Industries Are Paying the Most in 2025", image: "https://via.placeholder.com/300x200?text=Salary+Insights" }
  ];
  
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
  
  const expertInsights = [
    {
      id: 1,
      expertName: "Priya Sharma",
      title: "HR Director, Microsoft India",
      topic: "What We Look for in Technical Candidates",
      image: "https://via.placeholder.com/150x150?text=PS",
      videoUrl: "#"
    },
    {
      id: 2,
      expertName: "Rahul Mehta",
      title: "Career Coach & Former Google Recruiter",
      topic: "Negotiating Your Salary: Do's and Don'ts",
      image: "https://via.placeholder.com/150x150?text=RM",
      videoUrl: "#"
    },
    {
      id: 3,
      expertName: "Anjali Desai",
      title: "CEO, TalentBridge Consultancy",
      topic: "Future of Work: Preparing for 2030",
      image: "https://via.placeholder.com/150x150?text=AD",
      videoUrl: "#"
    }
  ];
  
  const mediaContent = [
    {
      id: 1,
      title: "The Future of Work After Pandemic",
      type: "video",
      thumbnail: "https://via.placeholder.com/300x200?text=Future+of+Work",
      duration: "18:24",
      views: "24K"
    },
    {
      id: 2,
      title: "Career Talk Ep.45: Switching to Data Science",
      type: "podcast",
      thumbnail: "https://via.placeholder.com/300x200?text=Career+Talk",
      duration: "32:10",
      views: "15K"
    },
    {
      id: 3,
      title: "5 Common Interview Questions and How to Answer Them",
      type: "video",
      thumbnail: "https://via.placeholder.com/300x200?text=Interview+Tips",
      duration: "12:47",
      views: "38K"
    },
    {
      id: 4,
      title: "Weekly Job Market Update",
      type: "podcast",
      thumbnail: "https://via.placeholder.com/300x200?text=Job+Market+Update",
      duration: "24:15",
      views: "9K"
    }
  ];
  
  const recommendedNews = [
    {
      id: 7,
      title: "Software Engineering Salaries Across Different Cities in India",
      description: "A comprehensive comparison of how much software engineers are earning across major tech hubs.",
      image: "https://via.placeholder.com/300x200?text=SE+Salaries",
      category: "Recruitment & Hiring Trends",
      date: "September 8, 2023",
      source: "Salary Survey",
      relevance: "Based on your interest in tech careers"
    },
    {
      id: 8,
      title: "Upskilling Programs Launched by Major Tech Companies",
      description: "Google, Amazon, and Microsoft announce free training programs to address skill gaps.",
      image: "https://via.placeholder.com/300x200?text=Upskilling+Programs",
      category: "Company Announcements",
      date: "September 7, 2023",
      source: "Tech Education News",
      relevance: "Based on your search for programming courses"
    }
  ];
  
  const jobAlerts = [
    {
      id: 1,
      company: "Google",
      role: "Software Engineer",
      location: "Bangalore",
      posted: "2 hours ago"
    },
    {
      id: 2,
      company: "Amazon",
      role: "Data Scientist",
      location: "Hyderabad",
      posted: "5 hours ago"
    },
    {
      id: 3,
      company: "Flipkart",
      role: "Product Manager",
      location: "Remote",
      posted: "1 day ago"
    }
  ];

  // State management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsFilter, setNewsFilter] = useState("all");
  const [saveStates, setSaveStates] = useState({});
  const [currentPoll, setCurrentPoll] = useState({
    question: "Do you prefer remote jobs?",
    options: ["Yes", "No", "Hybrid model is best"],
    votes: [42, 18, 76],
    totalVotes: 136,
    userVoted: false
  });
  const [showNotification, setShowNotification] = useState(false);

  // Toggle save state for articles
  const toggleSave = (articleId) => {
    setSaveStates(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  // Handle vote in poll
  const handleVote = (optionIndex) => {
    if (!currentPoll.userVoted) {
      const newPoll = { ...currentPoll };
      newPoll.votes[optionIndex] += 1;
      newPoll.totalVotes += 1;
      newPoll.userVoted = true;
      setCurrentPoll(newPoll);
    }
  };





  // Get category statistics
  const getCategoryStats = () => {
    const stats = {
      all: newsArticles.length,
      staff: newsArticles.filter(article => 
        article.category === 'staff' || 
        (article.source && article.source.toLowerCase().includes('staff'))
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
      return article.category === 'staff' || 
             (article.source && article.source.toLowerCase().includes('staff'));
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

  // Load news data on component mount
  useEffect(() => {
    loadAllNews();
    setNewsFilter('all');
    
    // Set up periodic refresh to catch new news
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing news...');
      loadAllNews();
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
    };
  }, []);
  
  // Load all news from API
  const loadAllNews = async () => {
    try {
      setNewsLoading(true);
      console.log('Loading all news for NewsPage...');
      
      // Try to get all news from the combined endpoint first
      let response = await apiService.getAllNews();
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
          const instituteResponse = await apiService.getNewsByCategory('institute');
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
          const staffResponse = await apiService.getNewsByCategory('staff');
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
          const recruiterResponse = await apiService.getNewsByCategory('recruiter');
          console.log('Recruiter news response:', recruiterResponse);
          if (recruiterResponse.success && recruiterResponse.data) {
            const recruiterNews = Array.isArray(recruiterResponse.data) ? recruiterResponse.data : [];
            recruiterNews.forEach(news => {
              news.category = 'recruiter';
              news.source = news.company || news.source || 'Recruiter';
            });
            allNews = [...allNews, ...recruiterNews];
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
        staff: allNews.filter(n => n.category === 'staff' || (n.source && n.source.toLowerCase().includes('staff'))).length,
        recruiter: allNews.filter(n => n.category === 'recruiter' || (n.source && n.source.toLowerCase().includes('recruiter'))).length
      };
      console.log('News by category:', newsByCategory);
      console.log('Final news articles:', allNews);
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
                  src={selectedNewsItem.bannerImage || selectedNewsItem.originalData?.bannerImage || "https://via.placeholder.com/1200x600?text=News+Banner"} 
                  alt={selectedNewsItem.title}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/1200x600?text=News+Banner";
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
          ) : (
            <>
              <div className="featured-news-image">
                <img src={featuredNews.image} alt={featuredNews.title} />
              </div>
              <div className="featured-news-content">
                <div className="featured-tag">Top News of the Day</div>
                <h1>{featuredNews.title}</h1>
                <p>{featuredNews.description}</p>
                <div className="featured-news-meta">
                  <span className="meta-date"><FaClock /> {featuredNews.date}</span>
                  <span className="meta-source">{featuredNews.source}</span>
                  <span className="meta-category">{featuredNews.category}</span>
                </div>
                <button className="read-more-btn">Read Full Article</button>
              </div>
            </>
          )}
        </div>
        
        {/* Trending Topics Carousel */}
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
                    <div className="topic-card">
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
      </section>



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
              ) : filteredArticles.length > 0 ? (
                filteredArticles.map(article => (
                  <div key={article.id || article.eventNewsId || article.newsId} className="article-card">
                    <div className="article-image">
                      <img 
                        src={article.bannerImage || article.image || article.originalData?.bannerImage || "https://via.placeholder.com/300x200?text=News+Image"} 
                        alt={article.title}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200?text=News+Image";
                        }}
                      />
                      <div className="article-category">{article.category || article.type || 'News'}</div>
                    </div>
                    <div className="article-content">
                      <h3>{article.title}</h3>
                      <p>{article.description || article.details}</p>
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
                        <button className="read-more-btn">Read More</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-articles">No articles found in this category.</div>
              )}
            </div>

            <div className="load-more">
              <button className="load-more-btn">Load More <FaChevronDown /></button>
            </div>
          </section>

          {/* Featured Interviews & Expert Insights */}
          <section className="expert-insights">
            <div className="section-header">
              <h2>Expert Insights & Interviews</h2>
              <a href="#" className="view-all">View All</a>
            </div>
            
            <div className="insights-grid">
              {expertInsights.map(insight => (
                <div key={insight.id} className="insight-card">
                  <div className="expert-image">
                    <img src={insight.image} alt={insight.expertName} />
                    <div className="play-button"><FaPlay /></div>
                  </div>
                  <div className="expert-info">
                    <h3>{insight.topic}</h3>
                    <div className="expert-name">{insight.expertName}</div>
                    <div className="expert-title">{insight.title}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ask-expert">
              <h3>Ask an Expert</h3>
              <p>Have a career or job-related question? Our industry experts will answer selected questions every week.</p>
              <div className="ask-form">
                <textarea 
                  placeholder="Type your question here..."
                  rows="3"
                ></textarea>
                <button>Submit Question</button>
              </div>
            </div>
          </section>

          {/* Video & Podcast Section */}
          <section className="media-section">
            <div className="section-header">
              <h2>Videos & Podcasts</h2>
              <div className="media-tabs">
                <button className="media-tab active">All</button>
                <button className="media-tab">Videos</button>
                <button className="media-tab">Podcasts</button>
              </div>
            </div>
            
            <div className="media-grid">
              {mediaContent.map(item => (
                <div key={item.id} className="media-card">
                  <div className="media-thumbnail">
                    <img src={item.thumbnail} alt={item.title} />
                    <div className="media-type">
                      {item.type === 'video' ? <FaVideo /> : <FaPodcast />}
                    </div>
                    <div className="media-duration">{item.duration}</div>
                    <div className="media-play"><FaPlay /></div>
                  </div>
                  <div className="media-info">
                    <h3>{item.title}</h3>
                    <div className="media-views">{item.views} views</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* User Engagement - Poll Section */}
          <section className="poll-section">
            <h3>Quick Poll</h3>
            <div className="poll-container">
              <h4>{currentPoll.question}</h4>
              <div className="poll-options">
                {currentPoll.options.map((option, index) => (
                  <div key={index} className="poll-option">
                    <button 
                      className={`vote-btn ${currentPoll.userVoted ? 'voted' : ''}`}
                      onClick={() => handleVote(index)}
                      disabled={currentPoll.userVoted}
                    >
                      {option}
                    </button>
                    {currentPoll.userVoted && (
                      <div className="vote-result">
                        <div 
                          className="vote-bar" 
                          style={{ width: `${(currentPoll.votes[index] / currentPoll.totalVotes) * 100}%` }}
                        ></div>
                        <span className="vote-percent">
                          {Math.round((currentPoll.votes[index] / currentPoll.totalVotes) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="poll-footer">
                {currentPoll.userVoted ? (
                  <span className="vote-count">{currentPoll.totalVotes} total votes</span>
                ) : (
                  <span className="poll-note">Click an option to vote</span>
                )}
              </div>
            </div>
          </section>
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
              {jobAlerts.map(job => (
                <div key={job.id} className="job-alert-card">
                  <h3>{job.role}</h3>
                  <div className="job-company">{job.company}</div>
                  <div className="job-meta">
                    <span className="job-location">{job.location}</span>
                    <span className="job-time">{job.posted}</span>
                  </div>
                  <button className="view-job-btn">View Job <FaExternalLinkAlt /></button>
                </div>
              ))}
            </div>
            <button className="more-jobs-btn">View All Job Alerts</button>
          </section>

          {/* Recommended For You Section */}
          <section className="recommended-news">
            <h2>Recommended For You</h2>
            
            <div className="recommended-list">
              {recommendedNews.map(article => (
                <div key={article.id} className="recommended-card">
                  <div className="recommended-image">
                    <img src={article.image} alt={article.title} />
                  </div>
                  <div className="recommended-content">
                    <div className="recommended-relevance">{article.relevance}</div>
                    <h3>{article.title}</h3>
                    <div className="recommended-meta">
                      <span className="meta-date">{article.date}</span>
                      <span className="meta-source">{article.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Newsletter Signup */}
          <section className="newsletter">
            <h2>Get Weekly Job News</h2>
            <p>Stay updated with the latest career opportunities and industry trends.</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Your email address" />
              <button>Subscribe</button>
            </div>
          </section>

          {/* Popular Tags */}
          <section className="popular-tags">
            <h2>Popular Tags</h2>
            <div className="tags-cloud">
              <a href="#" className="tag">Remote Jobs</a>
              <a href="#" className="tag">Startups</a>
              <a href="#" className="tag">AI</a>
              <a href="#" className="tag">Data Science</a>
              <a href="#" className="tag">Software Engineering</a>
              <a href="#" className="tag">Career Advice</a>
              <a href="#" className="tag">Resume Tips</a>
              <a href="#" className="tag">Salary Negotiation</a>
              <a href="#" className="tag">Work-Life Balance</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;