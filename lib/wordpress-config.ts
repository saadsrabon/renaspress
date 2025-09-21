// WordPress configuration
export const WORDPRESS_CONFIG = {
  // Change this to your WordPress site URL
  BASE_URL: 'https://renaspress.com',
  
  // API endpoints
  ENDPOINTS: {
    // Standard WordPress API
    POSTS: '/wp-json/wp/v2/posts',
    USERS: '/wp-json/wp/v2/users',
    MEDIA: '/wp-json/wp/v2/media',
    
    // Custom API endpoints from functions.php
    USER_INFO: '/wp-json/custom/v1/user',
    USER_POSTS: '/wp-json/custom/v1/user/posts',
    POST_UPDATE: (id: number) => `/wp-json/custom/v1/posts/${id}`,
    POST_DELETE: (id: number) => `/wp-json/custom/v1/posts/${id}`,
    BUNNY_UPLOAD: '/wp-json/custom/v1/media/bunny-upload',
    USER_MEDIA: '/wp-json/custom/v1/media',
    
    // JWT Authentication
    JWT_TOKEN: '/wp-json/jwt-auth/v1/token',
    JWT_VALIDATE: '/wp-json/jwt-auth/v1/token/validate',
    
    // Forum endpoints
    FORUM_TOPICS: '/wp-json/wp/v2/forum-topics',
    FORUM_CATEGORIES: '/wp-json/wp/v2/forum_category',
    COMMENTS: '/wp-json/forum/v1/comments',
    TOPIC_COMMENTS: (topicId: number) => `/wp-json/forum/v1/topics/${topicId}/comments`
  }
}

// Helper function to get full API URL
export function getWordPressUrl(endpoint: string): string {
  return `${WORDPRESS_CONFIG.BASE_URL}${endpoint}`
}

