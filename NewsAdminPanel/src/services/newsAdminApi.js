/**
 * News Admin API Service
 * Handles API calls for News Admin Panel
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';


class NewsAdminAPI {
  /**
   * Hero Sections API
   */
  
  // Create new hero section
  static async createHeroSection(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/hero-sections`, {
        method: 'POST',
        body: formData // FormData object with file
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create hero section');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating hero section:', error);
      throw error;
    }
  }

  // Get all hero sections
  static async getAllHeroSections() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/hero-sections`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get hero sections');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting hero sections:', error);
      throw error;
    }
  }

  // Update hero section
  static async updateHeroSection(heroId, formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/hero-sections/${heroId}`, {
        method: 'PUT',
        body: formData // FormData object with file
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update hero section');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating hero section:', error);
      throw error;
    }
  }

  // Toggle hero section visibility
  static async toggleHeroSectionVisibility(heroId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/hero-sections/${heroId}/toggle-visibility`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle hero section visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Error toggling hero section visibility:', error);
      throw error;
    }
  }

  // Delete hero section
  static async deleteHeroSection(heroId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/hero-sections/${heroId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete hero section');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting hero section:', error);
      throw error;
    }
  }

  /**
   * Trending Topics API
   */
  
  // Create new trending topic
  static async createTrendingTopic(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/trending-topics`, {
        method: 'POST',
        body: formData // FormData object with file
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create trending topic');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating trending topic:', error);
      throw error;
    }
  }

  // Get all trending topics
  static async getAllTrendingTopics() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/trending-topics`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get trending topics');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting trending topics:', error);
      throw error;
    }
  }

  // Update trending topic
  static async updateTrendingTopic(topicId, formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/trending-topics/${topicId}`, {
        method: 'PUT',
        body: formData // FormData object with file
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update trending topic');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating trending topic:', error);
      throw error;
    }
  }

  // Toggle trending topic visibility
  static async toggleTrendingTopicVisibility(topicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/trending-topics/${topicId}/toggle-visibility`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle trending topic visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Error toggling trending topic visibility:', error);
      throw error;
    }
  }

  // Delete trending topic
  static async deleteTrendingTopic(topicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/trending-topics/${topicId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete trending topic');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting trending topic:', error);
      throw error;
    }
  }

  /**
   * Expert Insights API
   */
  
  // Create new expert insight
  static async createExpertInsight(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/expert-insights`, {
        method: 'POST',
        body: formData // FormData object with files
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create expert insight');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating expert insight:', error);
      throw error;
    }
  }

  // Get all expert insights
  static async getAllExpertInsights() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/expert-insights`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get expert insights');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting expert insights:', error);
      throw error;
    }
  }

  // Update expert insight
  static async updateExpertInsight(insightId, formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/expert-insights/${insightId}`, {
        method: 'PUT',
        body: formData // FormData object with files
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update expert insight');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating expert insight:', error);
      throw error;
    }
  }

  // Toggle expert insight visibility
  static async toggleExpertInsightVisibility(insightId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/expert-insights/${insightId}/toggle-visibility`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle expert insight visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Error toggling expert insight visibility:', error);
      throw error;
    }
  }

  // Delete expert insight
  static async deleteExpertInsight(insightId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/expert-insights/${insightId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete expert insight');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting expert insight:', error);
      throw error;
    }
  }

  /**
   * Recruiter News API
   */
  
  // Get all recruiter news
  static async getAllRecruiterNews() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/recruiter-news`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recruiter news');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting recruiter news:', error);
      return { success: false, data: [] };
    }
  }

  // Toggle recruiter news visibility
  static async toggleRecruiterNewsVisibility(newsId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/recruiter-news/${newsId}/toggle-visibility`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle recruiter news visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Error toggling recruiter news visibility:', error);
      throw error;
    }
  }

  // Delete recruiter news
  static async deleteRecruiterNews(newsId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/recruiter-news/${newsId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete recruiter news');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting recruiter news:', error);
      throw error;
    }
  }

  /**
   * Institute News API
   */
  
  // Get all institute news
  static async getAllInstituteNews() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/institute-news`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get institute news');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting institute news:', error);
      return { success: false, data: [] };
    }
  }

  // Toggle institute news visibility
  static async toggleInstituteNewsVisibility(newsId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/institute-news/${newsId}/toggle-visibility`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle institute news visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Error toggling institute news visibility:', error);
      throw error;
    }
  }

  // Delete institute news
  static async deleteInstituteNews(newsId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/institute-news/${newsId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete institute news');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting institute news:', error);
      throw error;
    }
  }

  /**
   * Posted News API
   */
  
  // Create new posted news
  static async createPostedNews(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/posted-news`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create posted news');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating posted news:', error);
      throw error;
    }
  }

  // Get all posted news
  static async getAllPostedNews() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/posted-news`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get posted news');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting posted news:', error);
      throw error;
    }
  }

  // Get visible posted news
  static async getVisiblePostedNews() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/posted-news/visible`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get visible posted news');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting visible posted news:', error);
      throw error;
    }
  }

  // Update posted news
  static async updatePostedNews(newsId, formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/posted-news/${newsId}`, {
        method: 'PUT',
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update posted news');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating posted news:', error);
      throw error;
    }
  }

  // Toggle posted news visibility
  static async togglePostedNewsVisibility(newsId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/posted-news/${newsId}/toggle-visibility`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle posted news visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Error toggling posted news visibility:', error);
      throw error;
    }
  }

  // Delete posted news
  static async deletePostedNews(newsId) {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/posted-news/${newsId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete posted news');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting posted news:', error);
      throw error;
    }
  }
}

export default NewsAdminAPI;