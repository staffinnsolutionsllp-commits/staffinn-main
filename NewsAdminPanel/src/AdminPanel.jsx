import  { useState, useEffect } from 'react'
import { Plus, Eye, Edit, EyeOff, Trash, Upload, Star, Clock, X } from 'lucide-react'
import NewsAdminAPI from './services/newsAdminApi'
import io from 'socket.io-client'

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('staffinn')
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
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'banner' && key !== 'image' && key !== 'video' && key !== 'thumbnail') {
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

  const getFormFields = () => {
    if (activeSubSection === 'hero') {
      return [
        { name: 'title', type: 'text', placeholder: 'Hero Title', required: true },
        { name: 'content', type: 'textarea', placeholder: 'Hero Content', required: true },
        { name: 'tags', type: 'text', placeholder: 'Hero Tags (comma separated)', required: true },
        { name: 'banner', type: 'file', placeholder: 'Hero Banner', required: true }
      ]
    } else if (activeSubSection === 'trending') {
      return [
        { name: 'title', type: 'text', placeholder: 'Topic Title', required: true },
        { name: 'description', type: 'textarea', placeholder: 'Topic Description', required: true },
        { name: 'image', type: 'file', placeholder: 'Banner Image', required: true }
      ]
    } else if (activeSubSection === 'insights') {
      return [
        { name: 'title', type: 'text', placeholder: 'Video Title', required: true },
        { name: 'name', type: 'text', placeholder: 'Featured Name', required: true },
        { name: 'designation', type: 'text', placeholder: 'Designation', required: true },
        { name: 'video', type: 'file', placeholder: 'Upload Video (Optional)', required: false },
        { name: 'thumbnail', type: 'file', placeholder: 'Video Thumbnail (Optional)', required: false }
      ]
    } else if (activeSubSection === 'posted') {
      return [
        { name: 'title', type: 'text', placeholder: 'News Title', required: true },
        { name: 'description', type: 'textarea', placeholder: 'News Description', required: true },
        { name: 'banner', type: 'file', placeholder: 'News Banner Image', required: true }
      ]
    }
    return []
  }

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
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1 className="admin-sidebar-title">News Admin</h1>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-items">
            <div>
              <button
                onClick={() => setActiveSection('staffinn')}
                className={`admin-nav-btn ${activeSection === 'staffinn' ? 'active' : ''}`}
              >
                Staffinn News
              </button>
              {activeSection === 'staffinn' && (
                <div className="admin-nav-sub">
                  {[
                    { id: 'hero', label: 'Hero Section' },
                    { id: 'trending', label: 'Trending Topics' },
                    { id: 'insights', label: 'Expert Insights' },
                    { id: 'posted', label: 'Post News' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubSection(sub.id)}
                      className={`admin-nav-sub-btn ${activeSubSection === sub.id ? 'active' : ''}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveSection('recruiter')}
              className={`admin-nav-btn ${activeSection === 'recruiter' ? 'active' : ''}`}
            >
              Recruiter News
            </button>
            <button
              onClick={() => setActiveSection('institute')}
              className={`admin-nav-btn ${activeSection === 'institute' ? 'active' : ''}`}
            >
              Institute News
            </button>
          </div>
        </nav>
      </div>

      <div className="admin-main">
        {activeSection === 'staffinn' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">
                {activeSubSection === 'hero' && 'Hero Section'}
                {activeSubSection === 'trending' && 'Trending Topics'}
                {activeSubSection === 'insights' && 'Expert Insights & Interviews'}
                {activeSubSection === 'posted' && 'Post News'}
              </h2>
              <button
                onClick={() => setShowForm(true)}
                className="admin-create-btn"
              >
                <Plus size={16} />
                {activeSubSection === 'hero' && 'Create Hero Section'}
                {activeSubSection === 'trending' && 'Add Topic'}
                {activeSubSection === 'insights' && 'Add Insight'}
                {activeSubSection === 'posted' && 'Post News'}
              </button>
            </div>

            {showForm && (
              <div className="admin-modal">
                <div className="admin-modal-content">
                  <h3 className="admin-modal-title">
                    {activeSubSection === 'hero' && 'Create Hero Section'}
                    {activeSubSection === 'trending' && 'Add Trending Topic'}
                    {activeSubSection === 'insights' && 'Add Expert Insight'}
                    {activeSubSection === 'posted' && 'Post News'}
                  </h3>
                  <form onSubmit={handleSubmit} className="admin-form">
                    {getFormFields().map(field => (
                      <div key={field.name}>
                        {field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                            className="admin-textarea"
                            required={field.required}
                          />
                        ) : field.type === 'file' ? (
                          <input
                            type="file"
                            accept={field.name === 'video' ? 'video/*' : 'image/*'}
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                setFormData({...formData, [field.name]: file})
                              }
                            }}
                            className="admin-file-input"
                            required={field.required && !editingItem}
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                            className="admin-input"
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                    <div className="admin-form-actions">
                      <button type="submit" className="admin-submit-btn" disabled={loading}>
                        {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingItem(null)
                          setFormData({})
                        }}
                        className="admin-cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {viewingFullArticle && (
              <div className="admin-modal">
                <div className="admin-modal-large">
                  <div className="admin-modal-header">
                    <h3 className="admin-modal-header-title">Full Article</h3>
                    <button 
                      onClick={() => setViewingFullArticle(null)}
                      className="admin-close-btn"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="admin-modal-body">
                    <ItemCard
                      item={viewingFullArticle}
                      type={viewingFullArticle.name ? "insights" : viewingFullArticle.description ? "trending" : "hero"}
                      showFullContent={true}
                      actions={[]}
                    />
                  </div>
                </div>
              </div>
            )}



            <div className="admin-content-grid">
              {loading && (
                <div className="admin-loading">
                  <p>Loading...</p>
                </div>
              )}
              
              {activeSubSection === 'hero' && heroSections
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
                .map((hero, index) => (
                <ItemCard
                  key={hero.newsherosection}
                  item={{
                    ...hero,
                    id: hero.newsherosection,
                    banner: hero.bannerImageUrl,
                    date: new Date(hero.createdAt).toLocaleDateString()
                  }}
                  type="hero"
                  isLatest={index === 0 && heroSections.length > 0}
                  actions={[
                    { label: hero.isActive ? 'Hide' : 'Show', onClick: () => toggleVisibility(hero.newsherosection, 'hero'), className: 'hide' },
                    { label: 'Delete', onClick: () => deleteItem(hero.newsherosection, 'hero'), className: 'delete' },
                    { label: 'Edit', onClick: () => {
                      setFormData({
                        title: hero.title,
                        content: hero.content,
                        tags: hero.tags,
                        bannerImageUrl: hero.bannerImageUrl
                      })
                      setEditingItem(hero)
                      setShowForm(true)
                    }, className: 'edit' }
                  ]}
                />
              ))}
              
              {activeSubSection === 'trending' && trendingTopics.map(topic => (
                <ItemCard
                  key={topic.newstrendingtopics}
                  item={{
                    ...topic,
                    id: topic.newstrendingtopics,
                    image: topic.imageUrl,
                    date: new Date(topic.createdAt).toLocaleDateString(),
                    visible: topic.isVisible
                  }}
                  type="trending"
                  actions={[
                    { label: topic.isVisible ? 'Hide' : 'Show', onClick: () => toggleVisibility(topic.newstrendingtopics, 'trending'), className: 'hide' },
                    { label: 'Delete', onClick: () => deleteItem(topic.newstrendingtopics, 'trending'), className: 'delete' },
                    { label: 'Edit', onClick: () => {
                      setFormData({
                        title: topic.title,
                        description: topic.description,
                        imageUrl: topic.imageUrl
                      })
                      setEditingItem(topic)
                      setShowForm(true)
                    }, className: 'edit' }
                  ]}
                />
              ))}

              {activeSubSection === 'insights' && expertInsights.map(insight => (
                <ItemCard
                  key={insight.newsexpertinsights}
                  item={{
                    ...insight,
                    id: insight.newsexpertinsights,
                    name: insight.expertName,
                    video: insight.videoUrl,
                    thumbnail: insight.thumbnailUrl,
                    date: new Date(insight.createdAt).toLocaleDateString(),
                    visible: insight.isVisible
                  }}
                  type="insights"
                  actions={[
                    { label: insight.isVisible ? 'Hide' : 'Show', onClick: () => toggleVisibility(insight.newsexpertinsights, 'insights'), className: 'hide' },
                    { label: 'Delete', onClick: () => deleteItem(insight.newsexpertinsights, 'insights'), className: 'delete' },
                    { label: 'Edit', onClick: () => {
                      setFormData({
                        title: insight.title,
                        name: insight.expertName,
                        designation: insight.designation,
                        videoUrl: insight.videoUrl,
                        thumbnailUrl: insight.thumbnailUrl
                      })
                      setEditingItem(insight)
                      setShowForm(true)
                    }, className: 'edit' }
                  ]}
                />
              ))}
              
              {activeSubSection === 'posted' && postedNews.map(news => (
                <ItemCard
                  key={news.staffinnpostednews}
                  item={{
                    ...news,
                    id: news.staffinnpostednews,
                    banner: news.bannerImageUrl,
                    date: new Date(news.createdAt).toLocaleDateString(),
                    visible: news.isVisible
                  }}
                  type="posted"
                  actions={[
                    { label: news.isVisible ? 'Hide' : 'Show', onClick: () => toggleVisibility(news.staffinnpostednews, 'posted'), className: 'hide' },
                    { label: 'Delete', onClick: () => deleteItem(news.staffinnpostednews, 'posted'), className: 'delete' },
                    { label: 'Edit', onClick: () => {
                      setFormData({
                        title: news.title,
                        description: news.description,
                        bannerImageUrl: news.bannerImageUrl
                      })
                      setEditingItem(news)
                      setShowForm(true)
                    }, className: 'edit' }
                  ]}
                />
              ))}
            </div>

            {activeSubSection === 'trending' && trendingTopics.length >= 15 && (
              <p className="admin-limit-warning">Maximum 15 topics allowed</p>
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
    </div>
  )
}

export default AdminPanel
 