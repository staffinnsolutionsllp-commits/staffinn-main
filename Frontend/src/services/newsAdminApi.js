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

  // Get latest hero section
  static async getLatestHeroSection() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/hero-sections/latest`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get latest hero section');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting latest hero section:', error);
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

  // Get visible trending topics
  static async getVisibleTrendingTopics() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/trending-topics/visible`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get visible trending topics');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting visible trending topics:', error);
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

  // Get visible expert insights
  static async getVisibleExpertInsights() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/expert-insights/visible`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get visible expert insights');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting visible expert insights:', error);
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
}

export default NewsAdminAPI;