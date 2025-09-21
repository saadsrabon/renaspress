// WordPress API AuthentiionConfiguration
const WORDPRESS_API_BASE = process.env.WORDPRESS_API_BASE
const WORDPRESS_API_USERNAME = process.env.WORDPRESS_API_USERNAME 
const WORDPRESS_API_PASSWORD = process.env.WORDPRESS_API_PASSWORD 

// Helper function to create authenticated headers
export function getAuthHeaders() {
  const auth = Buffer.from(`${WORDPRESS_API_USERNAME}:${WORDPRESS_API_PASSWORD}`).toString('base64')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
  }
}

// Export the API base URL
export { WORDPRESS_API_BASE }
