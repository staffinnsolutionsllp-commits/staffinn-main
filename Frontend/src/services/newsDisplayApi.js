/**
 * News Display API Service
 * Handles API calls for displaying news on the frontend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

class NewsDisplayAPI {
  /**
   * Get latest hero section for featured news display
   */
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
      return { success: false, data: null };
    }
  }

  /**
   * Get visible trending topics for slider display
   */
  static async getVisibleTrendingTopics() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/trending-topics/visible`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get trending topics');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Get visible expert insights for cards display
   */
  static async getVisibleExpertInsights() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/expert-insights/visible`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get expert insights');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting expert insights:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Get visible posted news for news feed display
   */
  static async getVisiblePostedNews() {
    try {
      const response = await fetch(`${API_BASE_URL}/news-admin/posted-news/visible`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get posted news');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting posted news:', error);
      return { success: false, data: [] };
    }
  }
}

export default NewsDisplayAPI;