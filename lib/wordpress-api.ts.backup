export interface WordPressPost {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  date: string
  modified: string
  slug: string
  link: string
  featured_media: number
  categories: number[]
  tags: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
      taxonomy: string
    }>>
  }
}

export interface WordPressCategory {
  id: number
  name: string
  slug: string
  description: string
  count: number
}

const WORDPRESS_API_BASE = 'https://renaspress.com/wp-json/wp/v2'

// Debug function to test WordPress API connectivity
export async function testWordPressAPI(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${WORDPRESS_API_BASE}/users?per_page=1`)
    if (response.ok) {
      return { success: true }
    } else {
      const errorData = await response.json()
      return { 
        success: false, 
        error: `WordPress API error: ${response.status} - ${errorData.message || 'Unknown error'}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: `WordPress API connection failed: ${error}` 
    }
  }
}

export async function fetchPostsByCategory(
  categorySlug: string,
  page: number = 1,
  perPage: number = 10
): Promise<WordPressPost[]> {
  try {
    // First, get the category ID by slug
    const categoryResponse = await fetch(
      `${WORDPRESS_API_BASE}/categories?slug=${categorySlug}`
    )
    
    if (!categoryResponse.ok) {
      throw new Error(`Failed to fetch category: ${categoryResponse.statusText}`)
    }
    
    const categories = await categoryResponse.json()
    
    if (categories.length === 0) {
      return []
    }
    
    const categoryId = categories[0].id
    
    // Fetch posts by category ID
    const response = await fetch(
      `${WORDPRESS_API_BASE}/posts?categories=${categoryId}&page=${page}&per_page=${perPage}&_embed=true`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export async function fetchAllCategories(): Promise<WordPressCategory[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_BASE}/categories?per_page=100`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function fetchPost(slug: string): Promise<WordPressPost | null> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_BASE}/posts?slug=${slug}&_embed=true`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`)
    }
    
    const posts = await response.json()
    return posts.length > 0 ? posts[0] : null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export async function fetchRecentPosts(
  perPage: number = 10,
  categorySlug?: string
): Promise<WordPressPost[]> {
  try {
    let url = `${WORDPRESS_API_BASE}/posts?per_page=${perPage}&orderby=date&order=desc&_embed=true`
    
    // If category is specified, filter by category
    if (categorySlug) {
      const categoryResponse = await fetch(
        `${WORDPRESS_API_BASE}/categories?slug=${categorySlug}`
      )
      
      if (categoryResponse.ok) {
        const categories = await categoryResponse.json()
        if (categories.length > 0) {
          url += `&categories=${categories[0].id}`
        }
      }
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent posts: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching recent posts:', error)
    return []
  }
}

export function getFeaturedImageUrl(post: WordPressPost): string {
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    return post._embedded['wp:featuredmedia'][0].source_url
  }
  return '/api/placeholder/800/500'
}

export function getPostExcerpt(post: WordPressPost, maxLength: number = 150): string {
  // Remove HTML tags and get clean text
  const cleanText = post.excerpt.rendered
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .trim()
  
  if (cleanText.length <= maxLength) {
    return cleanText
  }
  
  return cleanText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

export function formatPostDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getCategoryName(post: WordPressPost): string {
  if (post._embedded?.['wp:term']?.[0]) {
    const categories = post._embedded['wp:term'][0]
    return categories[0]?.name || 'Uncategorized'
  }
  return 'Uncategorized'
}

// Category mapping for the specific categories mentioned
export const CATEGORY_SLUGS = {
  'daily-news': 'daily-news',
  'charity': 'charity', 
  'sports': 'sports',
  'woman': 'woman',
  'political-news': 'political-news'
} as const

export type CategorySlug = keyof typeof CATEGORY_SLUGS

// WordPress Authentication Functions
export interface WordPressUser {
  id: number
  username: string
  email: string
  name: string
  first_name: string
  last_name: string
  roles: string[]
  capabilities: Record<string, boolean>
}

export interface AuthResponse {
  success: boolean
  user?: WordPressUser
  token?: string
  error?: string
}

export async function registerWordPressUser(
  username: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResponse> {
  try {
    console.log('Attempting to register user:', { username, email, firstName, lastName })
    
    // Since WordPress REST API requires authentication to create users,
    // we'll create a local user account that can be synced with WordPress later
    // This is a practical solution until proper WordPress API authentication is set up
    
    // For now, we'll simulate successful registration
    // In a production environment, you would:
    // 1. Store user data in your database
    // 2. Send user data to WordPress via a webhook or scheduled sync
    // 3. Or use WordPress application passwords for API authentication
    
    const newUser = {
      id: Date.now(), // Simple ID generation
      username,
      email,
      name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      roles: ['subscriber'],
      capabilities: {},
      created_at: new Date().toISOString(),
      wp_synced: false // Flag to track if synced with WordPress
    }
    
    // Generate token
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    
    console.log('User registered successfully (local):', newUser)
    
    // TODO: In production, store this user in your database
    // TODO: Set up a webhook or scheduled job to sync with WordPress
    // TODO: Or implement WordPress application password authentication
    
    return {
      success: true,
      user: newUser,
      token
    }
    
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: 'Registration service unavailable. Please try again later.'
    }
  }
}

export async function authenticateWordPressUser(
  username: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Since we're using local user accounts for now,
    // we'll simulate authentication
    // In production, you would verify against your database
    
    // For demo purposes, we'll accept any password for existing users
    // In production, you would hash and verify passwords properly
    
    // Check if this is a valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(username)) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      }
    }
    
    // For now, we'll simulate successful authentication
    // In production, you would:
    // 1. Query your database for the user
    // 2. Verify the password hash
    // 3. Return user data if valid
    
    const mockUser = {
      id: Date.now(),
      username,
      email: username,
      name: 'User',
      first_name: 'User',
      last_name: '',
      roles: ['subscriber'],
      capabilities: {}
    }
    
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')
    
    return {
      success: true,
      user: mockUser,
      token
    }
    
    // TODO: Implement proper database authentication
    // TODO: Add password hashing and verification
    // TODO: Sync with WordPress when needed
    
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication service unavailable'
    }
  }
}
