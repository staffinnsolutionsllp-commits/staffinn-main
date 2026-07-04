import { useState, useEffect } from 'react'
import { Plus, Eye, Edit, EyeOff, Trash, Upload, Star, Clock, X, LayoutDashboard, Image as ImageIcon, TrendingUp, Video, Newspaper, Briefcase, GraduationCap, Save, Menu, ArrowLeft, User, RefreshCw, Activity, CheckCircle, XCircle, BarChart2, FileText } from 'lucide-react'
import NewsAdminAPI from './services/newsAdminApi'
import io from 'socket.io-client'

function AdminPanel({ onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [activeSubSection, setActiveSubSection] = useState('hero')
  const [heroSections, setHeroSections] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [expertInsights, setExpertInsights] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [viewingFullArticle, setViewingFullArticle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)
  const [recruiterNews, setRecruiterNews] = useState([])
  const [instituteNews, setInstituteNews] = useState([])
  const [postedNews, setPostedNews] = useState([])
  const [viewingRecruiterNews, setViewingRecruiterNews] = useState(null)
  const [viewingInstituteNews, setViewingInstituteNews] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Initialize socket connection and load data on component mount
  useEffect(() => {
    // Initialize socket connection
    const socketConnection = io('http://localhost:4001', {
      auth: {
        token: null // No authentication required for news updates
      }
    })
    
    setSocket(socketConnection)
    
    // Listen for real-time updates
    socketConnection.on('heroSectionCreated', (data) => {
      setHeroSections(prev => [data, ...prev])
    })
    
    socketConnection.on('heroSectionUpdated', (data) => {
      setHeroSections(prev => prev.map(item => 
        item.newsherosection === data.newsherosection ? data : item
      ))
    })
    
    socketConnection.on('heroSectionVisibilityToggled', (data) => {
      setHeroSections(prev => prev.map(item => 
        item.newsherosection === data.newsherosection ? data : item
      ))
    })
    
    socketConnection.on('heroSectionDeleted', (data) => {
      setHeroSections(prev => prev.filter(item => item.newsherosection !== data.heroId))
    })
    
    socketConnection.on('trendingTopicCreated', (data) => {
      setTrendingTopics(prev => [data, ...prev])
    })
    
    socketConnection.on('trendingTopicUpdated', (data) => {
      setTrendingTopics(prev => prev.map(item => 
        item.newstrendingtopics === data.newstrendingtopics ? data : item
      ))
    })
    
    socketConnection.on('trendingTopicVisibilityToggled', (data) => {
      setTrendingTopics(prev => prev.map(item => 
        item.newstrendingtopics === data.newstrendingtopics ? data : item
      ))
    })
    
    socketConnection.on('trendingTopicDeleted', (data) => {
      setTrendingTopics(prev => prev.filter(item => item.newstrendingtopics !== data.topicId))
    })
    
    socketConnection.on('expertInsightCreated', (data) => {
      setExpertInsights(prev => [data, ...prev])
    })
    
    socketConnection.on('expertInsightUpdated', (data) => {
      setExpertInsights(prev => prev.map(item => 
        item.newsexpertinsights === data.newsexpertinsights ? data : item
      ))
    })
    
    socketConnection.on('expertInsightVisibilityToggled', (data) => {
      setExpertInsights(prev => prev.map(item => 
        item.newsexpertinsights === data.newsexpertinsights ? data : item
      ))
    })
    
    socketConnection.on('expertInsightDeleted', (data) => {
      setExpertInsights(prev => prev.filter(item => item.newsexpertinsights !== data.insightId))
    })
    
    // Listen for recruiter news updates
    socketConnection.on('recruiterNewsCreated', (data) => {
      console.log('New recruiter news created:', data)
      setRecruiterNews(prev => [data, ...prev])
    })
    
    socketConnection.on('recruiterNewsUpdated', (data) => {
      console.log('Recruiter news updated:', data)
      setRecruiterNews(prev => prev.map(item => 
        item.recruiterNewsID === data.recruiterNewsID ? data : item
      ))
    })
    
    socketConnection.on('recruiterNewsVisibilityToggled', (data) => {
      console.log('Recruiter news visibility toggled:', data)
      setRecruiterNews(prev => prev.map(item => 
        item.recruiterNewsID === data.recruiterNewsID 
          ? { ...item, isVisible: data.isVisible }
          : item
      ))
    })
    
    socketConnection.on('recruiterNewsDeleted', (data) => {
      console.log('Recruiter news deleted:', data)
      setRecruiterNews(prev => prev.map(item => 
        item.recruiterNewsID === data.recruiterNewsID 
          ? { ...item, isDeleted: true }
          : item
      ))
    })
    
    // Listen for institute news updates
    socketConnection.on('instituteNewsCreated', (data) => {
      console.log('New institute news created:', data)
      setInstituteNews(prev => [data, ...prev])
    })
    
    socketConnection.on('instituteNewsUpdated', (data) => {
      console.log('Institute news updated:', data)
      setInstituteNews(prev => prev.map(item => 
        item.eventNewsId === data.eventNewsId ? data : item
      ))
    })
    
    socketConnection.on('instituteNewsVisibilityToggled', (data) => {
      console.log('Institute news visibility toggled:', data)
      setInstituteNews(prev => prev.map(item => 
        item.eventNewsId === data.eventNewsId 
          ? { ...item, isVisible: data.isVisible }
          : item
      ))
    })
    
    socketConnection.on('instituteNewsDeleted', (data) => {
      console.log('Institute news deleted:', data)
      setInstituteNews(prev => prev.map(item => 
        item.eventNewsId === data.eventNewsId 
          ? { ...item, isDeleted: true }
          : item
      ))
    })
    
    // Listen for posted news updates
    socketConnection.on('postedNewsCreated', (data) => {
      console.log('New posted news created:', data)
      setPostedNews(prev => [data, ...prev])
    })
    
    socketConnection.on('postedNewsUpdated', (data) => {
      console.log('Posted news updated:', data)
      setPostedNews(prev => prev.map(item => 
        item.staffinnpostednews === data.staffinnpostednews ? data : item
      ))
    })
    
    socketConnection.on('postedNewsVisibilityToggled', (data) => {
      console.log('Posted news visibility toggled:', data)
      setPostedNews(prev => prev.map(item => 
        item.staffinnpostednews === data.staffinnpostednews ? data : item
      ))
    })
    
    socketConnection.on('postedNewsDeleted', (data) => {
      console.log('Posted news deleted:', data)
      setPostedNews(prev => prev.filter(item => item.staffinnpostednews !== data.newsId))
    })
    
    // Load initial data
    loadAllData()
    
    // Cleanup on unmount
    return () => {
      socketConnection.disconnect()
    }
  }, [])
  
  // Load all data from API
  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load hero sections
      const heroResponse = await NewsAdminAPI.getAllHeroSections()
      if (heroResponse.success) {
        setHeroSections(heroResponse.data)
      }
      
      // Load trending topics
      const topicsResponse = await NewsAdminAPI.getAllTrendingTopics()
      if (topicsResponse.success) {
        setTrendingTopics(topicsResponse.data)
      }
      
      // Load expert insights
      const insightsResponse = await NewsAdminAPI.getAllExpertInsights()
      if (insightsResponse.success) {
        setExpertInsights(insightsResponse.data)
      }
      
      // Load recruiter news
      const recruiterResponse = await NewsAdminAPI.getAllRecruiterNews()
      console.log('Recruiter news response:', recruiterResponse)
      if (recruiterResponse.success) {
        console.log('Setting recruiter news data:', recruiterResponse.data)
        setRecruiterNews(recruiterResponse.data)
      } else {
        console.log('Failed to load recruiter news:', recruiterResponse)
      }
      
      // Load institute news
      const instituteResponse = await NewsAdminAPI.getAllInstituteNews()
      if (instituteResponse.success) {
        setInstituteNews(instituteResponse.data)
      }
      
      // Load posted news
      const postedResponse = await NewsAdminAPI.getAllPostedNews()
      if (postedResponse.success) {
        setPostedNews(postedResponse.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dummy data removed - now using real data from state

  const deleteItem = async (id, type) => {
    try {
      console.log(`Deleting ${type} item with ID:`, id)
      
      if (type === 'hero') {
        await NewsAdminAPI.deleteHeroSection(id)
      } else if (type === 'trending') {
        await NewsAdminAPI.deleteTrendingTopic(id)
      } else if (type === 'insights') {
        await NewsAdminAPI.deleteExpertInsight(id)
      } else if (type === 'posted') {
        await NewsAdminAPI.deletePostedNews(id)
      } else if (type === 'recruiter') {
        const result = await NewsAdminAPI.deleteRecruiterNews(id)
        console.log('Delete result:', result)
      } else if (type === 'institute') {
        const result = await NewsAdminAPI.deleteInstituteNews(id)
        console.log('Delete result:', result)
      }
      
      console.log(`Successfully deleted ${type} item with ID:`, id)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(`Failed to delete ${type} item. Error: ${error.message}`)
    }
  }

  const toggleVisibility = async (id, type) => {
    try {
      console.log(`Toggling visibility for ${type} item with ID:`, id)
      
      if (type === 'hero') {
        await NewsAdminAPI.toggleHeroSectionVisibility(id)
      } else if (type === 'trending') {
        await NewsAdminAPI.toggleTrendingTopicVisibility(id)
      } else if (type === 'insights') {
        await NewsAdminAPI.toggleExpertInsightVisibility(id)
      } else if (type === 'posted') {
        await NewsAdminAPI.togglePostedNewsVisibility(id)
      } else if (type === 'recruiter') {
        console.log('Making API call to toggle recruiter news visibility for ID:', id)
        const result = await NewsAdminAPI.toggleRecruiterNewsVisibility(id)
        console.log('Toggle visibility API result:', result)
        
        // Manually update the state if socket doesn't work
        if (result.success) {
          setRecruiterNews(prev => prev.map(item => 
            item.recruiterNewsID === id 
              ? { ...item, isVisible: result.data.isVisible }
              : item
          ))
        }
      } else if (type === 'institute') {
        console.log('Making API call to toggle institute news visibility for ID:', id)
        const result = await NewsAdminAPI.toggleInstituteNewsVisibility(id)
        console.log('Toggle visibility API result:', result)
        
        if (result.success) {
          setInstituteNews(prev => prev.map(item => 
            item.eventNewsId === id 
              ? { ...item, isVisible: result.data.isVisible }
              : item
          ))
        }
      }
      
      console.log(`Successfully toggled visibility for ${type} item with ID:`, id)
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert(`Failed to toggle visibility for ${type} item. Error: ${error.message}`)
    }
  }

   const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Create FormData object for file uploads
      const submitData = new FormData()
      
      // Add all text fields except file fields
      const fileKeys = ['banner', 'image', 'video', 'thumbnail']
      Object.keys(formData).forEach(key => {
        if (!fileKeys.includes(key) && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key])
        }
      })
      
      // Add file fields
      if (formData.banner && formData.banner instanceof File) {
        submitData.append('banner', formData.banner)
      }
      if (formData.image && formData.image instanceof File) {
        submitData.append('image', formData.image)
      }
      if (formData.video && formData.video instanceof File) {
        submitData.append('video', formData.video)
      }
      if (formData.thumbnail && formData.thumbnail instanceof File) {
        submitData.append('thumbnail', formData.thumbnail)
      }
      
      if (editingItem) {
        // Update existing item
        if (activeSubSection === 'hero') {
          await NewsAdminAPI.updateHeroSection(editingItem.newsherosection, submitData)
        } else if (activeSubSection === 'trending') {
          await NewsAdminAPI.updateTrendingTopic(editingItem.newstrendingtopics, submitData)
        } else if (activeSubSection === 'insights') {
          await NewsAdminAPI.updateExpertInsight(editingItem.newsexpertinsights, submitData)
        } else if (activeSubSection === 'posted') {
          await NewsAdminAPI.updatePostedNews(editingItem.staffinnpostednews, submitData)
        }
      } else {
        // Create new item
        if (activeSubSection === 'hero') {
          await NewsAdminAPI.createHeroSection(submitData)
        } else if (activeSubSection === 'trending') {
          await NewsAdminAPI.createTrendingTopic(submitData)
        } else if (activeSubSection === 'insights') {
          await NewsAdminAPI.createExpertInsight(submitData)
        } else if (activeSubSection === 'posted') {
          await NewsAdminAPI.createPostedNews(submitData)
        }
      }
      
      // Reset form
      setFormData({})
      setShowForm(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const published = (arr, key) => (arr || []).filter(i => i.isVisible !== false && !i.isDeleted).length
    const heroPublished    = published(heroSections)
    const trendPublished   = published(trendingTopics)
    const insightPublished = published(expertInsights)
    const postedPublished  = published(postedNews)
    const recruiterPublished = published(recruiterNews)
    const institutePublished = published(instituteNews)

    const totalArticles = heroSections.length + postedNews.length
    const totalPublished = heroPublished + postedPublished
    const totalHidden = (heroSections.length - heroPublished) + (postedNews.length - postedPublished)

    // Combine all items for recent activity feed
    const allItems = [
      ...(heroSections || []).map(i => ({ ...i, _type: 'Hero', _id: i.newsherosection, _title: i.title, _date: i.createdAt, _visible: i.isActive !== false })),
      ...(trendingTopics || []).map(i => ({ ...i, _type: 'Trending', _id: i.newstrendingtopics, _title: i.title, _date: i.createdAt, _visible: i.isVisible !== false })),
      ...(expertInsights || []).map(i => ({ ...i, _type: 'Insight', _id: i.newsexpertinsights, _title: i.title, _date: i.createdAt, _visible: i.isVisible !== false })),
      ...(postedNews || []).map(i => ({ ...i, _type: 'Posted', _id: i.staffinnpostednews, _title: i.title, _date: i.createdAt, _visible: i.isVisible !== false })),
      ...(recruiterNews || []).filter(i => !i.isDeleted).map(i => ({ ...i, _type: 'Recruiter', _id: i.recruiterNewsID, _title: i.title, _date: i.createdAt, _visible: i.isVisible !== false })),
      ...(instituteNews || []).filter(i => !i.isDeleted).map(i => ({ ...i, _type: 'Institute', _id: i.eventNewsId, _title: i.title, _date: i.createdAt, _visible: i.isVisible !== false })),
    ].sort((a, b) => new Date(b._date) - new Date(a._date)).slice(0, 12)

    const typeColor = {
      Hero:      { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
      Trending:  { bg: '#fefce8', text: '#a16207', dot: '#eab308' },
      Insight:   { bg: '#f5f3ff', text: '#7c3aed', dot: '#8b5cf6' },
      Posted:    { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
      Recruiter: { bg: '#fff7ed', text: '#9a3412', dot: '#f97316' },
      Institute: { bg: '#fdf2f8', text: '#9d174d', dot: '#ec4899' },
    }

    const statCards = [
      { label: 'Total Articles',     value: totalArticles,          icon: FileText,   color: '#3b82f6', bg: '#eff6ff' },
      { label: 'Published',          value: totalPublished,         icon: CheckCircle,color: '#10b981', bg: '#ecfdf5' },
      { label: 'Hidden / Draft',     value: totalHidden,            icon: EyeOff,     color: '#f59e0b', bg: '#fefce8' },
      { label: 'Trending Topics',    value: trendingTopics.length,  icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
      { label: 'Expert Videos',      value: expertInsights.length,  icon: Video,      color: '#ef4444', bg: '#fef2f2' },
      { label: 'Posted News',        value: postedNews.length,      icon: Newspaper,  color: '#0ea5e9', bg: '#f0f9ff' },
      { label: 'Recruiter News',     value: recruiterNews.filter(i => !i.isDeleted).length, icon: Briefcase, color: '#f97316', bg: '#fff7ed' },
      { label: 'Institute News',     value: instituteNews.filter(i => !i.isDeleted).length, icon: GraduationCap, color: '#ec4899', bg: '#fdf2f8' },
    ]

    const breakdownRows = [
      { label: 'Hero Banners',    total: heroSections.length,  pub: heroPublished,     type: 'Hero' },
      { label: 'Trending Topics', total: trendingTopics.length, pub: trendPublished,   type: 'Trending' },
      { label: 'Expert Insights', total: expertInsights.length, pub: insightPublished, type: 'Insight' },
      { label: 'Posted News',     total: postedNews.length,    pub: postedPublished,   type: 'Posted' },
      { label: 'Recruiter News',  total: recruiterNews.filter(i=>!i.isDeleted).length, pub: recruiterPublished, type: 'Recruiter' },
      { label: 'Institute News',  total: instituteNews.filter(i=>!i.isDeleted).length, pub: institutePublished, type: 'Institute' },
    ]

    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 }}>Dashboard</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>Live overview of your newsroom · auto-updates via WebSocket</p>
          </div>
          <button
            onClick={loadAllData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: loading ? 0.6 : 1 }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px', fontWeight: 500 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Breakdown table */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <BarChart2 size={18} color='#6b7280' />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Content Breakdown</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#9ca3af', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Section</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', color: '#9ca3af', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', color: '#9ca3af', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Visible</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: '#9ca3af', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {breakdownRows.map(({ label, total, pub, type }) => {
                  const pct = total > 0 ? Math.round((pub / total) * 100) : 0
                  const c = typeColor[type]
                  return (
                    <tr key={label} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '9px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', color: '#111827', fontWeight: 700 }}>{total}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: c.bg, color: c.text, padding: '2px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>{pub}</span>
                      </td>
                      <td style={{ padding: '9px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: c.dot, borderRadius: 4, transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: 28 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <Activity size={18} color='#6b7280' />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Quick Actions</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: '+ Post Hero News',       section: 'staffinn', sub: 'hero',     color: '#3b82f6' },
                { label: '+ Add Trending Topic',   section: 'staffinn', sub: 'trending', color: '#eab308' },
                { label: '+ Upload Expert Insight',section: 'staffinn', sub: 'insights', color: '#8b5cf6' },
                { label: '+ Post News Article',    section: 'staffinn', sub: 'posted',   color: '#10b981' },
                { label: '→ Manage Recruiter News',section: 'recruiter',sub: null,       color: '#f97316' },
                { label: '→ Manage Institute News',section: 'institute',sub: null,       color: '#ec4899' },
              ].map(({ label, section, sub, color }) => (
                <button key={label} onClick={() => {
                  setActiveSection(section)
                  if (sub) { setActiveSubSection(sub); setShowForm(true) }
                }}
                style={{ textAlign: 'left', padding: '10px 14px', background: '#f9fafb', border: `1.5px solid ${color}22`, borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = color + '10'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Clock size={18} color='#6b7280' />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Recent Activity</h3>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9ca3af' }}>Latest {allItems.length} items across all sections</span>
          </div>
          {allItems.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>No content yet. Start by posting a Hero News or Trending Topic.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {allItems.map((item, i) => {
                const c = typeColor[item._type] || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' }
                const dateStr = item._date ? new Date(item._date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                return (
                  <div key={item._id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: i % 2 === 0 ? '#fafafa' : '#fff', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fafafa' : '#fff'}
                  >
                    <span style={{ background: c.bg, color: c.text, padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.7rem', minWidth: 64, textAlign: 'center', flexShrink: 0 }}>{item._type}</span>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item._title || '(Untitled)'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0 }}>{dateStr}</span>
                    <span style={{ flexShrink: 0 }}>
                      {item._visible
                        ? <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>● Published</span>
                        : <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>● Hidden</span>
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Render Rich Form ──────────────────────────────────────────────────────────
  // Render the rich form inline (replaces modal form fields)
  const renderRichForm = () => {
    if (activeSubSection === 'hero') {
      return (
        <form onSubmit={handleSubmit} className="admin-rich-form">
          <div className="admin-rich-form-header">
            <div>
              <h3 className="admin-rich-form-title">Hero News</h3>
              <p className="admin-rich-form-subtitle">The featured story of the day on /news.</p>
            </div>
            <div className="admin-rich-form-actions">
              <select
                value={formData.status || 'Published'}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="admin-status-select"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
              <button type="submit" className="admin-save-publish-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>

          <div className="admin-rich-form-grid">
            <div className="admin-rich-form-left">
              <div className="admin-form-group">
                <label className="admin-form-label">Headline <span className="admin-form-label-required">*</span></label>
                <input type="text" className="admin-input" placeholder="Your headline appears here"
                  value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Excerpt <span className="admin-form-label-required">*</span></label>
                <textarea className="admin-textarea" rows={3} placeholder="Short excerpt shown under the headline..."
                  value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Author Name</label>
                  <input type="text" className="admin-input" placeholder="e.g. Rajesh Kumar"
                    value={formData.author || ''} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Author Avatar URL</label>
                  <input type="text" className="admin-input" placeholder="https://..."
                    value={formData.authorAvatar || ''} onChange={e => setFormData({ ...formData, authorAvatar: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Banner Image URL <span className="admin-form-label-required">*</span></label>
                <div className="admin-file-upload-row">
                  <input type="file" accept="image/*" className="admin-file-input"
                    onChange={e => { const f = e.target.files[0]; if (f) setFormData({ ...formData, banner: f }) }}
                    required={!editingItem} />
                  {(formData.banner instanceof File) && (
                    <img src={URL.createObjectURL(formData.banner)} alt="preview" className="admin-file-thumb" />
                  )}
                  {!(formData.banner instanceof File) && (formData.bannerImageUrl || editingItem?.bannerImageUrl) && (
                    <img src={formData.bannerImageUrl || editingItem?.bannerImageUrl} alt="current" className="admin-file-thumb" />
                  )}
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Full Article Content <span style={{fontWeight:400,color:'#6b7280'}}>(Markdown: use ## for headings, - for lists)</span></label>
                <textarea className="admin-textarea" rows={6} placeholder="Full article body in markdown..."
                  value={formData.fullContent || ''} onChange={e => setFormData({ ...formData, fullContent: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Category</label>
                  <select className="admin-input" value={formData.category || 'Editorial'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option>Editorial</option>
                    <option>Recruitment</option>
                    <option>Education</option>
                    <option>AI</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Read Time</label>
                  <input type="text" className="admin-input" placeholder="e.g. 5 min read"
                    value={formData.readTime || ''} onChange={e => setFormData({ ...formData, readTime: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Tags (comma separated)</label>
                <input type="text" className="admin-input" placeholder="AI, Hiring, Freshers"
                  value={formData.tags || ''} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
              </div>
            </div>

            <div className="admin-rich-form-right">
              <div className="admin-live-preview">
                <div className="admin-live-preview-label">Live Preview</div>
                <div className="admin-hero-preview">
                  {(formData.banner instanceof File || formData.bannerImageUrl || editingItem?.bannerImageUrl) && (
                    <img src={formData.banner instanceof File ? URL.createObjectURL(formData.banner) : (formData.bannerImageUrl || editingItem?.bannerImageUrl)} alt="" className="admin-hero-preview-img" />
                  )}
                  <div className="admin-hero-preview-overlay">
                    <span className="admin-featured-badge">● FEATURED TODAY</span>
                    <h4 className="admin-hero-preview-title">{formData.title || 'Your headline appears here'}</h4>
                  </div>
                </div>
              </div>
              <div className="admin-form-group" style={{marginTop:'1rem'}}>
                <label className="admin-form-label">Featured</label>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <input type="checkbox" checked={formData.isFeatured || false}
                    onChange={e => setFormData({...formData, isFeatured: e.target.checked})} style={{width:'18px',height:'18px'}} />
                  <span style={{fontSize:'0.875rem',color:'#374151'}}>Mark as Featured</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
            <button type="button" className="admin-cancel-btn" onClick={() => { setShowForm(false); setEditingItem(null); setFormData({}); }}>Cancel</button>
          </div>
        </form>
      )
    }

    if (activeSubSection === 'trending') {
      return (
        <form onSubmit={handleSubmit} className="admin-rich-form">
          <div className="admin-rich-form-header">
            <div>
              <h3 className="admin-rich-form-title">Trending Topics</h3>
              <p className="admin-rich-form-subtitle">Short, snappy cards for the trending grid.</p>
            </div>
            <div className="admin-rich-form-actions">
              <select value={formData.status || 'Published'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="admin-status-select">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
              <button type="submit" className="admin-save-publish-btn" disabled={loading}>{loading ? 'Saving...' : 'Save & Publish'}</button>
            </div>
          </div>

          <div className="admin-rich-form-grid">
            <div className="admin-rich-form-left">
              <div className="admin-form-group">
                <label className="admin-form-label">Title <span className="admin-form-label-required">*</span></label>
                <input type="text" className="admin-input" placeholder="Topic title..."
                  value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Image URL <span className="admin-form-label-required">*</span></label>
                <div className="admin-file-upload-row">
                  <input type="file" accept="image/*" className="admin-file-input"
                    onChange={e => { const f = e.target.files[0]; if (f) setFormData({ ...formData, image: f }) }}
                    required={!editingItem} />
                  {(formData.image instanceof File) && (
                    <img src={URL.createObjectURL(formData.image)} alt="preview" className="admin-file-thumb" />
                  )}
                  {!(formData.image instanceof File) && (formData.imageUrl || editingItem?.imageUrl) && (
                    <img src={formData.imageUrl || editingItem?.imageUrl} alt="current" className="admin-file-thumb" />
                  )}
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Description <span style={{fontWeight:400,color:'#6b7280'}}>(2 lines)</span></label>
                <textarea className="admin-textarea" rows={3} placeholder="Short description shown on the card..."
                  value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Tags (comma separated)</label>
                <input type="text" className="admin-input" placeholder="#AI, #Hiring2025"
                  value={formData.tags || ''} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
              </div>
            </div>
            <div className="admin-rich-form-right">
              <div className="admin-live-preview">
                <div className="admin-live-preview-label">Preview</div>
                <div className="admin-trending-preview">
                  {(formData.image instanceof File || formData.imageUrl || editingItem?.imageUrl) && (
                    <img src={formData.image instanceof File ? URL.createObjectURL(formData.image) : (formData.imageUrl || editingItem?.imageUrl)} alt="" className="admin-trending-preview-img" />
                  )}
                  <div className="admin-trending-preview-overlay">
                    <span className="admin-trending-preview-title">{formData.title || 'Title'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
            <button type="button" className="admin-cancel-btn" onClick={() => { setShowForm(false); setEditingItem(null); setFormData({}); }}>Cancel</button>
          </div>
        </form>
      )
    }

    if (activeSubSection === 'insights') {
      return (
        <form onSubmit={handleSubmit} className="admin-rich-form">
          <div className="admin-rich-form-header">
            <div>
              <h3 className="admin-rich-form-title">Expert Insights</h3>
              <p className="admin-rich-form-subtitle">Curated videos from industry leaders.</p>
            </div>
            <div className="admin-rich-form-actions">
              <select value={formData.status || 'Published'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="admin-status-select">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
              <button type="submit" className="admin-save-publish-btn" disabled={loading}>{loading ? 'Saving...' : 'Save & Publish'}</button>
            </div>
          </div>

          <div className="admin-rich-form-grid">
            <div className="admin-rich-form-left">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Expert Name <span className="admin-form-label-required">*</span></label>
                  <input type="text" className="admin-input" placeholder="e.g. Anand Mehta"
                    value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Avatar URL</label>
                  <input type="text" className="admin-input" placeholder="https://..."
                    value={formData.avatarUrl || ''} onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Designation <span className="admin-form-label-required">*</span></label>
                  <input type="text" className="admin-input" placeholder="e.g. Head of Talent"
                    value={formData.designation || ''} onChange={e => setFormData({ ...formData, designation: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Company</label>
                  <input type="text" className="admin-input" placeholder="e.g. Infosys"
                    value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Video Title <span className="admin-form-label-required">*</span></label>
                <input type="text" className="admin-input" placeholder="e.g. What Recruiters Really Look For in 2025"
                  value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">YouTube Embed URL <span className="admin-form-label-required">*</span></label>
                <input type="text" className="admin-input" placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  value={formData.youtubeUrl || ''} onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })} required />
                {formData.youtubeUrl && (
                  <p className="admin-field-hint">Auto Thumbnail: paste a YouTube URL above and the thumbnail will be generated automatically.</p>
                )}
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Duration</label>
                  <input type="text" className="admin-input" placeholder="e.g. 12 min"
                    value={formData.duration || ''} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Views</label>
                  <input type="text" className="admin-input" placeholder="e.g. 24.1k views"
                    value={formData.views || ''} onChange={e => setFormData({ ...formData, views: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Upload Video (Optional)</label>
                <input type="file" accept="video/*" className="admin-file-input"
                  onChange={e => { const f = e.target.files[0]; if (f) setFormData({ ...formData, video: f }) }} />
              </div>
            </div>
            <div className="admin-rich-form-right">
              <div className="admin-live-preview">
                <div className="admin-live-preview-label">Preview</div>
                <div className="admin-insight-preview">
                  {formData.youtubeUrl ? (() => {
                    const match = formData.youtubeUrl.match(/(?:embed\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                    const vid = match ? match[1] : null;
                    return vid ? (
                      <div style={{position:'relative'}}>
                        <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt="thumb" style={{width:'100%',borderRadius:'8px'}} />
                        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(255,255,255,0.9)',borderRadius:'50%',width:'48px',height:'48px',display:'flex',alignItems:'center',justifyContent:'center'}}>▶</div>
                        {formData.duration && <span style={{position:'absolute',bottom:'8px',right:'8px',background:'rgba(0,0,0,0.7)',color:'white',fontSize:'11px',padding:'2px 6px',borderRadius:'4px'}}>{formData.duration}</span>}
                      </div>
                    ) : null
                  })() : <div className="admin-insight-preview-placeholder">Video preview will appear when YouTube URL is set</div>}
                  <div style={{padding:'0.75rem 0 0'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
                      {formData.avatarUrl && <img src={formData.avatarUrl} alt="" style={{width:'32px',height:'32px',borderRadius:'50%',objectFit:'cover'}} />}
                      <div>
                        <div style={{fontSize:'13px',fontWeight:700}}>{formData.name || 'Expert Name'}</div>
                        <div style={{fontSize:'11px',color:'#6b7280'}}>{formData.designation}{formData.company ? ` · ${formData.company}` : ''}</div>
                      </div>
                    </div>
                    <div style={{fontSize:'13px',fontWeight:600}}>{formData.title || 'Video title here'}</div>
                    {formData.views && <div style={{fontSize:'11px',color:'#6b7280',marginTop:'4px'}}>{formData.views}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
            <button type="button" className="admin-cancel-btn" onClick={() => { setShowForm(false); setEditingItem(null); setFormData({}); }}>Cancel</button>
          </div>
        </form>
      )
    }

    if (activeSubSection === 'posted') {
      return (
        <form onSubmit={handleSubmit} className="admin-rich-form">
          <div className="admin-rich-form-header">
            <div>
              <h3 className="admin-rich-form-title">Posted News</h3>
              <p className="admin-rich-form-subtitle">Editorial and general news articles.</p>
            </div>
            <div className="admin-rich-form-actions">
              <select value={formData.status || 'Published'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="admin-status-select">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
              <button type="submit" className="admin-save-publish-btn" disabled={loading}>{loading ? 'Saving...' : 'Save & Publish'}</button>
            </div>
          </div>

          <div className="admin-rich-form-grid">
            <div className="admin-rich-form-left">
              <div className="admin-form-group">
                <label className="admin-form-label">Title <span className="admin-form-label-required">*</span></label>
                <input type="text" className="admin-input" placeholder="Article title..."
                  value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <select className="admin-input" value={formData.category || 'Editorial'}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option>Editorial</option>
                  <option>General</option>
                  <option>Recruitment</option>
                  <option>Education</option>
                  <option>AI</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Banner Image <span className="admin-form-label-required">*</span></label>
                <div className="admin-file-upload-row">
                  <input type="file" accept="image/*" className="admin-file-input"
                    onChange={e => { const f = e.target.files[0]; if (f) setFormData({ ...formData, banner: f }) }}
                    required={!editingItem} />
                  {(formData.banner instanceof File) && (
                    <img src={URL.createObjectURL(formData.banner)} alt="preview" className="admin-file-thumb" />
                  )}
                  {!(formData.banner instanceof File) && (formData.bannerImageUrl || editingItem?.bannerImageUrl) && (
                    <img src={formData.bannerImageUrl || editingItem?.bannerImageUrl} alt="current" className="admin-file-thumb" />
                  )}
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Excerpt <span className="admin-form-label-required">*</span></label>
                <textarea className="admin-textarea" rows={2} placeholder="Short summary shown in the news feed..."
                  value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Full Content</label>
                <textarea className="admin-textarea" rows={6} placeholder="Full article text..."
                  value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Author</label>
                  <input type="text" className="admin-input" placeholder="e.g. Staff Reporter"
                    value={formData.author || ''} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Date</label>
                  <input type="date" className="admin-input"
                    value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Read Time <span style={{fontWeight:400,color:'#6b7280'}}>(auto)</span></label>
                <input type="text" className="admin-input" placeholder="e.g. 4 min read (leave blank to auto-calculate)"
                  value={formData.readTime || ''} onChange={e => setFormData({ ...formData, readTime: e.target.value })} />
              </div>
            </div>
            <div className="admin-rich-form-right">
              <div className="admin-live-preview">
                <div className="admin-live-preview-label">Preview</div>
                <div className="admin-posted-preview">
                  {(formData.banner instanceof File || formData.bannerImageUrl || editingItem?.bannerImageUrl) ? (
                    <img src={formData.banner instanceof File ? URL.createObjectURL(formData.banner) : (formData.bannerImageUrl || editingItem?.bannerImageUrl)} alt="" className="admin-posted-preview-img" />
                  ) : (
                    <div className="admin-posted-preview-placeholder">Banner image preview</div>
                  )}
                  <div style={{padding:'0.75rem 0 0'}}>
                    {formData.category && <span className="admin-preview-category-badge">{formData.category.toUpperCase()}</span>}
                    <div style={{fontWeight:700,fontSize:'14px',margin:'0.4rem 0'}}>{formData.title || 'Article title here'}</div>
                    <div style={{fontSize:'12px',color:'#6b7280'}}>{formData.description || 'Excerpt appears here...'}</div>
                    <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'0.5rem'}}>
                      {formData.author || 'Author'} · {formData.date || new Date().toLocaleDateString()} · {formData.readTime || 'Read Time'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
            <button type="button" className="admin-cancel-btn" onClick={() => { setShowForm(false); setEditingItem(null); setFormData({}); }}>Cancel</button>
          </div>
        </form>
      )
    }
    return null
  }

  // Keep getFormFields for legacy modal (won't be used when showForm + rich form replaces modal)
  const getFormFields = () => []

  const ItemCard = ({ item, type, actions, showFullContent = false, isLatest = false }) => {
    if (type === 'hero' || type === 'posted') {
      return (
        <div className="admin-hero-card">
          <div className="admin-hero-image-container">
            <img 
              src={item.banner || item.bannerImageUrl || 'https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/0f7d2865-028b-439b-16d4-0b0f897b5500/public'} 
              alt={item.title} 
              className="admin-hero-image"
            />
            {isLatest && (
              <div className="admin-hero-badge">
                <span className="admin-hero-badge-text">
                  TOP NEWS OF THE DAY
                </span>
              </div>
            )}
          </div>
          <div className="admin-hero-content">
            <h2 className="admin-hero-title">{item.title}</h2>
            <p className="admin-hero-text">
              {showFullContent ? (item.content || item.description) : `${(item.content || item.description).substring(0, 200)}...`}
            </p>
            <div className="admin-hero-meta">
              <div className="admin-hero-meta-left">
                <span className="admin-hero-date">
                  <Clock size={14} />
                  {item.date}
                </span>
                {item.tags && item.tags.split(',').map((tag, idx) => (
                  <span key={idx} className="admin-hero-tag">
                    {tag.trim()}
                  </span>
                ))}
              </div>
              {!showFullContent && (item.content || item.description).length > 200 && (
                <button 
                  onClick={() => setViewingFullArticle(item)}
                  className="admin-read-more-btn"
                >
                  READ FULL ARTICLE
                </button>
              )}
            </div>
            <div className="admin-hero-actions">
              {actions.map((action, idx) => (
                <button key={idx} onClick={action.onClick} className={`admin-action-btn ${action.className}`}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="admin-item-card">
        {(item.image || item.banner || item.thumbnail) && (
          <div className="admin-item-image-container">
            <img 
              src={item.image || item.banner || item.thumbnail} 
              alt={item.title} 
              className="admin-item-image"
            />
            {item.video && (
              <div className="admin-video-overlay">
                <button 
                  onClick={() => window.open(item.video)}
                  className="admin-play-btn"
                >
                  <div className="admin-play-icon"></div>
                </button>
              </div>
            )}
          </div>
        )}
        <div className="admin-item-content">
          <h3 className="admin-item-title">{item.title}</h3>
          {item.name && <p className="admin-item-name">{item.name}</p>}
          {item.designation && <p className="admin-item-designation">{item.designation}</p>}
          {item.tags && (
            <div className="admin-item-tags">
              {item.tags.split(',').map((tag, idx) => (
                <span key={idx} className="admin-item-tag">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
          {(item.content || item.description) && (
            <div className="admin-item-description">
              <p className="admin-item-text">
                {showFullContent ? (item.content || item.description) : 
                  `${(item.content || item.description).substring(0, 100)}...`}
              </p>
              {!showFullContent && (item.content || item.description).length > 100 && (
                <button 
                  onClick={() => setViewingFullArticle(item)}
                  className="admin-read-full-link"
                >
                  Read Full Article
                </button>
              )}
            </div>
          )}
          <div className="admin-item-footer">
            <span className="admin-item-date">{item.date}</span>
            <div className="admin-item-actions">
              {actions.map((action, idx) => (
                <button key={idx} onClick={action.onClick} className={`admin-action-btn ${action.className}`}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="admin-container">
      {/* Mobile overlay */}
      <div 
        className={`admin-mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Dark Sidebar */}
      <div className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <h1 className="admin-sidebar-title">
            <span className="staff">Staff</span>
            <span className="inn">inn</span>
          </h1>
          <button 
            onClick={onLogout}
            className="admin-logout-btn"
            title="Logout"
          >
            Logout
          </button>
        </div>
        
        <nav className="admin-nav">
          <div className="admin-nav-label">ADMIN PANEL</div>
          <div className="admin-nav-items">
            <button
              onClick={() => { setActiveSection('dashboard'); setMobileMenuOpen(false) }}
              className={`admin-nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <div>
              <button
                onClick={() => {
                  setActiveSection('staffinn')
                  setMobileMenuOpen(false)
                }}
                className={`admin-nav-btn ${activeSection === 'staffinn' ? 'active' : ''}`}
              >
                <Newspaper size={18} />
                Staffinn News
              </button>
              {activeSection === 'staffinn' && (
                <div className="admin-nav-sub">
                  {[
                    { id: 'hero', label: 'Hero Banner', icon: ImageIcon },
                    { id: 'trending', label: 'Trending Topics', icon: TrendingUp },
                    { id: 'insights', label: 'Expert Insights', icon: Video },
                    { id: 'posted', label: 'Post News', icon: Newspaper }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveSubSection(sub.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`admin-nav-sub-btn ${activeSubSection === sub.id ? 'active' : ''}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setActiveSection('recruiter')
                setMobileMenuOpen(false)
              }}
              className={`admin-nav-btn ${activeSection === 'recruiter' ? 'active' : ''}`}
            >
              <Briefcase size={18} />
              Recruiter News
            </button>
            <button
              onClick={() => {
                setActiveSection('institute')
                setMobileMenuOpen(false)
              }}
              className={`admin-nav-btn ${activeSection === 'institute' ? 'active' : ''}`}
            >
              <GraduationCap size={18} />
              Institute News
            </button>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/news" target="_blank" className="admin-back-link">
            <ArrowLeft size={16} />
            Back to News
          </a>
          <div className="admin-user-block">
            <div className="admin-user-avatar">
              <User size={14} />
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Admin User
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <button 
            className="admin-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={20} />
          </button>
          
          <div className="admin-topbar-left">
            <h2 className="admin-topbar-title">
              {activeSection === 'dashboard' && 'Dashboard'}
              {activeSection === 'staffinn' && (
                activeSubSection === 'hero' ? 'Hero Banner' :
                activeSubSection === 'trending' ? 'Trending Topics' :
                activeSubSection === 'insights' ? 'Expert Insights' :
                'Post News'
              )}
              {activeSection === 'recruiter' && 'Recruiter News'}
              {activeSection === 'institute' && 'Institute News'}
              {activeSection === 'dashboard' && 'Dashboard'}
            </h2>
            <p className="admin-topbar-subtitle">
              {activeSection === 'dashboard' && 'Live overview of your newsroom'}
              {activeSection === 'staffinn' && activeSubSection === 'hero' && 'Manage your hero banners'}
              {activeSection === 'staffinn' && activeSubSection === 'trending' && 'Manage trending topics'}
              {activeSection === 'staffinn' && activeSubSection === 'insights' && 'Manage expert insights'}
              {activeSection === 'staffinn' && activeSubSection === 'posted' && 'Post and manage news'}
              {activeSection === 'recruiter' && 'Review recruiter news submissions'}
              {activeSection === 'institute' && 'Review institute news submissions'}
            </p>
          </div>
          
          <div className="admin-topbar-right">
            <button 
              className="admin-save-btn"
              disabled
            >
              <Save size={16} />
              <span>Saved</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="admin-content">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'staffinn' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">
                  {activeSubSection === 'hero' && 'Hero Banner'}
                  {activeSubSection === 'trending' && 'Trending Topics'}
                  {activeSubSection === 'insights' && 'Expert Insights & Interviews'}
                  {activeSubSection === 'posted' && 'Post News'}
                  <span className="admin-section-count">
                    {activeSubSection === 'hero' && `${heroSections.length} items`}
                    {activeSubSection === 'trending' && `${trendingTopics.length} items`}
                    {activeSubSection === 'insights' && `${expertInsights.length} items`}
                    {activeSubSection === 'posted' && `${postedNews.length} items`}
                  </span>
                </h2>
                <button
                  onClick={() => setShowForm(true)}
                  className="admin-create-btn"
                >
                  <Plus size={18} />
                  {activeSubSection === 'hero' && 'Create Hero Banner'}
                  {activeSubSection === 'trending' && 'Add Topic'}
                  {activeSubSection === 'insights' && 'Add Insight'}
                  {activeSubSection === 'posted' && 'Post News'}
                </button>
              </div>

              {showForm && (
                <div className="admin-rich-form-wrapper">
                  {renderRichForm()}
                </div>
              )}

              {/* All Hero Posts Table */}
              {activeSubSection === 'hero' && !showForm && (
                <div className="admin-table-section">
                  <h4 className="admin-table-title">All Hero Posts</h4>
                  <div style={{overflowX:'auto'}}>
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Headline</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heroSections.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(hero => (
                          <tr key={hero.newsherosection}>
                            <td style={{maxWidth:'280px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                                {hero.bannerImageUrl && <img src={hero.bannerImageUrl} alt="" style={{width:'48px',height:'32px',objectFit:'cover',borderRadius:'4px',flexShrink:0}} />}
                                <span style={{fontWeight:600,fontSize:'13px'}}>{hero.title}</span>
                              </div>
                            </td>
                            <td><span className="admin-table-badge">{hero.category || 'Editorial'}</span></td>
                            <td style={{fontSize:'13px',color:'#6b7280'}}>{new Date(hero.createdAt).toLocaleDateString('en-IN')}</td>
                            <td>
                              <span className={`admin-status-badge ${hero.isActive ? 'published' : 'draft'}`}>
                                {hero.isActive ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div style={{display:'flex',gap:'0.5rem'}}>
                                <button className="admin-table-btn edit" onClick={() => {
                                  setFormData({
                                    title: hero.title, content: hero.content,
                                    excerpt: hero.excerpt, author: hero.author,
                                    authorAvatar: hero.authorAvatar, category: hero.category,
                                    readTime: hero.readTime, tags: hero.tags,
                                    status: hero.isActive ? 'Published' : 'Draft',
                                    bannerImageUrl: hero.bannerImageUrl
                                  })
                                  setEditingItem(hero); setShowForm(true)
                                }}>Edit</button>
                                <button className="admin-table-btn hide" onClick={() => toggleVisibility(hero.newsherosection, 'hero')}>
                                  {hero.isActive ? 'Hide' : 'Show'}
                                </button>
                                <button className="admin-table-btn delete" onClick={() => deleteItem(hero.newsherosection, 'hero')}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {heroSections.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'#6b7280'}}>No hero posts yet. Click "Create Hero Banner" to add one.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* All Trending Topics Table */}
              {activeSubSection === 'trending' && !showForm && (
                <div className="admin-table-section">
                  <h4 className="admin-table-title">All Trending Topics</h4>
                  <div style={{overflowX:'auto'}}>
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Tags</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendingTopics.map(topic => (
                          <tr key={topic.newstrendingtopics}>
                            <td style={{maxWidth:'240px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                                {topic.imageUrl && <img src={topic.imageUrl} alt="" style={{width:'48px',height:'32px',objectFit:'cover',borderRadius:'4px',flexShrink:0}} />}
                                <span style={{fontWeight:600,fontSize:'13px'}}>{topic.title}</span>
                              </div>
                            </td>
                            <td style={{fontSize:'12px',color:'#6b7280'}}>{topic.tags || '—'}</td>
                            <td style={{fontSize:'13px',color:'#6b7280'}}>{new Date(topic.createdAt).toLocaleDateString('en-IN')}</td>
                            <td>
                              <span className={`admin-status-badge ${topic.isVisible ? 'published' : 'draft'}`}>
                                {topic.isVisible ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div style={{display:'flex',gap:'0.5rem'}}>
                                <button className="admin-table-btn edit" onClick={() => {
                                  setFormData({
                                    title: topic.title, description: topic.description,
                                    tags: topic.tags, status: topic.isVisible ? 'Published' : 'Draft',
                                    imageUrl: topic.imageUrl
                                  })
                                  setEditingItem(topic); setShowForm(true)
                                }}>Edit</button>
                                <button className="admin-table-btn hide" onClick={() => toggleVisibility(topic.newstrendingtopics, 'trending')}>
                                  {topic.isVisible ? 'Hide' : 'Show'}
                                </button>
                                <button className="admin-table-btn delete" onClick={() => deleteItem(topic.newstrendingtopics, 'trending')}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {trendingTopics.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'#6b7280'}}>No trending topics yet. Click "Add Topic" to add one.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  {trendingTopics.length >= 15 && <p className="admin-limit-warning">⚠️ Maximum 15 topics allowed</p>}
                </div>
              )}

              {/* All Expert Videos Table */}
              {activeSubSection === 'insights' && !showForm && (
                <div className="admin-table-section">
                  <h4 className="admin-table-title">All Expert Videos</h4>
                  <div style={{overflowX:'auto'}}>
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Video</th>
                          <th>Expert</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expertInsights.map(insight => {
                          const ytMatch = (insight.youtubeUrl || '').match(/(?:embed\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
                          const ytThumb = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : (insight.thumbnailUrl || null)
                          return (
                            <tr key={insight.newsexpertinsights}>
                              <td style={{maxWidth:'220px'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                                  {ytThumb && <img src={ytThumb} alt="" style={{width:'64px',height:'36px',objectFit:'cover',borderRadius:'4px',flexShrink:0}} />}
                                  <span style={{fontWeight:600,fontSize:'13px'}}>{insight.title}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{fontSize:'13px'}}>
                                  <div style={{fontWeight:600}}>{insight.expertName}</div>
                                  <div style={{color:'#6b7280',fontSize:'12px'}}>{insight.designation}{insight.company ? ` · ${insight.company}` : ''}</div>
                                </div>
                              </td>
                              <td style={{fontSize:'13px',color:'#6b7280'}}>{insight.duration || '—'}</td>
                              <td>
                                <span className={`admin-status-badge ${insight.isVisible ? 'published' : 'draft'}`}>
                                  {insight.isVisible ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td>
                                <div style={{display:'flex',gap:'0.5rem'}}>
                                  <button className="admin-table-btn edit" onClick={() => {
                                    setFormData({
                                      title: insight.title, name: insight.expertName,
                                      designation: insight.designation, company: insight.company,
                                      avatarUrl: insight.avatarUrl, youtubeUrl: insight.youtubeUrl,
                                      duration: insight.duration, views: insight.views,
                                      status: insight.isVisible ? 'Published' : 'Draft',
                                      videoUrl: insight.videoUrl, thumbnailUrl: insight.thumbnailUrl
                                    })
                                    setEditingItem(insight); setShowForm(true)
                                  }}>Edit</button>
                                  <button className="admin-table-btn hide" onClick={() => toggleVisibility(insight.newsexpertinsights, 'insights')}>
                                    {insight.isVisible ? 'Hide' : 'Show'}
                                  </button>
                                  <button className="admin-table-btn delete" onClick={() => deleteItem(insight.newsexpertinsights, 'insights')}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {expertInsights.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'#6b7280'}}>No expert videos yet. Click "Add Insight" to add one.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* All Posted News Table */}
              {activeSubSection === 'posted' && !showForm && (
                <div className="admin-table-section">
                  <h4 className="admin-table-title">All Posted News</h4>
                  <div style={{overflowX:'auto'}}>
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postedNews.map(news => (
                          <tr key={news.staffinnpostednews}>
                            <td style={{maxWidth:'260px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                                {news.bannerImageUrl && <img src={news.bannerImageUrl} alt="" style={{width:'48px',height:'32px',objectFit:'cover',borderRadius:'4px',flexShrink:0}} />}
                                <span style={{fontWeight:600,fontSize:'13px'}}>{news.title}</span>
                              </div>
                            </td>
                            <td><span className="admin-table-badge">{news.category || 'Editorial'}</span></td>
                            <td style={{fontSize:'13px',color:'#6b7280'}}>{new Date(news.createdAt).toLocaleDateString('en-IN')}</td>
                            <td>
                              <span className={`admin-status-badge ${news.isVisible ? 'published' : 'draft'}`}>
                                {news.isVisible ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div style={{display:'flex',gap:'0.5rem'}}>
                                <button className="admin-table-btn edit" onClick={() => {
                                  setFormData({
                                    title: news.title, description: news.description,
                                    excerpt: news.excerpt, content: news.content,
                                    category: news.category, author: news.author,
                                    readTime: news.readTime, status: news.isVisible ? 'Published' : 'Draft',
                                    bannerImageUrl: news.bannerImageUrl
                                  })
                                  setEditingItem(news); setShowForm(true)
                                }}>Edit</button>
                                <button className="admin-table-btn hide" onClick={() => toggleVisibility(news.staffinnpostednews, 'posted')}>
                                  {news.isVisible ? 'Hide' : 'Show'}
                                </button>
                                <button className="admin-table-btn delete" onClick={() => deleteItem(news.staffinnpostednews, 'posted')}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {postedNews.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'#6b7280'}}>No news posted yet. Click "Post News" to add one.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'recruiter' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Recruiter News</h2>
            {loading && (
              <div className="admin-loading">
                <p>Loading recruiter news...</p>
              </div>
            )}
            {recruiterNews.length > 0 ? (
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Image</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Title</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Recruiter</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Company</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Details</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Date</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Status</th>
                      <th style={{padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiterNews.map(news => (
                      <tr key={news.recruiterNewsID} style={{borderBottom: '1px solid #e2e8f0', opacity: news.isDeleted ? 0.7 : 1, backgroundColor: news.isDeleted ? '#fef2f2' : 'white'}}>
                        <td style={{padding: '12px'}}>
                          {news.bannerImage ? (
                            <img 
                              src={news.bannerImage.startsWith('http') ? news.bannerImage : `https://s3.ap-south-1.amazonaws.com/staffinn-files/${news.bannerImage}`}
                              alt={news.title} 
                              style={{width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                            />
                          ) : (
                            <div style={{width: '60px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280'}}>No Image</div>
                          )}
                        </td>
                        <td style={{padding: '12px', maxWidth: '200px'}}>
                          <div style={{fontWeight: '600', color: '#1f2937', fontSize: '14px', marginBottom: '4px'}}>{news.title}</div>
                          {news.venue && <div style={{fontSize: '12px', color: '#6b7280'}}>📍 {news.venue}</div>}
                          {news.expectedParticipants && <div style={{fontSize: '12px', color: '#6b7280'}}>👥 Expected: {news.expectedParticipants}</div>}
                        </td>
                        <td style={{padding: '12px', fontSize: '14px', color: '#374151'}}>{news.recruiterName}</td>
                        <td style={{padding: '12px', fontSize: '14px', color: '#374151'}}>{news.company}</td>
                        <td style={{padding: '12px', maxWidth: '250px'}}>
                          <div style={{fontSize: '14px', color: '#6b7280', lineHeight: '1.4'}}>
                            {news.details.length > 80 ? `${news.details.substring(0, 80)}...` : news.details}
                          </div>
                          {news.details.length > 80 && (
                            <button 
                              onClick={() => setViewingRecruiterNews(news)}
                              style={{fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline'}}
                            >
                              Read Full
                            </button>
                          )}
                        </td>
                        <td style={{padding: '12px'}}>
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            📅 {new Date(news.date).toLocaleDateString()}
                          </div>
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            🕒 {new Date(news.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td style={{padding: '12px'}}>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            {news.verified && (
                              <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', textAlign: 'center'}}>✅ Verified</span>
                            )}
                            {news.isVisible === false && (
                              <span style={{backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', textAlign: 'center'}}>Hidden</span>
                            )}
                            {news.isDeleted && (
                              <span style={{backgroundColor: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', textAlign: 'center'}}>Deleted</span>
                            )}
                          </div>
                        </td>
                        <td style={{padding: '12px'}}>
                          <div style={{display: 'flex', gap: '4px', justifyContent: 'center'}}>
                            <button 
                              onClick={() => setViewingRecruiterNews(news)}
                              style={{backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px'}}
                            >
                              <Eye size={12} /> View
                            </button>
                            {!news.isDeleted && (
                              <>
                                <button 
                                  onClick={() => toggleVisibility(news.recruiterNewsID, 'recruiter')}
                                  style={{backgroundColor: news.isVisible === false ? '#10b981' : '#f59e0b', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px'}}
                                >
                                  {news.isVisible === false ? <Eye size={12} /> : <EyeOff size={12} />}
                                  {news.isVisible === false ? 'Show' : 'Hide'}
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this news? This action cannot be undone.')) {
                                      deleteItem(news.recruiterNewsID, 'recruiter')
                                    }
                                  }}
                                  style={{backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px'}}
                                >
                                  <Trash size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loading && (
              <div className="admin-no-data">
                <p>No recruiter news available. News will appear here when recruiters post from their dashboards.</p>
              </div>
            )}
          </div>
          )}

          {activeSection === 'institute' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Institute News</h2>
            {loading && (
              <div className="admin-loading">
                <p>Loading institute news...</p>
              </div>
            )}
            {instituteNews.length > 0 ? (
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Image</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Title</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Institute</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Type</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Details</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Date</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Status</th>
                      <th style={{padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instituteNews.map(news => (
                      <tr key={news.eventNewsId} style={{borderBottom: '1px solid #e2e8f0', opacity: news.isDeleted ? 0.7 : 1, backgroundColor: news.isDeleted ? '#fef2f2' : 'white'}}>
                        <td style={{padding: '12px'}}>
                          {news.bannerImage ? (
                            <img 
                              src={news.bannerImage.startsWith('http') ? news.bannerImage : `https://staffinn-files.s3.ap-south-1.amazonaws.com/${news.bannerImage}`} 
                              alt={news.title} 
                              style={{width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                              onError={(e) => {
                                console.error('Failed to load institute news image:', news.bannerImage);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log('Institute news image loaded successfully:', news.bannerImage)}
                            />
                          ) : (
                            <div style={{width: '60px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280'}}>No Image</div>
                          )}
                        </td>
                        <td style={{padding: '12px', maxWidth: '200px'}}>
                          <div style={{fontWeight: '600', color: '#1f2937', fontSize: '14px', marginBottom: '4px'}}>{news.title}</div>
                          {news.venue && <div style={{fontSize: '12px', color: '#6b7280'}}>📍 {news.venue}</div>}
                          {news.expectedParticipants && <div style={{fontSize: '12px', color: '#6b7280'}}>👥 Expected: {news.expectedParticipants}</div>}
                        </td>
                        <td style={{padding: '12px', fontSize: '14px', color: '#374151'}}>{news.company}</td>
                        <td style={{padding: '12px'}}>
                          <span style={{backgroundColor: news.type === 'Event' ? '#dbeafe' : '#f0fdf4', color: news.type === 'Event' ? '#1e40af' : '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500'}}>
                            {news.type}
                          </span>
                        </td>
                        <td style={{padding: '12px', maxWidth: '250px'}}>
                          <div style={{fontSize: '14px', color: '#6b7280', lineHeight: '1.4'}}>
                            {news.details.length > 80 ? `${news.details.substring(0, 80)}...` : news.details}
                          </div>
                          {news.details.length > 80 && (
                            <button 
                              onClick={() => setViewingInstituteNews(news)}
                              style={{fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline'}}
                            >
                              Read Full
                            </button>
                          )}
                        </td>
                        <td style={{padding: '12px'}}>
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            📅 {new Date(news.date).toLocaleDateString()}
                          </div>
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            🕒 {new Date(news.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td style={{padding: '12px'}}>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            {news.verified && (
                              <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', textAlign: 'center'}}>✅ Verified</span>
                            )}
                            {news.isVisible === false && (
                              <span style={{backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', textAlign: 'center'}}>Hidden</span>
                            )}
                            {news.isDeleted && (
                              <span style={{backgroundColor: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', textAlign: 'center'}}>Deleted</span>
                            )}
                          </div>
                        </td>
                        <td style={{padding: '12px'}}>
                          <div style={{display: 'flex', gap: '4px', justifyContent: 'center'}}>
                            <button 
                              onClick={() => setViewingInstituteNews(news)}
                              style={{backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px'}}
                            >
                              <Eye size={12} /> View
                            </button>
                            {!news.isDeleted && (
                              <>
                                <button 
                                  onClick={() => toggleVisibility(news.eventNewsId, 'institute')}
                                  style={{backgroundColor: news.isVisible === false ? '#10b981' : '#f59e0b', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px'}}
                                >
                                  {news.isVisible === false ? <Eye size={12} /> : <EyeOff size={12} />}
                                  {news.isVisible === false ? 'Show' : 'Hide'}
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this news? This action cannot be undone.')) {
                                      deleteItem(news.eventNewsId, 'institute')
                                    }
                                  }}
                                  style={{backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px'}}
                                >
                                  <Trash size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loading && (
              <div className="admin-no-data">
                <p>No institute news available. News will appear here when institutes post from their dashboards.</p>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
      
      {/* Global Recruiter News Modal */}
      {viewingRecruiterNews && (
        <div className="admin-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="admin-modal-large" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <div className="admin-modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 className="admin-modal-header-title" style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937'
              }}>Recruiter News Details</h3>
              <button 
                onClick={() => setViewingRecruiterNews(null)}
                className="admin-close-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div className="admin-modal-body" style={{padding: '20px'}}>
              <div className="admin-recruiter-news-modal">
                {viewingRecruiterNews.bannerImage && (
                  <div className="admin-modal-image" style={{marginBottom: '20px'}}>
                    <img 
                      src={viewingRecruiterNews.bannerImage.startsWith('http') ? viewingRecruiterNews.bannerImage : `https://s3.ap-south-1.amazonaws.com/staffinn-files/${viewingRecruiterNews.bannerImage}`}
                      alt={viewingRecruiterNews.title}
                      style={{width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px'}}
                    />
                  </div>
                )}
                <div className="admin-modal-content-details">
                  <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937'}}>
                    {viewingRecruiterNews.title}
                  </h2>
                  <div className="admin-modal-meta" style={{marginBottom: '20px'}}>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px'}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                        👤 <strong>Recruiter:</strong> {viewingRecruiterNews.recruiterName}
                      </span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                        🏢 <strong>Company:</strong> {viewingRecruiterNews.company}
                      </span>
                    </div>
                    {viewingRecruiterNews.venue && (
                      <div style={{marginBottom: '8px'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                          📍 <strong>Venue:</strong> {viewingRecruiterNews.venue}
                        </span>
                      </div>
                    )}
                    {viewingRecruiterNews.expectedParticipants && (
                      <div style={{marginBottom: '8px'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                          👥 <strong>Expected Participants:</strong> {viewingRecruiterNews.expectedParticipants}
                        </span>
                      </div>
                    )}
                    <div style={{display: 'flex', gap: '16px', marginTop: '12px'}}>
                      <span style={{color: '#6b7280'}}>
                        📅 <strong>Date:</strong> {new Date(viewingRecruiterNews.date).toLocaleDateString()}
                      </span>
                      <span style={{color: '#6b7280'}}>
                        🕒 <strong>Posted:</strong> {new Date(viewingRecruiterNews.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="admin-modal-description">
                    <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151'}}>Details</h3>
                    <p style={{lineHeight: '1.6', color: '#4b5563', whiteSpace: 'pre-wrap'}}>
                      {viewingRecruiterNews.details}
                    </p>
                  </div>
                  {viewingRecruiterNews.verified && (
                    <div style={{marginTop: '16px'}}>
                      <span style={{backgroundColor: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px'}}>
                        ✅ Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Institute News Modal */}
      {viewingInstituteNews && (
        <div className="admin-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="admin-modal-large" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <div className="admin-modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 className="admin-modal-header-title" style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937'
              }}>Institute News Details</h3>
              <button 
                onClick={() => setViewingInstituteNews(null)}
                className="admin-close-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div className="admin-modal-body" style={{padding: '20px'}}>
              <div className="admin-institute-news-modal">
                {viewingInstituteNews.bannerImage && (
                  <div className="admin-modal-image" style={{marginBottom: '20px'}}>
                    <img 
                      src={viewingInstituteNews.bannerImage.startsWith('http') ? viewingInstituteNews.bannerImage : `https://staffinn-files.s3.ap-south-1.amazonaws.com/${viewingInstituteNews.bannerImage}`} 
                      alt={viewingInstituteNews.title}
                      style={{width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px'}}
                      onError={(e) => {
                        console.error('Failed to load institute news modal image:', viewingInstituteNews.bannerImage);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => console.log('Institute news modal image loaded successfully:', viewingInstituteNews.bannerImage)}
                    />
                  </div>
                )}
                <div className="admin-modal-content-details">
                  <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937'}}>
                    {viewingInstituteNews.title}
                  </h2>
                  <div className="admin-modal-meta" style={{marginBottom: '20px'}}>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px'}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                        🏫 <strong>Institute:</strong> {viewingInstituteNews.company}
                      </span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                        📋 <strong>Type:</strong> {viewingInstituteNews.type}
                      </span>
                    </div>
                    {viewingInstituteNews.venue && (
                      <div style={{marginBottom: '8px'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                          📍 <strong>Venue:</strong> {viewingInstituteNews.venue}
                        </span>
                      </div>
                    )}
                    {viewingInstituteNews.expectedParticipants && (
                      <div style={{marginBottom: '8px'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280'}}>
                          👥 <strong>Expected Participants:</strong> {viewingInstituteNews.expectedParticipants}
                        </span>
                      </div>
                    )}
                    <div style={{display: 'flex', gap: '16px', marginTop: '12px'}}>
                      <span style={{color: '#6b7280'}}>
                        📅 <strong>Date:</strong> {new Date(viewingInstituteNews.date).toLocaleDateString()}
                      </span>
                      <span style={{color: '#6b7280'}}>
                        🕒 <strong>Posted:</strong> {new Date(viewingInstituteNews.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="admin-modal-description">
                    <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151'}}>Details</h3>
                    <p style={{lineHeight: '1.6', color: '#4b5563', whiteSpace: 'pre-wrap'}}>
                      {viewingInstituteNews.details}
                    </p>
                  </div>
                  {viewingInstituteNews.verified && (
                    <div style={{marginTop: '16px'}}>
                      <span style={{backgroundColor: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px'}}>
                        ✅ Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminPanel