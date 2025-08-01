/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
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
  FaChevronDown
} from 'react-icons/fa';

const NewsPage = () => {
  // Sample data - in a real application, this would come from an API
  const featuredNews = {
    id: 1,
    title: "Tech Industry Set to Create 100,000 New Jobs by 2026",
    description: "A new report reveals that the technology sector is poised for massive growth with projections of 100,000 new jobs in AI, cloud computing, and cybersecurity over the next 12 months.",
    image: "https://via.placeholder.com/1200x600?text=Tech+Industry+Jobs",
    date: "September 15, 2023",
    source: "Tech Career Insights",
    category: "Recruitment & Hiring Trends"
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
  
  const newsCategories = [
    { id: "govt", name: "Government Job Schemes", icon: "🏛️" },
    { id: "recruitment", name: "Recruitment & Hiring Trends", icon: "📈" },
    { id: "company", name: "Company Announcements", icon: "🏢" },
    { id: "career", name: "Career Growth Tips", icon: "🚀" },
    { id: "freelance", name: "Freelance & Gig Economy", icon: "🌐" },
    { id: "tech", name: "Technology & Market Trends", icon: "💻" }
  ];
  
  const newsArticles = [
    {
      id: 1,
      title: "TCS to Hire 40,000 Freshers in 2025",
      description: "India's largest IT services firm announces plans for massive campus recruitment drive across engineering colleges.",
      image: "https://via.placeholder.com/300x200?text=TCS+Hiring",
      category: "Company Announcements",
      date: "September 14, 2023",
      source: "Tech Career News",
      likes: 342,
      comments: 56,
      saved: false
    },
    {
      id: 2,
      title: "New NAPS Guidelines Released - Higher Stipends for Apprentices",
      description: "Government updates National Apprenticeship Promotion Scheme with increased financial support and simplified enrollment.",
      image: "https://via.placeholder.com/300x200?text=NAPS+Guidelines",
      category: "Government Job Schemes",
      date: "September 13, 2023",
      source: "Government Circular",
      likes: 287,
      comments: 42,
      saved: true
    },
    {
      id: 3,
      title: "LinkedIn Report: Most In-Demand Skills for 2025",
      description: "Annual skills report highlights AI, machine learning, and blockchain as the most sought-after technical skills by employers.",
      image: "https://via.placeholder.com/300x200?text=LinkedIn+Skills+Report",
      category: "Recruitment & Hiring Trends",
      date: "September 12, 2023",
      source: "LinkedIn Insights",
      likes: 523,
      comments: 78,
      saved: false
    },
    {
      id: 4,
      title: "10 Resume Mistakes That Instantly Disqualify Candidates",
      description: "HR experts reveal common resume errors that could cost you your dream job opportunity.",
      image: "https://via.placeholder.com/300x200?text=Resume+Mistakes",
      category: "Career Growth Tips",
      date: "September 11, 2023",
      source: "Career Advisor",
      likes: 412,
      comments: 93,
      saved: false
    },
    {
      id: 5,
      title: "Freelance Platforms Report 40% Growth in Technical Projects",
      description: "The demand for freelance developers, designers, and data analysts has surged as more companies adopt flexible hiring models.",
      image: "https://via.placeholder.com/300x200?text=Freelance+Growth",
      category: "Freelance & Gig Economy",
      date: "September 10, 2023",
      source: "Gig Economy Report",
      likes: 256,
      comments: 38,
      saved: true
    },
    {
      id: 6,
      title: "How AI is Changing the Recruitment Process",
      description: "From resume screening to candidate matching, artificial intelligence is revolutionizing how companies hire.",
      image: "https://via.placeholder.com/300x200?text=AI+Recruitment",
      category: "Technology & Market Trends",
      date: "September 9, 2023",
      source: "Tech Trends",
      likes: 378,
      comments: 65,
      saved: false
    }
  ];
  
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
  const [breakingNewsIndex, setBreakingNewsIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
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

  // Filter articles by category
  const filteredArticles = activeCategory === "all" 
    ? newsArticles 
    : newsArticles.filter(article => 
        article.category.toLowerCase().includes(activeCategory.toLowerCase()));

  // Effects for animations like breaking news ticker and trending topics carousel
  useEffect(() => {
    const breakingNewsInterval = setInterval(() => {
      setBreakingNewsIndex((prev) => (prev + 1) % breakingNews.length);
    }, 5000);

    return () => clearInterval(breakingNewsInterval);
  }, [breakingNews.length]);

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

      {/* Breaking News Ticker */}
      <div className="breaking-news-ticker">
        <div className="ticker-label">Breaking News</div>
        <div className="ticker-content">
          <div className="ticker-animation">
            {breakingNews.map((news, index) => (
              <span 
                key={index} 
                className={`ticker-item ${index === breakingNewsIndex ? 'active' : ''}`}
              >
                {news}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="content-container">
        {/* Main Column */}
        <div className="main-column">
          {/* Categories Section */}
          <section className="categories-section">
            <h2>News Categories</h2>
            <div className="categories-tabs">
              <button 
                className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All News
              </button>
              {newsCategories.map(category => (
                <button
                  key={category.id}
                  className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </section>

          {/* Main News Feed */}
          <section className="news-feed">
            <div className="section-header">
              <h2>Latest News</h2>
              {activeCategory !== 'all' && (
                <span className="filter-applied">
                  Filtered by: {newsCategories.find(c => c.id === activeCategory)?.name || activeCategory}
                </span>
              )}
            </div>
            
            <div className="articles-list">
              {filteredArticles.length > 0 ? (
                filteredArticles.map(article => (
                  <div key={article.id} className="article-card">
                    <div className="article-image">
                      <img src={article.image} alt={article.title} />
                      <div className="article-category">{article.category}</div>
                    </div>
                    <div className="article-content">
                      <h3>{article.title}</h3>
                      <p>{article.description}</p>
                      <div className="article-meta">
                        <span className="meta-date"><FaClock /> {article.date}</span>
                        <span className="meta-source">{article.source}</span>
                      </div>
                      <div className="article-actions">
                        <button className="action-btn">
                          <FaThumbsUp /> <span>{article.likes}</span>
                        </button>
                        <button className="action-btn">
                          <FaComment /> <span>{article.comments}</span>
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => toggleSave(article.id)}
                        >
                          {saveStates[article.id] || article.saved ? 
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