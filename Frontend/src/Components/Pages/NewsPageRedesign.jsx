import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import NewsHeader from '../../components/news/NewsHeader';
import NewsHero from '../../components/news/NewsHero';
import ReaderModal from '../../components/news/ReaderModal';
import TrendingSection from '../../components/news/TrendingSection';
import ExpertInsights from '../../components/news/ExpertInsights';
import PostedNews from '../../components/news/PostedNews';
import RecruiterNews from '../../components/news/RecruiterNews';
import InstituteNews from '../../components/news/InstituteNews';
import NewsletterFooter from '../../components/news/NewsletterFooter';
import NewsDisplayAPI from '../../services/newsDisplayApi';
import io from 'socket.io-client';

const NewsPageRedesign = ({ isLoggedIn, onShowLogin }) => {
  // State for all news types
  const [featuredHero, setFeaturedHero] = useState(null);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [expertInsights, setExpertInsights] = useState([]);
  const [postedNews, setPostedNews] = useState([]);
  const [recruiterNews, setRecruiterNews] = useState([]);
  const [instituteNews, setInstituteNews] = useState([]);
  
  // Modal state
  const [readerModalOpen, setReaderModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Load all news data on mount
  useEffect(() => {
    loadAllNews();
    initializeSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Initialize Socket.IO for real-time updates
  const initializeSocket = () => {
    const socketConnection = io('http://localhost:5000', {
      auth: { token: null }
    });
    
    setSocket(socketConnection);

    // Hero Section Updates
    socketConnection.on('heroSectionCreated', (data) => {
      if (data.isActive) setFeaturedHero(data);
    });

    socketConnection.on('heroSectionUpdated', (data) => {
      if (data.isActive) setFeaturedHero(data);
    });

    socketConnection.on('heroSectionVisibilityToggled', (data) => {
      if (data.isActive) {
        setFeaturedHero(data);
      } else {
        setFeaturedHero(null);
        loadAllNews();
      }
    });

    // Trending Topics Updates
    socketConnection.on('trendingTopicCreated', (data) => {
      if (data.isVisible) {
        setTrendingTopics(prev => [data, ...prev.slice(0, 14)]);
      }
    });

    socketConnection.on('trendingTopicUpdated', (data) => {
      setTrendingTopics(prev =>
        prev.map(topic => topic.newstrendingtopics === data.newstrendingtopics ? data : topic)
      );
    });

    socketConnection.on('trendingTopicVisibilityToggled', (data) => {
      if (data.isVisible) {
        setTrendingTopics(prev => {
          const exists = prev.find(t => t.newstrendingtopics === data.newstrendingtopics);
          return exists ? prev.map(t => t.newstrendingtopics === data.newstrendingtopics ? data : t) : [data, ...prev];
        });
      } else {
        setTrendingTopics(prev => prev.filter(t => t.newstrendingtopics !== data.newstrendingtopics));
      }
    });

    // Expert Insights Updates
    socketConnection.on('expertInsightCreated', (data) => {
      if (data.isVisible) setExpertInsights(prev => [data, ...prev]);
    });

    socketConnection.on('expertInsightUpdated', (data) => {
      setExpertInsights(prev =>
        prev.map(insight => insight.newsexpertinsights === data.newsexpertinsights ? data : insight)
      );
    });

    // Posted News Updates
    socketConnection.on('postedNewsCreated', (data) => {
      if (data.isVisible) setPostedNews(prev => [data, ...prev]);
    });

    socketConnection.on('postedNewsUpdated', (data) => {
      setPostedNews(prev =>
        prev.map(news => news.staffinnpostednews === data.staffinnpostednews ? data : news)
      );
    });
  };

  // Load all news data
  const loadAllNews = async () => {
    try {
      setLoading(true);

      // Load Hero Section
      const heroResponse = await NewsDisplayAPI.getLatestHeroSection();
      if (heroResponse.success && heroResponse.data) {
        setFeaturedHero({
          ...heroResponse.data,
          bannerImage: heroResponse.data.bannerImageUrl,
          excerpt: heroResponse.data.content?.substring(0, 200),
          publishDate: new Date(heroResponse.data.createdAt).toLocaleDateString(),
          readTime: calculateReadTime(heroResponse.data.content)
        });
      }

      // Load Trending Topics
      const topicsResponse = await NewsDisplayAPI.getVisibleTrendingTopics();
      if (topicsResponse.success && topicsResponse.data) {
        setTrendingTopics(topicsResponse.data.map(topic => ({
          ...topic,
          id: topic.newstrendingtopics,
          image: topic.imageUrl
        })));
      }

      // Load Expert Insights
      const insightsResponse = await NewsDisplayAPI.getVisibleExpertInsights();
      if (insightsResponse.success && insightsResponse.data) {
        setExpertInsights(insightsResponse.data.map(insight => ({
          ...insight,
          id: insight.newsexpertinsights,
          avatar: insight.thumbnailUrl,
          videoUrl: insight.videoUrl,
          youtubeUrl: insight.videoUrl
        })));
      }

      // Load Posted News
      const postedResponse = await NewsDisplayAPI.getVisiblePostedNews();
      if (postedResponse.success && postedResponse.data) {
        setPostedNews(postedResponse.data.map(news => ({
          ...news,
          id: news.staffinnpostednews,
          bannerImage: news.bannerImageUrl,
          excerpt: news.description?.substring(0, 200),
          content: news.description,
          date: new Date(news.createdAt).toLocaleDateString(),
          readTime: calculateReadTime(news.description),
          category: 'Editorial',
          author: 'Staffinn Editorial'
        })));
      }

      // Load Recruiter News from main API
      const recruiterResponse = await fetch('http://localhost:5000/api/news/recruiter');
      if (recruiterResponse.ok) {
        const recruiterData = await recruiterResponse.json();
        if (recruiterData.success) {
          setRecruiterNews(recruiterData.data.filter(item => !item.isDeleted && item.isVisible !== false).map(item => ({
            ...item,
            id: item.recruiterNewsID,
            bannerImage: item.bannerImage?.startsWith('http') 
              ? item.bannerImage 
              : `https://s3.ap-south-1.amazonaws.com/staffinn-files/${item.bannerImage}`,
            companyLogo: `https://logo.clearbit.com/${item.company?.toLowerCase().replace(/\s/g, '')}.com`,
            description: item.details,
            date: new Date(item.date).toLocaleDateString()
          })));
        }
      }

      // Load Institute News from main API
      const instituteResponse = await fetch('http://localhost:5000/api/news/institute');
      if (instituteResponse.ok) {
        const instituteData = await instituteResponse.json();
        if (instituteData.success) {
          setInstituteNews(instituteData.data.filter(item => !item.isDeleted && item.isVisible !== false).map(item => ({
            ...item,
            id: item.eventNewsId,
            bannerImage: item.bannerImage?.startsWith('http')
              ? item.bannerImage
              : `https://staffinn-files.s3.ap-south-1.amazonaws.com/${item.bannerImage}`,
            instituteName: item.company,
            instituteLogo: `https://logo.clearbit.com/${item.company?.toLowerCase().replace(/\s/g, '')}.edu`,
            description: item.details,
            date: new Date(item.date).toLocaleDateString()
          })));
        }
      }

    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate read time
  const calculateReadTime = (content) => {
    if (!content) return '3 min read';
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  // Handle article open
  const handleOpenArticle = (article) => {
    if (!isLoggedIn) {
      onShowLogin?.();
      return;
    }
    setSelectedArticle(article);
    setReaderModalOpen(true);
  };

  // Handle topic click
  const handleTopicClick = (topic) => {
    if (!isLoggedIn) {
      onShowLogin?.();
      return;
    }
    setSelectedArticle({
      ...topic,
      fullContent: topic.description,
      author: 'Staffinn Editorial',
      publishDate: new Date().toLocaleDateString(),
      readTime: calculateReadTime(topic.description)
    });
    setReaderModalOpen(true);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--background)'
        }}
      >
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--border)',
              borderTop: '4px solid var(--editorial-red)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite'
            }}
          />
          Loading latest news...
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <NewsHeader />

      {/* Hero Section */}
      {featuredHero && (
        <NewsHero
          hero={featuredHero}
          onReadMore={handleOpenArticle}
        />
      )}

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <TrendingSection
          topics={trendingTopics}
          onTopicClick={handleTopicClick}
        />
      )}

      {/* Expert Insights */}
      {expertInsights.length > 0 && (
        <ExpertInsights insights={expertInsights} />
      )}

      {/* Posted/Latest News */}
      {postedNews.length > 0 && (
        <PostedNews
          news={postedNews}
          onReadMore={handleOpenArticle}
        />
      )}

      {/* Recruiter News */}
      {recruiterNews.length > 0 && (
        <RecruiterNews news={recruiterNews} />
      )}

      {/* Institute News */}
      {instituteNews.length > 0 && (
        <InstituteNews news={instituteNews} />
      )}

      {/* Newsletter Footer */}
      <NewsletterFooter />

      {/* Reader Modal */}
      <ReaderModal
        article={selectedArticle}
        isOpen={readerModalOpen}
        onClose={() => {
          setReaderModalOpen(false);
          setSelectedArticle(null);
        }}
      />
    </div>
  );
};

export default NewsPageRedesign;
