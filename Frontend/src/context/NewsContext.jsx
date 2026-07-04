import React, { createContext, useContext, useState, useEffect } from 'react';

// Type definitions
export const Status = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published'
};

// NewsContext
const NewsContext = createContext(null);

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within NewsProvider');
  }
  return context;
};

// Initial seed data
const SEED_HERO_NEWS = {
  id: 'hero-1',
  category: 'Breaking News',
  title: 'TCS Announces Massive Hiring Drive for 2026',
  excerpt: 'Tata Consultancy Services plans to hire 40,000 freshers across India in 2026, focusing on AI, Cloud, and Data Science roles.',
  bannerImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=900&fit=crop',
  fullContent: `Tata Consultancy Services (TCS), India's largest IT services company, has announced an ambitious hiring plan for 2026. The company aims to onboard 40,000 fresh graduates across various technology domains.

## Focus Areas

The recruitment drive will primarily focus on:

- Artificial Intelligence and Machine Learning
- Cloud Computing (AWS, Azure, GCP)
- Data Science and Analytics  
- Cybersecurity
- Full Stack Development

## Eligibility

Candidates from BE/B.Tech, MCA, and M.Tech programs with strong programming skills and problem-solving abilities are encouraged to apply.

## Selection Process

The selection process includes:
1. Online aptitude test
2. Technical interview
3. HR interview
4. Final offer`,
  author: 'Rajesh Kumar',
  authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  publishDate: 'June 16, 2026',
  readTime: '5 min read',
  tags: ['TCS', 'Hiring', 'Freshers', 'IT Jobs'],
  status: Status.PUBLISHED
};

export const NewsProvider = ({ children }) => {
  // State for all news types
  const [heroNews, setHeroNews] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [expertInsights, setExpertInsights] = useState([]);
  const [postedNews, setPostedNews] = useState([]);
  const [recruiterNews, setRecruiterNews] = useState([]);
  const [instituteNews, setInstituteNews] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const stored = {
          heroNews: JSON.parse(localStorage.getItem('staffinn_hero_news') || '[]'),
          trendingTopics: JSON.parse(localStorage.getItem('staffinn_trending_topics') || '[]'),
          expertInsights: JSON.parse(localStorage.getItem('staffinn_expert_insights') || '[]'),
          postedNews: JSON.parse(localStorage.getItem('staffinn_posted_news') || '[]'),
          recruiterNews: JSON.parse(localStorage.getItem('staffinn_recruiter_news') || '[]'),
          instituteNews: JSON.parse(localStorage.getItem('staffinn_institute_news') || '[]'),
          activityLog: JSON.parse(localStorage.getItem('staffinn_activity_log') || '[]')
        };

        // Initialize with seed data if empty
        if (stored.heroNews.length === 0) {
          stored.heroNews = [SEED_HERO_NEWS];
        }

        setHeroNews(stored.heroNews);
        setTrendingTopics(stored.trendingTopics);
        setExpertInsights(stored.expertInsights);
        setPostedNews(stored.postedNews);
        setRecruiterNews(stored.recruiterNews);
        setInstituteNews(stored.instituteNews);
        setActivityLog(stored.activityLog);
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    };

    loadFromLocalStorage();

    // Listen for storage events (changes in other tabs)
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('staffinn_')) {
        loadFromLocalStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('staffinn_hero_news', JSON.stringify(heroNews));
  }, [heroNews]);

  useEffect(() => {
    localStorage.setItem('staffinn_trending_topics', JSON.stringify(trendingTopics));
  }, [trendingTopics]);

  useEffect(() => {
    localStorage.setItem('staffinn_expert_insights', JSON.stringify(expertInsights));
  }, [expertInsights]);

  useEffect(() => {
    localStorage.setItem('staffinn_posted_news', JSON.stringify(postedNews));
  }, [postedNews]);

  useEffect(() => {
    localStorage.setItem('staffinn_recruiter_news', JSON.stringify(recruiterNews));
  }, [recruiterNews]);

  useEffect(() => {
    localStorage.setItem('staffinn_institute_news', JSON.stringify(instituteNews));
  }, [instituteNews]);

  useEffect(() => {
    localStorage.setItem('staffinn_activity_log', JSON.stringify(activityLog));
  }, [activityLog]);

  // Helper function to add activity log
  const addActivity = (action, author = 'Admin User') => {
    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      author
    };
    setActivityLog(prev => [newActivity, ...prev.slice(0, 99)]);
  };

  // Calculate read time
  const calculateReadTime = (content) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const value = {
    heroNews,
    trendingTopics,
    expertInsights,
    postedNews,
    recruiterNews,
    instituteNews,
    activityLog,
    setHeroNews,
    setTrendingTopics,
    setExpertInsights,
    setPostedNews,
    setRecruiterNews,
    setInstituteNews,
    addActivity,
    calculateReadTime,
    Status
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};

export default NewsContext;
